import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    # Camera Stream configuration
    CAMERA_URL: str = os.getenv("CAMERA_URL", "http://192.0.0.4:8080/video")
    CAMERA_KEY: str = os.getenv("CAMERA_KEY", "CAM-48X8WB")

    # Cloud Upload & Integration
    IMGBB_API_KEY: str = os.getenv("IMGBB_API_KEY", "")
    NEXTJS_ALERT_API: str = os.getenv("NEXTJS_ALERT_API", "http://localhost:3000/api/alerts")
    ALERT_COOLDOWN: int = int(os.getenv("ALERT_COOLDOWN", "10"))
    ZONE_COOLDOWN_SECONDS: int = int(os.getenv("ZONE_COOLDOWN_SECONDS", "30"))
    BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "http://localhost:5000")
    AI_SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "")

    # AI Model parameters
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolov8n.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    PERSON_CONFIDENCE: float = float(os.getenv("PERSON_CONFIDENCE", "0.45"))
    AI_DEVICE: str = os.getenv("AI_DEVICE", "auto")
    AI_PROCESS_FPS: int = int(os.getenv("AI_PROCESS_FPS", "10"))

    # Security & Behavior Rules
    ZONE_REFRESH_SECONDS: int = int(os.getenv("ZONE_REFRESH_SECONDS", "30"))
    CAMERA_OFFLINE_AFTER_SECONDS: int = int(os.getenv("CAMERA_OFFLINE_AFTER_SECONDS", "30"))
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
    SHOP_OPENING_TIME: str = os.getenv("SHOP_OPENING_TIME", "09:00")
    SHOP_CLOSING_TIME: str = os.getenv("SHOP_CLOSING_TIME", "22:00")
    
    # Tampering Detection Heuristics
    CAMERA_TAMPERING_THRESHOLD: float = float(os.getenv("CAMERA_TAMPERING_THRESHOLD", "0.3"))
    CAMERA_TAMPERING_DURATION_SECONDS: int = int(os.getenv("CAMERA_TAMPERING_DURATION_SECONDS", "10"))

    # UI Options
    DISPLAY_WINDOW: bool = os.getenv("DISPLAY_WINDOW", "true").lower() == "true"

    # Adaptive Inference Optimization Parameters
    MOTION_GATE_ENABLED: bool = os.getenv("MOTION_GATE_ENABLED", "true").lower() == "true"
    MOTION_THRESHOLD: float = float(os.getenv("MOTION_THRESHOLD", "0.15"))
    LOW_PRIORITY_FPS: float = float(os.getenv("LOW_PRIORITY_FPS", "2.0"))
    NORMAL_PRIORITY_FPS: float = float(os.getenv("NORMAL_PRIORITY_FPS", "5.0"))
    HIGH_PRIORITY_FPS: float = float(os.getenv("HIGH_PRIORITY_FPS", "10.0"))
    CRITICAL_PRIORITY_FPS: float = float(os.getenv("CRITICAL_PRIORITY_FPS", "15.0"))
    MAX_INFERENCE_INTERVAL_SECONDS: float = float(os.getenv("MAX_INFERENCE_INTERVAL_SECONDS", "5.0"))
    MIN_ACTIVE_SECURITY_FPS: float = float(os.getenv("MIN_ACTIVE_SECURITY_FPS", "2.0"))
    IDENTITY_RECHECK_SECONDS: float = float(os.getenv("IDENTITY_RECHECK_SECONDS", "30.0"))
    PRIORITY_MIN_DURATION_SECONDS: float = float(os.getenv("PRIORITY_MIN_DURATION_SECONDS", "2.0"))
    PRIORITY_COOLDOWN_SECONDS: float = float(os.getenv("PRIORITY_COOLDOWN_SECONDS", "10.0"))
    ACTIVE_TRACK_HIGH_THRESHOLD: int = int(os.getenv("ACTIVE_TRACK_HIGH_THRESHOLD", "5"))
    ZONE_PROXIMITY_THRESHOLD: float = float(os.getenv("ZONE_PROXIMITY_THRESHOLD", "0.08"))
    UNKNOWN_PERSON_PRIORITY: str = os.getenv("UNKNOWN_PERSON_PRIORITY", "HIGH")
    RESTRICTED_ZONE_PRIORITY: str = os.getenv("RESTRICTED_ZONE_PRIORITY", "HIGH")
    VALUABLE_ZONE_PRIORITY: str = os.getenv("VALUABLE_ZONE_PRIORITY", "HIGH")
    CASH_COUNTER_ZONE_PRIORITY: str = os.getenv("CASH_COUNTER_ZONE_PRIORITY", "MEDIUM")

settings = Settings()

