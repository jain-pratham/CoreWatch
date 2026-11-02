import cv2
import json
import time
import base64
import requests
import threading
from datetime import datetime
from app.config import settings
from app.alerts.image_uploader import upload_to_imgbb
from app.utils.logger import get_logger

logger = get_logger("Alert")

class AlertDispatcher:
    """
    Manages alert cooldowns per camera key and coordinates the 
    background upload/dispatch workers to keep camera processing non-blocking.
    """
    def __init__(self, api_url: str = None, cooldown_seconds: int = None):
        self.api_url = api_url or settings.NEXTJS_ALERT_API
        self.cooldown_seconds = cooldown_seconds if cooldown_seconds is not None else settings.ALERT_COOLDOWN
        
        # Mapping camera_key -> last alert timestamp (float)
        self._last_alert_times = {}
        self._lock = threading.Lock()

    def can_trigger_alert(self, alert_key: str, current_time: float = None) -> bool:
        """
        Validates if the alert key is outside the cooldown window.
        """
        if current_time is None:
            current_time = time.time()
        with self._lock:
            last_time = self._last_alert_times.get(alert_key, 0.0)
            if current_time - last_time >= self.cooldown_seconds:
                self._last_alert_times[alert_key] = current_time
                return True
            return False

    def dispatch_alert(self, frame, camera_key: str, message: str = "Human detected in shop!", category: str = "HUMAN_DETECTION", event_type: str = "", reason: str = "", zone_name: str = ""):
        """
        Launches the asynchronous alert dispatch worker in a background thread.
        Creates a copy of the frame if it exists to prevent concurrent mutation.
        """
        # Suppress duplicate alerts for the same camera, category, and zone within cooldown window
        alert_key = f"{camera_key}:{category}:{zone_name}"
        if not self.can_trigger_alert(alert_key):
            logger.info(f"[Alert] Cooldown active for {alert_key}. Suppressing repeat dispatch.")
            return

        frame_copy = frame.copy() if frame is not None else None
        
        # Run the upload and POST request in a background thread to prevent UI freezing
        worker_thread = threading.Thread(
            target=self._dispatch_worker,
            args=(frame_copy, camera_key, message, category, event_type, reason, zone_name),
            daemon=True
        )
        worker_thread.start()

    def _dispatch_worker(self, frame, camera_key: str, message: str, category: str = "HUMAN_DETECTION", event_type: str = "", reason: str = "", zone_name: str = ""):
        """
        Saves snapshot, encodes base64 for direct Google Drive sync, and posts threat metadata to backend.
        """
        if frame is None:
            logger.info(f"[Alert] No frame provided. Dispatching text alert for camera {camera_key}...")
            self._send_payload(camera_key, "", message, category, event_type, reason, zone_name, None)
            return

        temp_filename = f"detection_{camera_key}.jpg"
        snapshot_b64 = None
        image_url = None
        
        try:
            # 1. Encode frame directly as JPEG base64 so backend can upload straight to Google Drive
            ret, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret:
                snapshot_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')

            # 2. Also write temporary snapshot file and upload to ImgBB as secondary mirror
            try:
                cv2.imwrite(temp_filename, frame)
                image_url = upload_to_imgbb(temp_filename)
            except Exception as imgbb_err:
                logger.warn(f"[Alert] Secondary ImgBB mirror skipped: {imgbb_err}")

            # 3. Send payload to Next.js server with both image_url and snapshotBase64
            self._send_payload(camera_key, image_url, message, category, event_type, reason, zone_name, snapshot_b64)
            
        except Exception as e:
            logger.error(f"[Alert] Error during background alert dispatch: {e}")

    def _send_payload(self, camera_key: str, image_url: str, message: str, category: str = "HUMAN_DETECTION", event_type: str = "", reason: str = "", zone_name: str = "", snapshot_b64: str = None):
        """
        Helper method to perform HTTP POST to the Next.js API server.
        """
        payload = {
            "cameraKey": camera_key,
            "timestamp": datetime.utcnow().isoformat() + "Z",  # ISO 8601 UTC string
            "imageUrl": image_url or "",
            "snapshotBase64": snapshot_b64 or "",
            "message": message,
            "category": category,
            "eventType": event_type,
            "reason": reason,
            "zoneName": zone_name
        }

        try:
            headers = {"Content-Type": "application/json"}
            logger.info(f"[Alert] Posting alert payload ({category}) to Next.js endpoint: {self.api_url}...")
            
            response = requests.post(self.api_url, data=json.dumps(payload), headers=headers, timeout=10)
            logger.info(f"[Alert] Server responded: HTTP {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"[Alert] Connection failed: Next.js server is unreachable. (Error: {e})")
