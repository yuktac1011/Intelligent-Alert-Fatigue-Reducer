from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

# --- Telemetry & Pipeline ---

class TelemetryEvent(BaseModel):
    id: str
    timestamp: datetime
    service: str
    instance: str
    environment: str = "production"
    event_type: str
    severity: str
    message: str
    stack_trace: Optional[str] = None
    endpoint: Optional[str] = None
    status_code: Optional[int] = None
    latency_ms: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Fingerprint(BaseModel):
    id: str
    semantic_hash: str
    representative_message: str
    first_seen: datetime
    last_seen: datetime
    count: int = 1

class AlertCluster(BaseModel):
    id: str
    fingerprints: List[str]
    start_time: datetime
    last_updated: datetime
    event_count: int

# --- Topology & Cooldown ---

class Service(BaseModel):
    id: str
    health: str = "healthy"
    request_rate: float = 0.0
    error_rate: float = 0.0
    latency: float = 0.0
    active_incidents: int = 0
    anomaly_score: float = 0.0
    criticality: str = "medium"

class Dependency(BaseModel):
    source: str
    target: str
    request_volume: float = 0.0
    latency: float = 0.0
    error_propagation: bool = False
    dependency_health: str = "healthy"

class CooldownPolicy(BaseModel):
    service: str
    event_type: str
    base_cooldown_sec: int
    adaptive_modifier: float
    current_suppression_window_sec: int
    suppressed_count: int = 0
    is_escalated: bool = False

# --- Causal Inference & Graph ---

class IncidentGraphNode(BaseModel):
    id: str
    node_type: str # EVENT, ERROR, SERVICE, RESOURCE, ROOT_CAUSE, USER_IMPACT
    label: str
    timestamp: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)

class IncidentGraphEdge(BaseModel):
    source_id: str
    target_id: str
    relationship_type: str # CAUSED_BY, PROPAGATED_TO, IMPACTS
    confidence: float
    time_delta_ms: int
    evidence: str

class RootCauseEvidence(BaseModel):
    temporal_precedence: float
    dependency_centrality: float
    anomaly_magnitude: float
    propagation_strength: float
    downstream_impact: float
    historical_correlation: float

class RootCauseCandidate(BaseModel):
    service: str
    confidence: float # 0 to 100
    evidence: RootCauseEvidence
    explanation: List[str]

class BlastRadius(BaseModel):
    affected_services: int
    affected_instances: int
    affected_endpoints: int
    estimated_failed_requests: int
    user_impact_percent: float
    dependency_depth: int

class Recommendation(BaseModel):
    priority: str
    actions: List[str]
    confidence: float
    reason: str
    supporting_evidence: str

class Simulation(BaseModel):
    scenario_id: str
    parameters: Dict[str, Any]
    estimated_failed_requests: int
    estimated_incident_duration_sec: int
    estimated_affected_users_percent: float
    estimated_service_degradation: str

# --- Main Incident Model ---

class Incident(BaseModel):
    id: str
    title: str
    severity: str
    confidence: float
    raw_alerts_count: int
    unique_fingerprints: int
    correlated_clusters: int
    noise_reduction_ratio: float
    
    root_cause: Optional[RootCauseCandidate] = None
    blast_radius: Optional[BlastRadius] = None
    recommendation: Optional[Recommendation] = None
    
    graph_nodes: List[IncidentGraphNode] = Field(default_factory=list)
    graph_edges: List[IncidentGraphEdge] = Field(default_factory=list)
    
    status: str = "active" # active, resolved
    created_at: datetime
    updated_at: datetime

# --- API Payloads ---

class Topology(BaseModel):
    nodes: List[Service]
    edges: List[Dependency]

class TimelineEvent(BaseModel):
    timestamp: datetime
    service: str
    event_type: str
    message: str
    severity: str
    confidence: float
