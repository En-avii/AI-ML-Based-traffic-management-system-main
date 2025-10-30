"""
AI Traffic Management System - Modern FastAPI Backend
Serves a separate static frontend build and provides API/WebSocket endpoints.
"""

import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from fastapi import (
    FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect,
    BackgroundTasks, HTTPException, Depends, status, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles # Keep StaticFiles
from fastapi.responses import JSONResponse, FileResponse # Add FileResponse for index.html fallback
# Removed: HTMLResponse, Jinja2Templates
from fastapi.security import HTTPBearer

# Assuming these imports are correct relative to main.py
from .core.config import settings
from .core.logger import setup_logging, get_application_logger
from .services.intelligent_vehicle_detector import IntelligentVehicleDetector
from .services.adaptive_traffic_manager import AdaptiveTrafficManager
from .services.analytics_service import TrafficAnalyticsService
from .models.traffic_models import (
    VehicleDetectionResult, IntersectionStatus,
    EmergencyAlert, TrafficSnapshot, SystemHealthStatus
)

# Initialize logging
setup_logging()
logger = get_application_logger("main")

# --- REMOVED Template Configuration ---

# Global services - will be initialized in lifespan
vehicle_detector: IntelligentVehicleDetector = None
traffic_manager: AdaptiveTrafficManager = None
analytics_service: TrafficAnalyticsService = None

# WebSocket connection manager (Keep as is)
class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    # ... (code for ConnectionManager remains the same) ...
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        connections_to_notify = list(self.active_connections)
        for connection in connections_to_notify:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send message to a WebSocket: {e}. Removing connection.")
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

websocket_manager = ConnectionManager()

# Lifespan context manager (Keep as is, but ensure directory creation logic is correct)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ... (lifespan startup logic remains the same) ...
    # Ensure directories are created relative to the backend folder (where uvicorn runs)
    backend_root = Path.cwd() # The directory where uvicorn is running
    (backend_root / "output_images").mkdir(parents=True, exist_ok=True) # For annotated images
    (backend_root / "uploads").mkdir(parents=True, exist_ok=True) # For temporary uploads
    (backend_root / "logs").mkdir(parents=True, exist_ok=True)
    # ... (rest of lifespan startup) ...
    logger.info("Starting AI Traffic Management System")
    try:
        global vehicle_detector, traffic_manager, analytics_service
        vehicle_detector = IntelligentVehicleDetector()
        traffic_manager = AdaptiveTrafficManager()
        analytics_service = TrafficAnalyticsService()
        await vehicle_detector.initialize()
        await analytics_service.initialize()
        await traffic_manager.start_simulation()
        logger.info("All services initialized successfully")
    except Exception as error:
        logger.error(f"Failed to initialize services: {error}", exc_info=True)
        raise
    yield
    # ... (lifespan shutdown logic remains the same) ...
    logger.info("Shutting down AI Traffic Management System")
    try:
        if traffic_manager: await traffic_manager.cleanup()
        if vehicle_detector: await vehicle_detector.cleanup()
        if analytics_service: await analytics_service.cleanup()
        logger.info("All services shut down successfully")
    except Exception as error:
        logger.error(f"Error during shutdown: {error}", exc_info=True)


# Create FastAPI application (Keep as is)
app = FastAPI(
    title=settings.application_name,
    description="Intelligent traffic control with real-time vehicle detection and adaptive signal optimization",
    version=settings.application_version,
    lifespan=lifespan,
    docs_url=f"{settings.api_prefix}/docs" if settings.debug_mode else None,
    redoc_url=f"{settings.api_prefix}/redoc" if settings.debug_mode else None,
    openapi_url=f"{settings.api_prefix}/openapi.json" if settings.debug_mode else None
)

# Security (Keep as is)
security = HTTPBearer(auto_error=False)

# Middleware (Keep CORS, adjust TrustedHost if needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins, # Ensure "*" or your frontend dev URL (e.g., "http://localhost:3000") is here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] # Allows all hosts, adjust for production if needed
)

# Dependency functions (Keep as is)
async def get_vehicle_detector() -> IntelligentVehicleDetector:
    # ... (code remains the same) ...
    if not vehicle_detector:
        raise HTTPException(status_code=503, detail="Vehicle detection service not initialized")
    return vehicle_detector

async def get_traffic_manager() -> AdaptiveTrafficManager:
    # ... (code remains the same) ...
    if not traffic_manager:
        raise HTTPException(status_code=503, detail="Traffic management service not initialized")
    return traffic_manager

async def get_analytics_service() -> TrafficAnalyticsService:
    # ... (code remains the same) ...
    if not analytics_service:
        raise HTTPException(status_code=503, detail="Analytics service not initialized")
    return analytics_service

# --- REMOVED Root Route Handler for Jinja Template ---

# WebSocket endpoint (Keep as is)
@app.websocket("/ws/traffic-updates")
async def websocket_endpoint(websocket: WebSocket):
    # ... (code remains the same) ...
    await websocket_manager.connect(websocket)
    try:
        while True:
            if traffic_manager:
                try:
                    intersection_status = await traffic_manager.get_current_status()
                    status_dict = intersection_status.model_dump(mode='json')
                    await websocket.send_json({
                        "type": "intersection_status",
                        "data": status_dict,
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    })
                except Exception as status_error:
                    logger.error(f"Error getting/sending intersection status: {status_error}")
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected gracefully.")
        websocket_manager.disconnect(websocket)
    except Exception as error:
        logger.error(f"Unexpected WebSocket error: {error}", exc_info=True)
        websocket_manager.disconnect(websocket)


# API Routes (Keep API Router and all API endpoints as they are)
from fastapi import APIRouter
api_router = APIRouter(prefix=settings.api_prefix)

@api_router.post("/detect-vehicles", response_model=VehicleDetectionResult)
async def detect_vehicles_endpoint(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    detector: IntelligentVehicleDetector = Depends(get_vehicle_detector),
    manager: AdaptiveTrafficManager = Depends(get_traffic_manager),
    analytics: TrafficAnalyticsService = Depends(get_analytics_service)
):
    # ... (endpoint logic remains the same) ...
    backend_root = Path.cwd()
    upload_dir = backend_root / "uploads"
    output_dir = backend_root / "output_images"
    try:
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=415, detail="File must be an image")
        upload_id = str(uuid.uuid4())
        safe_filename = f"traffic_{upload_id}{Path(image.filename).suffix if image.filename else '.jpg'}"
        temp_path = upload_dir / safe_filename
        contents = await image.read()
        with open(temp_path, "wb") as f: f.write(contents)
        logger.info(f"Processing uploaded image: {image.filename} saved to {temp_path}")
        annotated_image_subpath = f"annotated_{safe_filename}"
        annotated_save_path = output_dir / annotated_image_subpath
        detection_result = await detector.analyze_intersection_image(str(temp_path), save_annotated=True, output_path=str(annotated_save_path))
        if detection_result and annotated_save_path.exists():
             detection_result.annotated_image_path = f"/static/{annotated_image_subpath}" # Use /static mount point
        if detection_result:
             await manager.update_vehicle_counts(detection_result.lane_counts)
             background_tasks.add_task(analytics.record_detection, detection_result, datetime.utcnow())
             background_tasks.add_task(websocket_manager.broadcast, {
                 "type": "vehicle_detection", "data": detection_result.model_dump(mode='json'), "timestamp": datetime.utcnow().isoformat() + "Z"
             })
             logger.info(f"Detection completed: {detection_result.total_vehicles} vehicles. Annotated: {detection_result.annotated_image_path}")
        else:
             logger.warning("Vehicle detection returned no result.")
             raise HTTPException(status_code=500, detail="Vehicle detection failed to produce results.")
        background_tasks.add_task(lambda p: Path(p).unlink(missing_ok=True), temp_path)
        return detection_result
    except HTTPException as http_exc: raise http_exc
    except Exception as error:
        logger.error(f"Vehicle detection endpoint error: {error}", exc_info=True)
        background_tasks.add_task(lambda p: Path(p).unlink(missing_ok=True), temp_path)
        raise HTTPException(status_code=500, detail=f"Vehicle detection failed: {str(error)}")


@api_router.get("/intersection-status", response_model=IntersectionStatus)
async def get_intersection_status(manager: AdaptiveTrafficManager = Depends(get_traffic_manager)):
    # ... (endpoint logic remains the same) ...
    try: return await manager.get_current_status()
    except Exception as e: raise HTTPException(status_code=500, detail="Could not retrieve status")

@api_router.post("/emergency-override", status_code=status.HTTP_202_ACCEPTED)
async def emergency_override(alert: EmergencyAlert, background_tasks: BackgroundTasks, manager: AdaptiveTrafficManager = Depends(get_traffic_manager)):
    # ... (endpoint logic remains the same) ...
    try:
        await manager.handle_emergency_override(alert)
        background_tasks.add_task(websocket_manager.broadcast, {
            "type": "emergency_alert", "data": alert.model_dump(mode='json'), "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        logger.warning(f"Emergency override activated: {alert.alert_id}")
        return {"status": "emergency_override_activated", "alert_id": alert.alert_id, "message": f"Override for {alert.detected_lane.value} lane"}
    except Exception as error: raise HTTPException(status_code=500, detail=f"Override failed: {str(error)}")

# ... (Include all other /api/... routes from your previous main.py) ...
# @api_router.get("/analytics/summary")...
# @api_router.get("/analytics/heatmap")...
# @api_router.get("/analytics/performance")...
# @api_router.post("/simulation/start")...
# @api_router.post("/simulation/stop")...
# @api_router.post("/configuration")...

# Include the API router in the main app
app.include_router(api_router)


# Health Check Endpoint (Keep as is)
@app.get("/health", response_model=SystemHealthStatus, tags=["Health"])
async def health_check():
    # ... (code remains the same) ...
    db_ok = True; redis_ok = True # Placeholder checks
    detector_ready = vehicle_detector and hasattr(vehicle_detector, 'is_ready') and vehicle_detector.is_ready()
    manager_ready = traffic_manager and hasattr(traffic_manager, 'is_ready') and traffic_manager.is_ready()
    analytics_ready = analytics_service and hasattr(analytics_service, 'is_ready') and analytics_service.is_ready()
    all_ok = db_ok and redis_ok and detector_ready and manager_ready and analytics_ready
    health = SystemHealthStatus(
        status="ok" if all_ok else "degraded", version=settings.application_version,
        components={ "database": db_ok, "redis_cache": redis_ok, "vehicle_detector": detector_ready,
                     "traffic_manager": manager_ready, "analytics_service": analytics_ready,
                     "websocket_connections": len(websocket_manager.active_connections) }
    )
    if not all_ok: logger.warning(f"Health check status: DEGRADED. Components: {health.components}")
    return health


# System Info Endpoint (Keep as is)
@app.get("/system/info", tags=["System"])
async def get_system_info():
    # ... (code remains the same) ...
     return { "application_name": settings.application_name, "version": settings.application_version,
             "environment": os.getenv("ENVIRONMENT", "development").lower(), "api_prefix": settings.api_prefix,
             "features": { "vehicle_detection": True, "adaptive_signals": True, "emergency_override": settings.emergency_detection_enabled,
                           "real_time_analytics": True, "websocket_support": True },
             "timestamp": datetime.utcnow().isoformat() + "Z" }


# Static Files Mount for Annotated Images (Keep as is)
backend_root_dir = Path.cwd()
static_output_directory = backend_root_dir / "output_images"
static_output_directory.mkdir(parents=True, exist_ok=True)
logger.info(f"Mounting static files for outputs at /static from: {static_output_directory}")
app.mount("/static", StaticFiles(directory=static_output_directory), name="static_outputs")


# --- NEW: Mount Static Files for Frontend ---
# This serves files from ../frontend/build relative to this main.py file's parent (backend/)
APP_DIR = Path(__file__).resolve().parent
FRONTEND_BUILD_DIR = APP_DIR.parent.parent / "frontend" / "build" # Adjust path if needed

if not FRONTEND_BUILD_DIR.is_dir():
    logger.warning(f"Frontend build directory not found at: {FRONTEND_BUILD_DIR}. Static frontend will not be served.")
    # Define a fallback route for "/" if the directory doesn't exist
    @app.get("/", include_in_schema=False)
    async def root_fallback():
        return {"message": "AI Traffic Management Backend is running. Frontend not found.", "docs": app.docs_url, "redoc": app.redoc_url}

else:
    logger.info(f"Mounting static files for frontend at / from: {FRONTEND_BUILD_DIR}")
    # Mount the static directory itself
    app.mount("/static-frontend", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static_frontend_assets") # Serve CSS, JS etc.

    # Serve index.html for the root path and any other paths not matched by API/static routes
    # This acts as a catch-all for SPA (Single Page Application) routing
    @app.get("/{full_path:path}", response_class=FileResponse, include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        index_path = FRONTEND_BUILD_DIR / "index.html"
        # Check specific file request first (e.g., /manifest.json)
        potential_file = FRONTEND_BUILD_DIR / full_path
        if potential_file.is_file():
             return FileResponse(potential_file)
        # If not a specific file, serve index.html for SPA routing
        elif index_path.is_file():
            return FileResponse(index_path)
        else:
            logger.error(f"Frontend index.html not found at: {index_path}")
            raise HTTPException(status_code=404, detail="Frontend index.html not found.")
# --- End Frontend Static Files Mount ---


# Custom exception handlers (Keep as is)
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    # ... (code remains the same) ...
    logger.warning(f"404 Not Found for path: {request.url.path}")
    # Avoid redirect loop if frontend isn't found
    if str(request.url.path).startswith(settings.api_prefix) or str(request.url.path).startswith("/docs") or str(request.url.path).startswith("/redoc") or str(request.url.path).startswith("/openapi"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found", "path": str(request.url.path)})
    # If it's not an API route, let the SPA handler (if mounted) try or return a generic 404
    # The SPA handler above should catch this if configured
    return JSONResponse(status_code=404, content={"detail": "Resource not found", "path": str(request.url.path)})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # ... (code remains the same) ...
    error_id = str(uuid.uuid4())
    logger.error(f"Internal Server Error (ID: {error_id}) on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error_id": error_id})


# Main execution block (Keep as is)
if __name__ == "__main__":
    import uvicorn
    logger.info("Running application directly using uvicorn...")
    # Ensure this points to the app instance correctly if run directly
    # 'app.main:app' assumes uvicorn is run from the 'backend' directory
    uvicorn.run(
        "app.main:app", # Standard way to specify app location
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug_mode,
        log_level=settings.log_level.lower(),
        workers=1 # Usually 1 for reload
    )

