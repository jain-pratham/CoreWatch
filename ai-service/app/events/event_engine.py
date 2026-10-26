import time
import cv2
from app.config import settings
from app.utils.logger import get_logger
from app.events.risk_engine import get_risk_severity
from app.alerts.dispatcher import AlertDispatcher
from app.security.valuable_area import process_valuable_zone_event
from app.security.cash_counter import process_cash_counter_zone_event
from app.security.door_monitor import process_door_zone_event
from app.security.after_hours import is_after_hours

logger = get_logger("Event")

class EventEngine:
    """
    Evaluates generated events, performs deduplication with cooldown tracking, 
    evaluates time schedules, applies risk mapping, draws overlays, and queues uploads.
    """
    def __init__(self, dispatcher: AlertDispatcher = None, cooldown_seconds: float = None, zone_cooldown_seconds: float = None):
        self.dispatcher = dispatcher or AlertDispatcher()
        self.cooldown = cooldown_seconds if cooldown_seconds is not None else settings.ALERT_COOLDOWN
        self.zone_cooldown = zone_cooldown_seconds if zone_cooldown_seconds is not None else (cooldown_seconds if cooldown_seconds is not None else getattr(settings, "ZONE_COOLDOWN_SECONDS", 30.0))
        self.last_alert_times = {}  # Cooldown map: key -> timestamp

    def process_events(self, events: list, frame, zones: list, current_time: float = None, config: dict = None):
        """
        Validates alerts cooldown, coordinates after-hours overrides, creates snapshots, 
        and dispatches messages.
        """
        if current_time is None:
            current_time = time.time()

        for event in events:
            camera_id = event["cameraId"]
            event_type = event["eventType"]
            zone_id = event.get("zoneId", "stream")
            track_id = event.get("trackId", "system")
            zone_type = event.get("zoneType")

            # 1. Zone-Level Incident Suppression: Prevent multiple notifications for the same person/incident in the same zone
            zone_cooldown_key = f"{camera_id}:{zone_id}"
            last_zone_time = self.last_alert_times.get(zone_cooldown_key, 0.0)
            zone_cooldown_window = float(self.zone_cooldown)

            if event_type in ("ZONE_ENTRY", "ZONE_DWELL", "VALUABLE_AREA_ACTIVITY", "CASH_COUNTER_ACTIVITY"):
                if current_time - last_zone_time < zone_cooldown_window:
                    logger.debug(f"[Event] Zone cooldown active for {zone_cooldown_key} ({current_time - last_zone_time:.1f}s < {zone_cooldown_window}s). Suppressed duplicate alert for same person/incident.")
                    continue

            # Enforce per-camera, per-zone, per-track cooldown limits
            cooldown_key = f"{camera_id}:{zone_id}:{track_id}:{event_type}"
            last_time = self.last_alert_times.get(cooldown_key, 0.0)
            if current_time - last_time < self.cooldown:
                continue

            # 2. Enrich events according to zone types ONLY for Zone events
            if event_type in ("ZONE_ENTRY", "ZONE_DWELL"):
                if zone_type == "VALUABLE":
                    event = process_valuable_zone_event(event)
                elif zone_type == "CASH_COUNTER":
                    event = process_cash_counter_zone_event(event)
                elif zone_type == "DOOR":
                    event = process_door_zone_event(event)

            # 3. Check independent feature toggles from camera config
            current_event_type = event["eventType"]
            
            # Feature 1: Zone Monitoring Alerts (All zone events)
            if current_event_type.startswith("ZONE_") or current_event_type in (
                "VALUABLE_AREA_ACTIVITY", "CASH_COUNTER_ACTIVITY", "DOOR_AREA_ACTIVITY"
            ):
                if config and not config.get("zoneMonitoring", True):
                    logger.info(f"[Event] Filtered out {current_event_type}: zoneMonitoring is disabled for camera {camera_id}")
                    continue
            
            # Feature 2: Suspicious Movement Detection
            elif current_event_type == "SUSPICIOUS_MOVEMENT_PATTERN":
                if config and not config.get("suspiciousMovement", True):
                    logger.info(f"[Event] Filtered out SUSPICIOUS_MOVEMENT: suspiciousMovement is disabled for camera {camera_id}")
                    continue

            # Feature 3: Camera Health & Hardware Security
            elif current_event_type in ("CAMERA_OFFLINE", "CAMERA_ONLINE", "CAMERA_TAMPERING"):
                if config and not config.get("cameraHealth", True):
                    logger.info(f"[Event] Filtered out CAMERA_HEALTH: cameraHealth is disabled for camera {camera_id}")
                    continue

            # Feature 4: After-Hours Security
            elif current_event_type == "AFTER_HOURS_PRESENCE":
                if config and not config.get("afterHoursSecurity", True):
                    logger.info(f"[Event] Filtered out AFTER_HOURS_PRESENCE: afterHoursSecurity is disabled for camera {camera_id}")
                    continue

            # 4. Check after-hours zone rules
            if current_event_type in ("ZONE_ENTRY", "ZONE_DWELL"):
                zone = next((z for z in zones if z["_id"] == zone_id), None)
                if zone and zone.get("rules", {}).get("afterHoursOnly", False):
                    if config and not config.get("afterHoursSecurity", True):
                        continue
                    if is_after_hours(camera_id):
                        event["eventType"] = "AFTER_HOURS_PRESENCE"
                        event["message"] = f"After-hours intrusion detected in restricted zone: {zone.get('name')}"
                    else:
                        # Skip trigger if shop is open and afterHoursOnly is True
                        continue

            # 5. Map risk severity
            severity = get_risk_severity(event["eventType"], zone_type)
            event["severity"] = severity

            # 6. Populate descriptive messages and specific incident reasons
            zone_label = event.get('zoneName') or 'Restricted Zone'
            duration_s = int(event.get('duration', 0))
            track_id = event.get('trackId', 'Unknown')

            if "message" not in event:
                if event_type == "CAMERA_OFFLINE":
                    event["message"] = f"Camera connection dropped."
                elif event_type == "CAMERA_ONLINE":
                    event["message"] = f"Camera connection recovered."
                elif event_type == "CAMERA_TAMPERING":
                    event["message"] = f"Camera tampering detected."
                elif event_type == "SUSPICIOUS_MOVEMENT_PATTERN":
                    event["message"] = f"Suspicious movement pacing detected."
                elif event_type == "ZONE_ENTRY":
                    event["message"] = f"Person entered {zone_label}."
                elif event_type == "ZONE_DWELL":
                    event["message"] = f"Person loitering in {zone_label} ({duration_s}s dwell)."
                elif event_type == "VALUABLE_AREA_ACTIVITY":
                    event["message"] = f"Activity detected in valuable area: {zone_label}"
                elif event_type == "CASH_COUNTER_ACTIVITY":
                    event["message"] = f"Activity detected at cash counter: {zone_label}"
                elif event_type == "AFTER_HOURS_PRESENCE":
                    event["message"] = f"After-hours intrusion detected in {zone_label}."
                else:
                    event["message"] = f"Security alert triggered."

            # Construct clear, precise incident trigger reason
            if "reason" not in event:
                if event_type == "CAMERA_OFFLINE":
                    event["reason"] = f"RTSP video stream lost or network heartbeat timeout for camera {camera_id}."
                elif event_type == "CAMERA_ONLINE":
                    event["reason"] = f"Video stream successfully restored and verified operational for camera {camera_id}."
                elif event_type == "CAMERA_TAMPERING":
                    event["reason"] = f"Sudden illumination collapse or physical camera lens occlusion detected on camera {camera_id}."
                elif event_type == "SUSPICIOUS_MOVEMENT_PATTERN":
                    event["reason"] = f"Target #{track_id} exhibited erratic repeated pacing trajectory in front of surveillance perimeter."
                elif event_type == "ZONE_ENTRY":
                    event["reason"] = f"Target #{track_id} entered restricted boundary [{zone_label}] without authorization."
                elif event_type == "ZONE_DWELL":
                    event["reason"] = f"Target #{track_id} remained stationary in [{zone_label}] for {duration_s}s, exceeding maximum allowed dwell limit."
                elif event_type == "VALUABLE_AREA_ACTIVITY":
                    event["reason"] = f"Perimeter breach detected inside high-value asset storage area [{zone_label}] by Target #{track_id}."
                elif event_type == "CASH_COUNTER_ACTIVITY":
                    event["reason"] = f"Unauthorized human presence detected behind the cash counter register [{zone_label}] by Target #{track_id}."
                elif event_type == "AFTER_HOURS_PRESENCE":
                    event["reason"] = f"Human presence detected in [{zone_label}] outside scheduled operational business hours."
                else:
                    event["reason"] = f"Security surveillance rule violation on camera {camera_id} for Target #{track_id}."

            # Determine explicit decoupled category for downstream routing
            category = "ZONE_MONITORING"
            if event["eventType"] == "SUSPICIOUS_MOVEMENT_PATTERN":
                category = "SUSPICIOUS_MOVEMENT"
            elif event["eventType"] in ("CAMERA_OFFLINE", "CAMERA_ONLINE", "CAMERA_TAMPERING"):
                category = "CAMERA_HEALTH"
            elif event["eventType"] == "AFTER_HOURS_PRESENCE":
                category = "AFTER_HOURS"
            elif event["eventType"] == "ZONE_ENTRY":
                category = "RESTRICTED_ZONE_ENTRY"
            elif event["eventType"] == "ZONE_DWELL":
                category = "ZONE_LOITERING_DWELL"
            elif event["eventType"] == "VALUABLE_AREA_ACTIVITY":
                category = "VALUABLE_AREA_ACTIVITY"
            elif event["eventType"] == "CASH_COUNTER_ACTIVITY":
                category = "CASH_COUNTER_ACTIVITY"
            elif event["eventType"] in ("DOOR_AREA_ACTIVITY", "ZONE_MONITORING"):
                category = "ZONE_MONITORING"
            else:
                category = "HUMAN_DETECTION"

            # Update cooldown timestamp for both zone and track
            self.last_alert_times[zone_cooldown_key] = current_time
            self.last_alert_times[cooldown_key] = current_time

            # 6. Annotate frame copy for snapshots (no modification of original stream frame)
            annotated_frame = None
            if frame is not None:
                annotated_frame = frame.copy()
                self._annotate_frame(annotated_frame, event)

            # 7. Asynchronously dispatch alert to Next.js API
            logger.info(f"[Event] {severity} event={event['eventType']} category={category} camera={camera_id} reason={event['reason']}")
            self.dispatcher.dispatch_alert(
                frame=annotated_frame,
                camera_key=camera_id,
                message=event["message"],
                category=category,
                event_type=event["eventType"],
                reason=event["reason"],
                zone_name=event.get("zoneName", "")
            )

    def _annotate_frame(self, frame, event):
        """
        Draws bounding box overlays and alert text directly onto the snapshot copy.
        """
        bbox = event.get("bbox")
        if bbox:
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
            # Draw bounding box (Red)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Label header
            label = f"{event['eventType']} ID: {event.get('trackId')}"
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
