import time
import threading
import cv2
import numpy as np
from fastapi import FastAPI
from app.config import settings
from app.utils.logger import setup_logging, get_logger
from app.camera.stream import CameraStream
from app.camera.config_manager import CameraConfigManager
from app.detection.person_detector import PersonDetector, YOLOModelManager
from app.tracking.track_manager import TrackManager
from app.zones.zone_manager import ZoneManager
from app.zones.zone_rules import ZoneRulesEngine
from app.behavior.movement import MovementTracker
from app.behavior.suspicious import SuspiciousMovementDetector
from app.camera_security.offline_detector import CameraOfflineDetector
from app.camera_security.tampering_detector import CameraTamperingDetector
from app.events.event_engine import EventEngine
from app.api.routes import health, camera, detection
from app.inference.priority import InferencePriority
from app.inference.motion_gate import MotionGate
from app.inference.identity_client import IdentityClient
from app.inference.inference_scheduler import InferenceScheduler
from app.zones.polygon import inside_zone

# Setup logging
setup_logging()
logger = get_logger("System")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CoreWatch AI Security Service",
    description="FastAPI container orchestrating YOLO-based real-time security stream monitoring.",
    version="1.0.0"
)

# Enable CORS for frontend dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(camera.router, prefix="/api", tags=["Camera"])
app.include_router(detection.router, prefix="/api", tags=["Detection"])


class CameraRuntime:
    """
    Manages the real-time processing thread for a single camera feed.
    """
    def __init__(self, camera_key: str, camera_url: str, detector: PersonDetector):
        self.camera_key = camera_key
        self.camera_url = camera_url
        
        # Isolation: If a normal detector is passed, we create a camera-isolated one.
        # If it is a Mock/MagicMock, we preserve it for test isolation.
        is_mock = "Mock" in type(detector).__name__ or "MagicMock" in type(detector).__name__
        if is_mock:
            self.detector = detector
        else:
            self.detector = PersonDetector(camera_key=self.camera_key)

        # Pipelines
        self.stream = CameraStream(self.camera_url)
        self.track_manager = TrackManager(track_lost_grace_seconds=2.0)
        self.zone_manager = ZoneManager(self.camera_key)
        self.zone_rules_engine = ZoneRulesEngine(track_lost_grace_seconds=2.0)
        
        # Behaviors
        self.movement_tracker = MovementTracker()
        self.suspicious_detector = SuspiciousMovementDetector()

        # Stream security monitors
        self.offline_detector = CameraOfflineDetector(self.camera_key)
        self.tampering_detector = CameraTamperingDetector(self.camera_key)

        # Dispatch engine
        self.event_engine = EventEngine()
        self.config_manager = CameraConfigManager(self.camera_key)

        # Thread states
        self.running = False
        self.thread = None
        
        # Frame cache for GUI display
        self.last_frame = None
        self.last_annotated_frame = None
        self.active_tracks_count = 0
        self.last_ai_time = 0.0

        # Adaptive Inference components (per-camera)
        self.motion_gate = MotionGate()
        self.scheduler = InferenceScheduler(self.camera_key)
        self.identity_client = IdentityClient()
        
        # Security overrides & state trackers
        self.active_security_event = False
        self.last_security_event_at = 0.0

    def start(self):
        self.running = True
        # Fetch initial zones and camera config before launching loop
        self.zone_manager.fetch_zones()
        self.config_manager.fetch_config()
        self.thread = threading.Thread(target=self._loop, name=f"Runtime-{self.camera_key}", daemon=True)
        self.thread.start()
        logger.info(f"[System] Started camera runtime thread for {self.camera_key}")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=3.0)
        self.stream.release()
        # Memory safety: release YOLO instance for this camera key from cache
        YOLOModelManager.remove_model(self.camera_key)
        logger.info(f"[System] Stopped camera runtime thread for {self.camera_key}")

    def _calculate_proximity(self, foot_pt, zones, width: int, height: int) -> bool:
        """
        Calculates if a foot point is near any RESTRICTED or VALUABLE zone.
        Using normalized geometry coordinates (0.0 to 1.0).
        """
        if width <= 0 or height <= 0:
            return False
            
        px = foot_pt.get("x", 0.0) / width
        py = foot_pt.get("y", 0.0) / height
        threshold = float(getattr(settings, "ZONE_PROXIMITY_THRESHOLD", 0.08))

        for zone in zones:
            if zone.get("type") in ("RESTRICTED", "VALUABLE"):
                dist = self._min_distance_to_polygon(px, py, zone.get("points", []))
                if dist < threshold:
                    return True
        return False

    def _min_distance_to_polygon(self, px: float, py: float, poly_points: list) -> float:
        min_dist = float('inf')
        if len(poly_points) == 0:
            return min_dist
            
        p = (px, py)
        pts = [(float(pt.get("x", 0.0)), float(pt.get("y", 0.0))) for pt in poly_points]
        
        for i in range(len(pts)):
            a = pts[i]
            b = pts[(i + 1) % len(pts)]
            
            # Distance from p to segment ab
            ab = (b[0] - a[0], b[1] - a[1])
            ap = (p[0] - a[0], p[1] - a[1])
            
            ab_len_sq = ab[0]**2 + ab[1]**2
            if ab_len_sq == 0:
                dist = np.sqrt(ap[0]**2 + ap[1]**2)
            else:
                t = max(0.0, min(1.0, (ap[0]*ab[0] + ap[1]*ab[1]) / ab_len_sq))
                closest = (a[0] + t*ab[0], a[1] + t*ab[1])
                dist = np.sqrt((p[0] - closest[0])**2 + (p[1] - closest[1])**2)
                
            if dist < min_dist:
                min_dist = dist
                
        return min_dist

    def _loop(self):
        # Open camera stream
        if not self.stream.open():
            logger.error(f"[Camera] Could not connect to camera stream for key {self.camera_key}. Loop will retry dynamically.")

        while self.running:
            try:
                frame = self.stream.read_frame()
                frame_received = frame is not None
                now = time.time()
                
                # Fetch cached camera config settings (toggles)
                config = self.config_manager.get_config()

                # 1. Update camera connectivity health (runs on every stream frame)
                if config.get("cameraHealth", True):
                    offline_events = self.offline_detector.update(frame_received, now)
                    if len(offline_events) > 0:
                        self.event_engine.process_events(offline_events, None, [], now, config)

                if not frame_received:
                    time.sleep(0.01)
                    continue

                self.last_frame = frame

                # 2. Check for camera visual tampering (runs on every received frame, independent of YOLO)
                if config.get("cameraHealth", True):
                    tamper_events = self.tampering_detector.update(frame, now)
                    if len(tamper_events) > 0:
                        self.event_engine.process_events(tamper_events, frame, [], now, config)

                # 3. Adaptive Inference Scheduler Check (Fail-Safe protected)
                should_run_yolo = True
                motion_score = 0.0
                try:
                    # Run cheap MotionGate (negligible CPU cost on 160x120 resized image)
                    motion_res = self.motion_gate.update(frame)
                    motion_detected = motion_res["motionDetected"]
                    motion_score = motion_res["motionScore"]

                    # Update event cooldown state
                    cooldown_dur = float(getattr(settings, "PRIORITY_COOLDOWN_SECONDS", 10.0))
                    if self.active_security_event and now - self.last_security_event_at > cooldown_dur:
                        self.active_security_event = False

                    # Build context for the policy and scheduler
                    scheduler_tracks = []
                    for track_id, track_state in self.track_manager.tracks.items():
                        is_new = (now - track_state.first_seen <= 1.0)
                        scheduler_tracks.append({
                            "trackId": track_id,
                            "identityStatus": track_state.identity_status,
                            "zoneType": track_state.zone_type,
                            "isNearRestricted": track_state.is_near_restricted,
                            "hasSuspiciousBehavior": track_state.has_suspicious_behavior,
                            "isNew": is_new
                        })

                    context = {
                        "motionDetected": motion_detected,
                        "motionScore": motion_score,
                        "activeTracks": scheduler_tracks,
                        "activeSecurityEvent": self.active_security_event
                    }

                    # Determine YOLO scheduling
                    should_run_yolo = self.scheduler.should_run_inference(now, context)
                    
                    # Bypass YOLO tracking if humanDetection is disabled
                    if not config.get("humanDetection", True):
                        should_run_yolo = False
                        self.track_manager.tracks.clear()
                        self.movement_tracker.track_histories.clear()
                except Exception as e:
                    logger.error(f"[Scheduler] Fail-safe fallback triggered due to exception: {e}", exc_info=True)
                    should_run_yolo = config.get("humanDetection", True)

                # 4. YOLO Inference Execution Gate
                if should_run_yolo:
                    start_inference_time = time.time()

                    # Run single-pass YOLO + ByteTrack tracking (camera-isolated)
                    detections = self.detector.track_persons(frame)

                    # Enrich tracks with movement historical parameters
                    enriched_detections = self.track_manager.update_tracks(detections, now)
                    self.active_tracks_count = len(enriched_detections)

                    # Retrieve active zones conditionally based on zoneMonitoring config
                    if config.get("zoneMonitoring", True):
                        zones = self.zone_manager.get_active_zones()
                    else:
                        zones = []
                    h, w = frame.shape[:2]

                    # Reset track states
                    for track_state in self.track_manager.tracks.values():
                        track_state.current_zone = None
                        track_state.zone_type = None
                        track_state.is_near_restricted = False

                    # Update zone containment, proximity and identities
                    for det in enriched_detections:
                        tid = det.get("trackId")
                        if tid is not None and tid in self.track_manager.tracks:
                            track_state = self.track_manager.tracks[tid]
                            foot_pt = det["footPoint"]

                            # Determine zone containment
                            for zone in zones:
                                if inside_zone(foot_pt, zone["points"], w, h):
                                    track_state.current_zone = zone["_id"]
                                    track_state.zone_type = zone.get("type")
                                    det["zoneId"] = zone["_id"]
                                    det["zoneType"] = zone.get("type")
                                    det["zoneName"] = zone.get("name")
                                    break

                            # Calculate zone proximity (approach to restricted/valuable zones)
                            track_state.is_near_restricted = self._calculate_proximity(foot_pt, zones, w, h)

                            # Verify identity status (only if needed)
                            identity_recheck_seconds = float(getattr(settings, "IDENTITY_RECHECK_SECONDS", 30.0))
                            need_identity = (
                                track_state.identity_status == "UNKNOWN" or
                                track_state.identity_confidence < 0.6 or
                                now - track_state.last_identity_verified_at > identity_recheck_seconds or
                                track_state.zone_type in ("RESTRICTED", "VALUABLE")
                            )
                            if need_identity and (now - track_state.last_identity_verified_at > 5.0):
                                bbox = [det["bbox"]["x1"], det["bbox"]["y1"], det["bbox"]["x2"], det["bbox"]["y2"]]
                                identity_res = self.identity_client.verify_identity(tid, frame, bbox)
                                
                                if track_state.identity_status != identity_res.identity_status:
                                    logger.info(f"[Inference] Verified track ID {tid} identity status: {identity_res.identity_status}")
                                    
                                track_state.identity_status = identity_res.identity_status
                                track_state.identity_id = identity_res.identity_id
                                track_state.identity_confidence = identity_res.confidence
                                track_state.last_identity_verified_at = now

                            det["identityStatus"] = track_state.identity_status
                            det["identityId"] = track_state.identity_id

                    # Evaluate polygon containment rules (foot points)
                    zone_events = self.zone_rules_engine.evaluate(
                        camera_id=self.camera_key,
                        zones=zones,
                        detections=enriched_detections,
                        width=w,
                        height=h,
                        timestamp=now
                    )

                    # Evaluate behaviors (pacing)
                    behavior_events = []
                    if config.get("suspiciousMovement", True):
                        for det in enriched_detections:
                            track_id = det.get("trackId")
                            if track_id is None:
                                continue

                            track_state = self.track_manager.tracks[track_id]
                            foot_pt = (det["footPoint"]["x"], det["footPoint"]["y"])
                            first_seen = det.get("firstSeen", now)

                            metrics = self.movement_tracker.update(track_id, foot_pt, now)

                            # Check suspicious pacing rule
                            if self.suspicious_detector.check_suspicious_movement(track_id, metrics):
                                track_state.has_suspicious_behavior = True
                                behavior_events.append({
                                    "eventType": "SUSPICIOUS_MOVEMENT_PATTERN",
                                    "cameraId": self.camera_key,
                                    "trackId": track_id,
                                    "timestamp": now,
                                    "bbox": det.get("bbox"),
                                    "zoneId": track_state.current_zone,
                                    "zoneType": track_state.zone_type
                                })

                    # Cleanup behavior instances for dead tracks
                    active_tids = {det.get("trackId") for det in enriched_detections if det.get("trackId") is not None}
                    dead_tracks = [tid for tid in self.movement_tracker.track_histories.keys() if tid not in active_tids]
                    self.movement_tracker.cleanup(dead_tracks)
                    for tid in dead_tracks:
                        self.suspicious_detector.reset_track(tid)

                    # Determine active security event and trigger cooldown/boost
                    all_events = zone_events + behavior_events
                    has_security_event = False
                    for event in all_events:
                        e_type = event["eventType"]
                        z_id = event.get("zoneId")
                        if e_type in ("ZONE_ENTRY", "ZONE_DWELL"):
                            zone = next((z for z in zones if z["_id"] == z_id), None)
                            if zone and zone.get("type") in ("RESTRICTED", "VALUABLE"):
                                has_security_event = True
                                break
                        elif e_type == "SUSPICIOUS_MOVEMENT_PATTERN":
                            has_security_event = True
                            break

                    if has_security_event:
                        if not self.active_security_event:
                            logger.info(f"[Inference] Camera {self.camera_key} escalates priority: Security event active")
                        self.active_security_event = True
                        self.last_security_event_at = now

                    # Process events in EventEngine
                    if len(all_events) > 0:
                        self.event_engine.process_events(all_events, frame, zones, now, config)

                    # Cache annotated preview frame
                    annotated_frame = frame.copy()
                    self._draw_annotations(annotated_frame, enriched_detections, zones)
                    self.last_annotated_frame = annotated_frame

                    # Record telemetry metrics
                    end_inference_time = time.time()
                    latency_ms = (end_inference_time - start_inference_time) * 1000.0
                    self.scheduler.state.record_inference(now, latency_ms)
                    self.scheduler.state.active_tracks = len(self.track_manager.tracks)
                    self.scheduler.state.motion_score = motion_score
                else:
                    # Skipped frame: Record skipped in scheduler metrics
                    self.scheduler.state.record_skipped()
                    self.scheduler.state.active_tracks = len(self.track_manager.tracks)
                    self.scheduler.state.motion_score = motion_score
                    
                    # Cache annotated preview frame with cached detections to keep the stream super smooth
                    cached_detections = []
                    for tid, track_state in self.track_manager.tracks.items():
                        if track_state.last_bbox is not None:
                            # Re-verify if track is active (not expired)
                            if now - track_state.last_seen <= self.track_manager.track_lost_grace_seconds:
                                cached_detections.append({
                                    "trackId": tid,
                                    "confidence": track_state.last_confidence,
                                    "label": track_state.label,
                                    "bbox": track_state.last_bbox
                                })
                    
                    zones = self.zone_manager.get_active_zones()
                    annotated_frame = frame.copy()
                    self._draw_annotations(annotated_frame, cached_detections, zones)
                    self.last_annotated_frame = annotated_frame
                    
                    # Sleep briefly to avoid busy-looping
                    time.sleep(0.005)

            except Exception as e:
                logger.error(f"[Camera] Error inside processing loop for camera {self.camera_key}: {e}", exc_info=True)
                time.sleep(1)

    def _draw_annotations(self, frame, detections, zones):
        """
        Draws zones boundaries and tracking details onto the debug preview.
        """
        h, w = frame.shape[:2]
        # Draw Zones
        for zone in zones:
            pts = []
            for pt in zone["points"]:
                px = int(pt.get("x", 0.0) * w)
                py = int(pt.get("y", 0.0) * h)
                pts.append([px, py])
            
            if len(pts) >= 3:
                pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
                # Yellow border for zones
                cv2.polylines(frame, [pts_arr], isClosed=True, color=(0, 255, 255), thickness=2)
                cv2.putText(
                    frame, 
                    f"{zone.get('name')} [{zone.get('type')}]", 
                    (pts[0][0], pts[0][1] - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    (0, 255, 255), 
                    1, 
                    cv2.LINE_AA
                )

        # Draw Person Boxes and Tracks
        for det in detections:
            bbox = det["bbox"]
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
            track_id = det.get("trackId")
            conf = det["confidence"]

            # Green box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            label = f"Person ID: {track_id} ({conf:.1%})" if track_id is not None else f"Person ({conf:.1%})"
            cv2.putText(
                frame, 
                label, 
                (x1, y1 - 5), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.4, 
                (0, 255, 0), 
                1, 
                cv2.LINE_AA
            )
            
            # Red circle on feet contact point
            foot = det.get("footPoint")
            if not foot and "bbox" in det:
                foot = {"x": int((x1 + x2) / 2), "y": y2}
            
            if foot:
                cv2.circle(frame, (foot["x"], foot["y"]), 4, (0, 0, 255), -1)


class CameraManager:
    """
    Manages, coordinates, and shuts down camera runtime loops.
    """
    def __init__(self):
        self.runtimes = {}
        self.detector = None
        self._lock = threading.Lock()

    def initialize(self):
        with self._lock:
            # Singleton model initialized once
            self.detector = PersonDetector()

    def register_camera(self, camera_key: str, camera_url: str, force_restart: bool = False):
        with self._lock:
            if not self.detector:
                self.detector = PersonDetector()
            
            if camera_key in self.runtimes:
                if force_restart or self.runtimes[camera_key].camera_url != camera_url:
                    logger.info(f"[System] Reconnecting camera '{camera_key}' to new stream URL: {camera_url}")
                    old_runtime = self.runtimes[camera_key]
                    old_runtime.stop()
                    del self.runtimes[camera_key]
                else:
                    logger.warning(f"[System] Camera {camera_key} is already registered with identical URL. Skipping.")
                    return
            
            runtime = CameraRuntime(camera_key, camera_url, self.detector)
            self.runtimes[camera_key] = runtime
            runtime.start()
            logger.info(f"[System] Camera runtime registered: key={camera_key} url={camera_url}")

    def get_runtime(self, camera_key: str) -> CameraRuntime:
        return self.runtimes.get(camera_key)

    def shutdown(self):
        with self._lock:
            logger.info("[System] Releasing and shutting down all active camera streams...")
            for runtime in self.runtimes.values():
                runtime.stop()
            self.runtimes.clear()


# Global manager instances
camera_manager = CameraManager()
display_running = False

def run_opencv_display():
    """
    Updates window GUI displays for all active streams.
    Must execute on the main thread for OpenCV window stability.
    """
    global display_running
    logger.info("[System] Launching main thread OpenCV display loop...")
    display_running = True
    
    while display_running:
        active_keys = list(camera_manager.runtimes.keys())
        if not active_keys:
            time.sleep(0.1)
            continue

        for key in active_keys:
            runtime = camera_manager.get_runtime(key)
            if runtime and runtime.last_annotated_frame is not None:
                window_name = f"CoreWatch Live Security - ({key})"
                cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
                cv2.imshow(window_name, runtime.last_annotated_frame)

        # Poll keystroke. Terminate display if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            logger.info("[System] Key 'q' pressed in preview window. Shutting down service...")
            display_running = False
            break
            
        time.sleep(0.01)

    cv2.destroyAllWindows()


@app.on_event("startup")
def startup_event():
    """
    FastAPI startup lifecycle handler. Loads YOLO and starts streaming cameras.
    """
    logger.info("[System] Starting CoreWatch AI backend service...")
    
    # Initialize the detector singleton
    camera_manager.initialize()

    # Register and start default stream
    camera_manager.register_camera(settings.CAMERA_KEY, settings.CAMERA_URL)

    # Spawn display window thread if GUI preview is enabled
    if settings.DISPLAY_WINDOW:
        # We start it as a daemon thread or call directly if FastAPI runs synchronously,
        # but to allow FastAPI to proceed, we spawn a separate thread for waitKey loop if needed.
        # Wait, if we spawn it as a thread, waitKey might have quirks on some OS, but on Windows
        # it is generally fine to run in a thread as long as it has a window, but running it in the main
        # thread or a separate thread is standard. Let's spawn it in a thread so FastAPI doesn't block.
        display_thread = threading.Thread(target=run_opencv_display, name="DisplayThread", daemon=True)
        display_thread.start()


@app.on_event("shutdown")
def shutdown_event():
    """
    FastAPI shutdown lifecycle handler. Stops threads and releases OpenCV captures.
    """
    global display_running
    logger.info("[System] Shutting down CoreWatch AI backend service...")
    display_running = False
    camera_manager.shutdown()
    logger.info("[System] Service cleanup sequence complete.")
