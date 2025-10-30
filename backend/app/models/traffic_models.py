"""
Traffic Management System Data Models
Defines all data structures using Pydantic for validation and serialization
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union

# Updated import for Pydantic V2 validator
from pydantic import BaseModel, Field, field_validator


class TrafficSignalState(str, Enum):
    """Traffic signal states"""
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    FLASHING_RED = "flashing_red"
    FLASHING_YELLOW = "flashing_yellow"


class LaneDirection(str, Enum):
    """Traffic lane directions"""
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"


class VehicleType(str, Enum):
    """Types of detected vehicles"""
    CAR = "car"
    TRUCK = "truck"
    BUS = "bus"
    MOTORCYCLE = "motorcycle"
    BICYCLE = "bicycle"
    EMERGENCY = "emergency"
    PEDESTRIAN = "pedestrian"


class EmergencyType(str, Enum):
    """Emergency vehicle types"""
    AMBULANCE = "ambulance"
    FIRE_TRUCK = "fire_truck"
    POLICE = "police"
    RESCUE = "rescue"
    OTHER = "other"


class DetectedVehicle(BaseModel):
    """Represents a single detected vehicle"""

    vehicle_type: VehicleType
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: Dict[str, int] = Field(..., description="Bounding box coordinates {x1, y1, x2, y2}")
    center_coordinates: Dict[str, float] = Field(..., description="Normalized center coordinates {x, y}")
    lane: LaneDirection
    is_emergency: bool = False
    vehicle_id: Optional[str] = None
    detection_timestamp: datetime = Field(default_factory=datetime.utcnow)

    # --- Updated Validator for Pydantic V2 ---
    @field_validator('bounding_box')
    @classmethod
    def validate_bounding_box(cls, v: Dict[str, int]) -> Dict[str, int]:
        required_keys = {'x1', 'y1', 'x2', 'y2'}
        if not required_keys.issubset(v.keys()):
            raise ValueError(f"Bounding box must contain keys: {required_keys}")
        if v['x2'] <= v['x1'] or v['y2'] <= v['y1']:
            raise ValueError("Invalid bounding box coordinates (x2 <= x1 or y2 <= y1)")
        return v

    # --- Updated Validator for Pydantic V2 ---
    @field_validator('center_coordinates')
    @classmethod
    def validate_center_coordinates(cls, v: Dict[str, float]) -> Dict[str, float]:
        required_keys = {'x', 'y'}
        if not required_keys.issubset(v.keys()):
            raise ValueError(f"Center coordinates must contain keys: {required_keys}")
        if not (0 <= v['x'] <= 1 and 0 <= v['y'] <= 1):
            raise ValueError("Center coordinates must be normalized (between 0 and 1)")
        return v


class VehicleDetectionResult(BaseModel):
    """Result of vehicle detection analysis"""

    total_vehicles: int = Field(..., ge=0)
    lane_counts: Dict[LaneDirection, int] = Field(default_factory=dict)
    detected_vehicles: List[DetectedVehicle] = Field(default_factory=list)
    confidence_scores: List[float] = Field(default_factory=list)
    processing_time: float = Field(..., gt=0)
    image_path: str # Consider making this Optional if not always available
    annotated_image_path: Optional[str] = None
    has_emergency_vehicles: bool = False
    traffic_density: float = Field(default=0.0, ge=0.0) # Consider adding validation ge=0, le=1?
    detection_timestamp: datetime = Field(default_factory=datetime.utcnow)

    # --- Updated Validator for Pydantic V2 ---
    # Use mode='before' if you want this to run before type validation (e.g., if input might not be a dict)
    # Use mode='after' (default) if you're sure input is a dict and just want to ensure keys exist
    @field_validator('lane_counts', mode='before') # Changed to before to safely add missing keys
    @classmethod
    def ensure_all_lanes_present(cls, v: Union[Dict[LaneDirection, int], Any]) -> Dict[LaneDirection, int]:
        """Ensure all lane directions are represented, defaulting to 0"""
        # Ensure v is a dictionary
        if not isinstance(v, dict):
             # You might want to raise an error or return a default dict
             # For robustness, let's create a default dict if input is bad
             print(f"Warning: lane_counts input was not a dict, got {type(v)}. Resetting.")
             v = {}

        # Ensure all enum members are keys
        validated_counts = {lane: v.get(lane, 0) for lane in LaneDirection}
        return validated_counts


class TrafficSignal(BaseModel):
    """Represents a traffic signal state and timing"""

    signal_id: str
    direction: LaneDirection
    current_state: TrafficSignalState
    remaining_time: int = Field(..., ge=0, description="Remaining time in seconds")
    next_state: Optional[TrafficSignalState] = None
    cycle_duration: int = Field(default=60, gt=0, description="Total cycle duration in seconds")
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    def is_active(self) -> bool:
        """Check if signal allows traffic flow"""
        return self.current_state == TrafficSignalState.GREEN


class IntersectionStatus(BaseModel):
    """Complete status of traffic intersection"""

    intersection_id: str = Field(default="main_intersection")
    traffic_signals: Dict[LaneDirection, TrafficSignal] = Field(default_factory=dict)
    vehicle_counts: Dict[LaneDirection, int] = Field(default_factory=dict) # Should probably match VehicleDetectionResult.lane_counts
    total_vehicles: int = 0
    traffic_flow_rate: float = Field(default=0.0, ge=0.0)
    average_wait_time: float = Field(default=0.0, ge=0.0)
    emergency_mode_active: bool = False
    system_status: str = Field(default="operational") # Consider using an Enum for status
    last_detection_time: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    # Optional: Add validator to ensure vehicle_counts covers all lanes like in VehicleDetectionResult
    @field_validator('vehicle_counts', mode='before')
    @classmethod
    def ensure_all_intersection_lanes_present(cls, v: Union[Dict[LaneDirection, int], Any]) -> Dict[LaneDirection, int]:
        """Ensure all lane directions are represented in intersection counts"""
        if not isinstance(v, dict):
             v = {}
        validated_counts = {lane: v.get(lane, 0) for lane in LaneDirection}
        return validated_counts


class EmergencyAlert(BaseModel):
    """Emergency vehicle alert information"""

    alert_id: str
    emergency_type: EmergencyType
    detected_lane: LaneDirection
    vehicle_location: Dict[str, float] = Field(..., description="Vehicle coordinates {lat, lon} or {x, y}")
    priority_level: int = Field(..., ge=1, le=5, description="Priority level 1-5 (1 highest)")
    estimated_arrival_time: Optional[int] = Field(None, description="ETA in seconds to intersection")
    override_duration: int = Field(default=60, gt=0, description="Requested signal override duration")
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


class TrafficSnapshot(BaseModel):
    """Snapshot of traffic system state at a point in time"""

    snapshot_id: str # Consider using UUID or similar
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    intersection_status: IntersectionStatus
    vehicle_detection_result: Optional[VehicleDetectionResult] = None
    active_emergency_alerts: List[EmergencyAlert] = Field(default_factory=list)
    performance_metrics: Dict[str, Any] = Field(default_factory=dict)
    # Assuming system_health uses boolean flags for component status
    system_health: Dict[str, bool] = Field(default_factory=lambda: {"cv_module": True, "api_server": True, "database": True})


# --- ADDED Missing Class Definition ---
class SystemHealthStatus(BaseModel):
    """Model for the system health check endpoint"""
    status: str = Field(default="ok", description="Overall system status (e.g., 'ok', 'degraded', 'error')")
    message: Optional[str] = Field(default=None, description="Optional message providing more details")
    version: Optional[str] = Field(default=None, description="Application version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    components: Dict[str, bool] = Field(default_factory=dict, description="Status of individual components (e.g., {'database': True})")
