import time
import requests
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("Config")

class CameraConfigManager:
    """
    Fetches and caches the camera's feature configuration toggles 
    periodically from the Next.js frontend API.
    """
    def __init__(self, camera_key: str):
        self.camera_key = camera_key
        alert_api = settings.NEXTJS_ALERT_API
        if "/api/alerts" in alert_api:
            self.api_url = alert_api.replace("/api/alerts", "/api/cameras")
        else:
            self.api_url = "http://localhost:3000/api/cameras"
            
        self.api_key = settings.AI_SERVICE_API_KEY
        self.refresh_interval = 10  # check settings every 10 seconds
        self.last_fetched = 0.0
        
        # Default config states (fallback to True)
        self.config = {
            "humanDetection": True,
            "zoneMonitoring": True,
            "afterHoursSecurity": True,
            "suspiciousMovement": True,
            "cameraHealth": True,
            "restrictedZoneEntry": True,
            "zoneLoiteringDwell": True,
            "valuableAreaActivity": True,
            "cashCounterActivity": True
        }

    def fetch_config(self):
        if not self.api_key:
            logger.warning(f"[Config] AI_SERVICE_API_KEY is not configured. Using default toggles.")
            return
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            logger.info(f"[Config] Syncing settings for camera {self.camera_key} from Next.js...")
            response = requests.get(self.api_url, headers=headers, timeout=5)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("success"):
                    cameras_list = res_json.get("data", [])
                    # Find our specific camera
                    camera_doc = next((c for c in cameras_list if c.get("cameraKey") == self.camera_key), None)
                    if camera_doc:
                        self.config = {
                            "humanDetection": camera_doc.get("humanDetection", True),
                            "zoneMonitoring": camera_doc.get("zoneMonitoring", True),
                            "afterHoursSecurity": camera_doc.get("afterHoursSecurity", True),
                            "suspiciousMovement": camera_doc.get("suspiciousMovement", True),
                            "cameraHealth": camera_doc.get("cameraHealth", True),
                            "restrictedZoneEntry": camera_doc.get("restrictedZoneEntry", True),
                            "zoneLoiteringDwell": camera_doc.get("zoneLoiteringDwell", True),
                            "valuableAreaActivity": camera_doc.get("valuableAreaActivity", True),
                            "cashCounterActivity": camera_doc.get("cashCounterActivity", True),
                        }
                        self.last_fetched = time.time()
                        logger.info(f"[Config] Updated config: {self.config}")
                    else:
                        logger.warning(f"[Config] Camera {self.camera_key} not found in retrieved user list.")
                else:
                    logger.error(f"[Config] API failed: {res_json.get('error')}")
            else:
                logger.error(f"[Config] HTTP error: {response.status_code}")
        except Exception as e:
            logger.error(f"[Config] Exception fetching camera config: {e}")

    def get_config(self) -> dict:
        if time.time() - self.last_fetched > self.refresh_interval:
            self.fetch_config()
        return self.config
