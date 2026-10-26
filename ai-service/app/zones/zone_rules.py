import time
from app.utils.logger import get_logger
from app.zones.polygon import inside_zone

logger = get_logger("Zone")

class ZoneState:
    ENTERED = "ENTERED"
    DWELLING = "DWELLING"
    ALERTED = "ALERTED"

class ZoneRulesEngine:
    """
    State machine keeping track of zone entries, exits, dwell times,
    and alert states for each (cameraId, zoneId, trackId).
    """
    def __init__(self, track_lost_grace_seconds: float = 6.0):
        # Key: (cameraId, zoneId, trackId) -> dict with keys: entered_at, last_seen, alert_triggered
        self.states = {}
        self.track_lost_grace_seconds = track_lost_grace_seconds

    def evaluate(self, camera_id: str, zones: list, detections: list, width: int, height: int, timestamp: float = None) -> list:
        """
        Evaluates active track positions against cached zone polygons.
        Updates state transitions and returns a list of triggered security events.
        """
        if timestamp is None:
            timestamp = time.time()

        events = []
        active_tracks_in_zones = {z["_id"]: set() for z in zones}

        # 1. Evaluate current frame detections against polygons
        for det in detections:
            track_id = det.get("trackId")
            if track_id is None:
                continue

            foot_pt = det["footPoint"]
            
            for zone in zones:
                zone_id = zone["_id"]
                
                # Polygon check using coordinate conversion
                if inside_zone(foot_pt, zone["points"], width, height):
                    active_tracks_in_zones[zone_id].add(track_id)
                    key = (camera_id, zone_id, track_id)
                    
                    if key not in self.states:
                        # OUTSIDE -> ENTERED
                        self.states[key] = {
                            "entered_at": timestamp,
                            "last_seen": timestamp,
                            "alert_triggered": False,
                            "state": ZoneState.ENTERED
                        }
                        logger.info(f"[Zone] Track {track_id} ENTERED zone {zone.get('name')} ({zone_id})")
                        
                        events.append({
                            "eventType": "ZONE_ENTRY",
                            "cameraId": camera_id,
                            "zoneId": zone_id,
                            "zoneType": zone.get("type", "CUSTOM"),
                            "zoneName": zone.get("name"),
                            "trackId": track_id,
                            "timestamp": timestamp,
                            "duration": 0.0,
                            "confidence": det.get("confidence", 1.0),
                            "bbox": det.get("bbox")
                        })
                    else:
                        # Maintain presence
                        state = self.states[key]
                        state["last_seen"] = timestamp
                        duration = timestamp - state["entered_at"]
                        
                        # Evaluate dwell threshold rule
                        rules = zone.get("rules", {})
                        alert_after_seconds = rules.get("alertAfterSeconds", 5)
                        
                        if duration >= alert_after_seconds and not state["alert_triggered"]:
                            # Transition to ALERTED
                            state["alert_triggered"] = True
                            state["state"] = ZoneState.ALERTED
                            logger.info(f"[Zone] Track {track_id} DWELL ALERT triggered for zone {zone.get('name')} (duration={duration:.1f}s)")
                            
                            events.append({
                                "eventType": "ZONE_DWELL",
                                "cameraId": camera_id,
                                "zoneId": zone_id,
                                "zoneType": zone.get("type", "CUSTOM"),
                                "zoneName": zone.get("name"),
                                "trackId": track_id,
                                "timestamp": timestamp,
                                "duration": duration,
                                "confidence": det.get("confidence", 1.0),
                                "bbox": det.get("bbox")
                            })

        # 2. Check for missing tracks and handle the EXITED grace period
        exited_keys = []
        for key, state in self.states.items():
            cam_id, zone_id, track_id = key
            
            # Find the corresponding zone
            zone = next((z for z in zones if z["_id"] == zone_id), None)
            if zone is None:
                # Zone was deleted or disabled, clean up state immediately
                exited_keys.append(key)
                continue

            # Check if this track is absent in this frame
            is_present = track_id in active_tracks_in_zones.get(zone_id, set())
            
            if not is_present:
                # If absent, check if grace period has expired
                time_since_last_seen = timestamp - state["last_seen"]
                
                # Check if track completely died in track manager or exceeded grace period
                if time_since_last_seen > self.track_lost_grace_seconds:
                    exited_keys.append(key)
                    duration = state["last_seen"] - state["entered_at"]
                    logger.info(f"[Zone] Track {track_id} EXITED zone {zone.get('name')} ({zone_id})")
                    
                    events.append({
                        "eventType": "ZONE_EXIT",
                        "cameraId": cam_id,
                        "zoneId": zone_id,
                        "zoneType": zone.get("type", "CUSTOM"),
                        "zoneName": zone.get("name"),
                        "trackId": track_id,
                        "timestamp": timestamp,
                        "duration": duration,
                        "confidence": 1.0
                    })

        # Remove exited states
        for key in exited_keys:
            if key in self.states:
                del self.states[key]

        return events
