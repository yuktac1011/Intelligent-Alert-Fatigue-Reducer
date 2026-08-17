from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class DBEvent(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    service = Column(String, index=True)
    instance = Column(String)
    environment = Column(String)
    event_type = Column(String, index=True)
    severity = Column(String)
    message = Column(String)
    stack_trace = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    status_code = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    metadata_json = Column(JSON, default={})
    
    # Clustering/Fingerprinting
    fingerprint = Column(String, index=True, nullable=True)
    cluster_id = Column(String, index=True, nullable=True)

class DBIncident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    severity = Column(String)
    confidence = Column(Float)
    raw_alerts_count = Column(Integer)
    unique_fingerprints = Column(Integer)
    correlated_clusters = Column(Integer)
    noise_reduction_ratio = Column(Float)
    
    root_cause_json = Column(JSON, nullable=True)
    blast_radius_json = Column(JSON, nullable=True)
    recommendation_json = Column(JSON, nullable=True)
    
    # Causal Graph stored as JSON for simplicity
    graph_nodes_json = Column(JSON, nullable=True, default=[])
    graph_edges_json = Column(JSON, nullable=True, default=[])
    
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBTimelineEvent(Base):
    __tablename__ = "timeline_events"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(String, ForeignKey("incidents.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    service = Column(String)
    event_type = Column(String)
    message = Column(String)
    severity = Column(String)
    confidence = Column(Float, default=0.0)

class DBService(Base):
    __tablename__ = "services"
    id = Column(String, primary_key=True, index=True)
    health = Column(String, default="healthy")
    request_rate = Column(Float, default=0.0)
    error_rate = Column(Float, default=0.0)
    latency = Column(Float, default=0.0)
    active_incidents = Column(Integer, default=0)
    anomaly_score = Column(Float, default=0.0)
    criticality = Column(String, default="medium")

class DBDependency(Base):
    __tablename__ = "dependencies"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String, index=True)
    target = Column(String, index=True)
    request_volume = Column(Float, default=0.0)
    latency = Column(Float, default=0.0)
    error_propagation = Column(Boolean, default=False)
    dependency_health = Column(String, default="healthy")
