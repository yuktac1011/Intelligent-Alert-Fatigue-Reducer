import networkx as nx
from typing import List, Dict, Set
from schemas import Service, Dependency, Topology

class TopologyEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_graph()

    def _initialize_graph(self):
        # Baseline topology as specified
        services = ["api-gateway", "auth-service", "order-service", "payment-service", "postgresql", "notification-service", "redis", "kafka", "worker-service"]
        
        for s in services:
            self.graph.add_node(s, health="healthy", request_rate=100.0, error_rate=0.0, latency=50.0, active_incidents=0, anomaly_score=0.0, criticality="medium")
            
        # Dependencies (Source -> Target means Source calls Target)
        edges = [
            ("api-gateway", "auth-service"),
            ("api-gateway", "order-service"),
            ("order-service", "payment-service"),
            ("payment-service", "postgresql"),
            ("auth-service", "redis"),
            ("order-service", "kafka"),
            ("kafka", "worker-service"),
            ("worker-service", "postgresql"),
            ("order-service", "notification-service")
        ]
        
        for u, v in edges:
            self.graph.add_edge(u, v, request_volume=50.0, latency=20.0, error_propagation=False, dependency_health="healthy")

    def get_topology(self) -> Topology:
        nodes = []
        for n, attrs in self.graph.nodes(data=True):
            nodes.append(Service(id=n, **attrs))
            
        edges = []
        for u, v, attrs in self.graph.edges(data=True):
            edges.append(Dependency(source=u, target=v, **attrs))
            
        return Topology(nodes=nodes, edges=edges)

    def update_node_metrics(self, node_id: str, latency: float = None, error_rate: float = None, health: str = None):
        if self.graph.has_node(node_id):
            if latency is not None:
                self.graph.nodes[node_id]['latency'] = latency
            if error_rate is not None:
                self.graph.nodes[node_id]['error_rate'] = error_rate
            if health is not None:
                self.graph.nodes[node_id]['health'] = health

    def update_edge_metrics(self, u: str, v: str, error_prop: bool = None, dep_health: str = None):
        if self.graph.has_edge(u, v):
            if error_prop is not None:
                self.graph.edges[u, v]['error_propagation'] = error_prop
            if dep_health is not None:
                self.graph.edges[u, v]['dependency_health'] = dep_health

    def get_downstream_services(self, root_node: str) -> List[str]:
        """Returns all services that depend on this node (upstream in call graph, but downstream in failure propagation)"""
        if not self.graph.has_node(root_node):
            return []
        # In a directed graph where A -> B means A calls B.
        # If B fails, A is affected. So failure propagates backwards (predecessors).
        # We find all ancestors (predecessors and their predecessors).
        ancestors = nx.ancestors(self.graph, root_node)
        return list(ancestors)
        
    def get_upstream_dependencies(self, node: str) -> List[str]:
        """Returns all services this node depends on."""
        if not self.graph.has_node(node):
            return []
        descendants = nx.descendants(self.graph, node)
        return list(descendants)

topology_engine = TopologyEngine()
