from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import uuid
from schemas import TelemetryEvent, IncidentGraphNode, IncidentGraphEdge
from engine.topology import topology_engine

class IncidentGraphEngine:
    def __init__(self):
        pass

    def build_graph(self, events: List[TelemetryEvent], root_cause_service: str) -> Tuple[List[IncidentGraphNode], List[IncidentGraphEdge]]:
        nodes: Dict[str, IncidentGraphNode] = {}
        edges: List[IncidentGraphEdge] = []
        
        # Sort events chronologically
        sorted_events = sorted(events, key=lambda x: x.timestamp)
        if not sorted_events:
            return [], []

        # 1. Root Cause Node
        rc_node_id = f"rc_{root_cause_service}"
        nodes[rc_node_id] = IncidentGraphNode(
            id=rc_node_id,
            node_type="ROOT_CAUSE",
            label=f"{root_cause_service.upper()} FAILURE",
            timestamp=sorted_events[0].timestamp - timedelta(seconds=1),
            metadata={"service": root_cause_service}
        )

        # Track the first event per service to draw edges
        first_event_per_service = {}
        last_node_id_per_service = {}
        
        for evt in sorted_events:
            # Create EVENT/ERROR node
            node_id = f"evt_{evt.id}"
            node_type = "ERROR" if evt.severity in ["error", "critical"] else "EVENT"
            
            nodes[node_id] = IncidentGraphNode(
                id=node_id,
                node_type=node_type,
                label=evt.message[:40] + ("..." if len(evt.message) > 40 else ""),
                timestamp=evt.timestamp,
                metadata={"service": evt.service, "severity": evt.severity}
            )
            
            # If this is the very first event for the root cause service, connect RC -> this event
            if evt.service == root_cause_service and root_cause_service not in first_event_per_service:
                time_delta = int((evt.timestamp - nodes[rc_node_id].timestamp).total_seconds() * 1000)
                edges.append(IncidentGraphEdge(
                    source_id=rc_node_id,
                    target_id=node_id,
                    relationship_type="CAUSED_BY",
                    confidence=0.95,
                    time_delta_ms=time_delta,
                    evidence="Temporal root origin"
                ))
            
            # If there was a previous event in this same service, connect them sequentially
            if evt.service in last_node_id_per_service:
                prev_id = last_node_id_per_service[evt.service]
                time_delta = int((evt.timestamp - nodes[prev_id].timestamp).total_seconds() * 1000)
                edges.append(IncidentGraphEdge(
                    source_id=prev_id,
                    target_id=node_id,
                    relationship_type="ESCALATED_TO",
                    confidence=0.99,
                    time_delta_ms=time_delta,
                    evidence="Intra-service progression"
                ))
                
            if evt.service not in first_event_per_service:
                first_event_per_service[evt.service] = node_id
                
            last_node_id_per_service[evt.service] = node_id

        # 2. Inter-service propagation edges (using topology)
        for srv in first_event_per_service.keys():
            if srv == root_cause_service:
                continue
                
            # Find which upstream service likely caused this
            # We look for the upstream service that had an event *before* this service's first event
            target_node_id = first_event_per_service[srv]
            target_time = nodes[target_node_id].timestamp
            
            upstream_deps = topology_engine.get_upstream_dependencies(srv)
            possible_causes = []
            
            for up_srv in upstream_deps:
                if up_srv in first_event_per_service:
                    up_first_time = nodes[first_event_per_service[up_srv]].timestamp
                    if up_first_time <= target_time:
                        possible_causes.append((up_srv, up_first_time))
                        
            if possible_causes:
                # Get the most recent upstream event before this target event
                best_upstream = max(possible_causes, key=lambda x: x[1])[0]
                source_node_id = first_event_per_service[best_upstream]
                
                time_delta = int((target_time - nodes[source_node_id].timestamp).total_seconds() * 1000)
                edges.append(IncidentGraphEdge(
                    source_id=source_node_id,
                    target_id=target_node_id,
                    relationship_type="PROPAGATED_TO",
                    confidence=0.88,
                    time_delta_ms=time_delta,
                    evidence=f"Topology dependency: {best_upstream} -> {srv}"
                ))

        # 3. User Impact Node
        # If any user-facing service (e.g. gateway) has errors, attach User Impact
        user_facing_services = ["api-gateway"]
        for ufs in user_facing_services:
            if ufs in last_node_id_per_service:
                ui_node_id = f"ui_{uuid.uuid4().hex[:8]}"
                last_evt_node = nodes[last_node_id_per_service[ufs]]
                
                nodes[ui_node_id] = IncidentGraphNode(
                    id=ui_node_id,
                    node_type="USER_IMPACT",
                    label="Failed End-User Requests",
                    timestamp=last_evt_node.timestamp + timedelta(milliseconds=100),
                    metadata={"service": "user-facing"}
                )
                
                edges.append(IncidentGraphEdge(
                    source_id=last_evt_node.id,
                    target_id=ui_node_id,
                    relationship_type="IMPACTS",
                    confidence=0.99,
                    time_delta_ms=100,
                    evidence="HTTP 500 returned to client"
                ))

        return list(nodes.values()), edges

incident_graph_engine = IncidentGraphEngine()
