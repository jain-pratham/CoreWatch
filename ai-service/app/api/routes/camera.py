from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
import time

router = APIRouter()

class CameraConnectRequest(BaseModel):
    cameraKey: Optional[str] = "CAM-1F8IPF"
    streamUrl: str

@router.post("/camera/connect")
def connect_camera(req: CameraConnectRequest):
    """
    Connects or dynamically switches camera stream feed to the provided streamUrl.
    """
    from app.main import camera_manager
    camera_key = req.cameraKey or "CAM-1F8IPF"
    stream_url = req.streamUrl.strip()
    
    if not stream_url:
        return {"success": False, "error": "streamUrl cannot be empty"}
        
    camera_manager.register_camera(camera_key, stream_url, force_restart=True)
    return {
        "success": True,
        "message": f"Connected camera '{camera_key}' to stream successfully.",
        "cameraKey": camera_key,
        "streamUrl": stream_url
    }

@router.get("/camera/status")
def get_camera_status():
    """
    Returns the real-time operational status, connectivity, and active tracks for all streams.
    """
    from app.main import camera_manager
    status_list = {}
    for key, runtime in camera_manager.runtimes.items():
        status_list[key] = {
            "cameraKey": key,
            "streamUrl": runtime.camera_url,
            "isConnected": not runtime.offline_detector.is_offline,
            "activeTracks": runtime.active_tracks_count,
            "zonesCached": len(runtime.zone_manager.zones),
            "zoneFetchStatus": {
                "available": runtime.zone_manager.is_available,
                "authFailed": runtime.zone_manager.auth_failed,
                "lastFetched": runtime.zone_manager.last_fetched
            }
        }
    return {
        "success": True,
        "cameras": status_list
    }

def gen_frames(camera_key: str):
    from app.main import camera_manager
    
    # 640x480 black frame for offline/initializing state
    offline_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(offline_frame, "CAMERA OFFLINE / INITIALIZING", (50, 240), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
    
    _, offline_jpeg = cv2.imencode('.jpg', offline_frame)
    offline_bytes = offline_jpeg.tobytes()

    while True:
        runtime = camera_manager.get_runtime(camera_key)
        if runtime:
            is_offline = getattr(runtime.offline_detector, 'is_offline', True)
            frame = runtime.last_annotated_frame
            
            if not is_offline and frame is not None:
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                else:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + offline_bytes + b'\r\n')
            else:
                # If offline, generate offline frame with camera key name
                frame_to_send = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(frame_to_send, f"{camera_key} - OFFLINE", (100, 240), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)
                _, buffer = cv2.imencode('.jpg', frame_to_send)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        else:
            # Camera not registered/not found
            frame_to_send = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame_to_send, f"{camera_key} - NOT REGISTERED", (80, 240), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2, cv2.LINE_AA)
            _, buffer = cv2.imencode('.jpg', frame_to_send)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
        time.sleep(0.1)  # 10 FPS streaming for efficiency

@router.get("/camera/stream/{camera_key}")
def stream_camera(camera_key: str):
    """
    Serves a real-time MJPEG video stream of the camera with AI annotations.
    """
    return StreamingResponse(gen_frames(camera_key), media_type="multipart/x-mixed-replace; boundary=frame")

