import asyncio
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from typing import List, Dict, Any
from schemas import TelemetryEvent, Incident, Topology, TimelineEvent
from engine.fingerprint import fingerprinter
from engine.correlation import correlation_engine
from engine.topology import topology_engine
from engine.root_cause import root_cause_engine
from engine.incident_graph import incident_graph_engine

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# In-memory storage for prototype
incidents_db: Dict[str, Incident] = {}
timeline_db: Dict[str, List[TimelineEvent]] = {}
events_db: List[TelemetryEvent] = []

async def process_event_background(event: TelemetryEvent):
    events_db.append(event)
    
    # 1. Fingerprinting
    fp_id, similarity = fingerprinter.get_fingerprint(event.message)
    
    # 2. Correlation
    cluster_id = correlation_engine.correlate(event)
    cluster = correlation_engine.get_cluster(cluster_id)
    
    if not cluster: return
    
    # Update topology metrics briefly
    topology_engine.update_node_metrics(event.service, error_rate=100.0 if event.severity in ['error', 'critical'] else 0.0)
    
    # Broadcast raw event with its fingerprint
    await manager.broadcast(json.dumps({
        "type": "event",
        "data": {
            **event.dict(),
            "timestamp": event.timestamp.isoformat(),
            "fingerprint": fp_id,
            "cluster_id": cluster_id
        }
    }))
    
    # 3. Incident Generation / Update
    # If we have enough errors in the cluster, promote it to an incident
    if len(cluster.events) > 5:
        incident_id = f"INC-{cluster_id[-4:].upper()}"
        
        # Calculate Root Cause and Blast Radius
        root_cause, blast_radius, rec = root_cause_engine.analyze(cluster.events)
        
        # Reconstruct Causal Graph
        graph_nodes = []
        graph_edges = []
        if root_cause:
            graph_nodes, graph_edges = incident_graph_engine.build_graph(cluster.events, root_cause.service)
        
        # Calculate noise reduction
        raw_count = len(cluster.events)
        unique_fps = len(set(fingerprinter.get_fingerprint(e.message)[0] for e in cluster.events))
        # actionable events = unique fingerprints approx
        noise_reduction = 1.0 - (float(unique_fps) / float(raw_count)) if raw_count > 0 else 0.0
        
        incident = Incident(
            id=incident_id,
            title="Cascading Failure Detected",
            severity="critical" if raw_count > 20 else "warning",
            confidence=root_cause.confidence if root_cause else 0.0,
            raw_alerts_count=raw_count,
            unique_fingerprints=unique_fps,
            correlated_clusters=1,
            noise_reduction_ratio=noise_reduction,
            root_cause=root_cause,
            blast_radius=blast_radius,
            recommendation=rec,
            graph_nodes=graph_nodes,
            graph_edges=graph_edges,
            created_at=cluster.created_at,
            updated_at=cluster.updated_at
        )
        
        if root_cause and root_cause.service == 'postgresql':
            incident.title = "PostgreSQL Connection Pool Exhaustion"
            
        is_new = incident_id not in incidents_db
        incidents_db[incident_id] = incident
        
        # Timeline
        if incident_id not in timeline_db:
            timeline_db[incident_id] = []
            
        timeline_db[incident_id].append(TimelineEvent(
            timestamp=datetime.utcnow(),
            service="kryven-engine",
            event_type="correlation",
            severity="info",
            confidence=1.0,
            message=f"Correlated {raw_count} alerts into {unique_fps} unique patterns."
        ))
        
        # Broadcast Incident Update
        await manager.broadcast(json.dumps({
            "type": "incident_update",
            "data": json.loads(incident.json())
        }))
        
        # Broadcast Topology Update
        await manager.broadcast(json.dumps({
            "type": "topology_update",
            "data": topology_engine.get_topology().dict()
        }))

@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/events")
async def ingest_event(event: TelemetryEvent, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_event_background, event)
    return {"status": "accepted"}

@router.get("/incidents")
async def get_incidents():
    return list(incidents_db.values())

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    return incidents_db.get(incident_id)

@router.get("/incidents/{incident_id}/timeline")
async def get_incident_timeline(incident_id: str):
    return timeline_db.get(incident_id, [])

@router.get("/topology")
async def get_topology():
    return topology_engine.get_topology()

@router.post("/incidents/{incident_id}/neutralize")
async def neutralize_incident(incident_id: str):
    if incident_id in incidents_db:
        incident = incidents_db[incident_id]
        incident.status = "resolved"
        
        # Heal the topology
        rc_service = incident.root_cause.service if incident.root_cause else None
        if rc_service:
            topology_engine.update_node_metrics(rc_service, health="healthy", error_rate=0.0, latency=50.0)
            
        await manager.broadcast(json.dumps({
            "type": "incident_update",
            "data": json.loads(incident.json())
        }))
        await manager.broadcast(json.dumps({
            "type": "topology_update",
            "data": topology_engine.get_topology().dict()
        }))
        return {"status": "success"}
    return {"error": "not found"}

@router.get("/metrics/noise")
async def get_noise_metrics():
    raw_alerts = len(events_db)
    unique_fps = len(fingerprinter.known_fingerprints)
    noise_reduction = 1.0 - (float(unique_fps) / float(raw_alerts)) if raw_alerts > 0 else 0.0
    return {
        "raw_alerts": raw_alerts,
        "unique_fingerprints": unique_fps,
        "noise_reduction_ratio": noise_reduction,
        "active_incidents": len([i for i in incidents_db.values() if i.status == 'active'])
    }

from schemas import Simulation
from pydantic import BaseModel

class WhatIfRequest(BaseModel):
    scenario: str
    parameters: Dict[str, Any]

@router.post("/simulate/what-if")
async def simulate_what_if(req: WhatIfRequest):
    # Deterministic simulation estimation based on parameters
    base_failed_requests = 18421
    base_duration = 340 # seconds
    
    if req.scenario == "db-pool":
        new_pool_size = req.parameters.get("pool_size", 100)
        reduction_factor = min(1.0, 100.0 / float(new_pool_size))
        
        sim = Simulation(
            scenario_id="db_pool_optimization",
            parameters=req.parameters,
            estimated_failed_requests=int(base_failed_requests * reduction_factor),
            estimated_incident_duration_sec=int(base_duration * reduction_factor),
            estimated_affected_users_percent=31.0 * reduction_factor,
            estimated_service_degradation="Reduced cascading latency across Payment and Order services."
        )
        return sim
        
    return {"error": "Scenario not supported"}
