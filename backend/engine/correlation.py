from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from schemas import TelemetryEvent
import uuid

class AlertCluster:
    def __init__(self, cluster_id: str):
        self.id = cluster_id
        self.events: List[TelemetryEvent] = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
    def add_event(self, event: TelemetryEvent):
        self.events.append(event)
        self.updated_at = datetime.utcnow()

class CorrelationEngine:
    def __init__(self, correlation_window_seconds: int = 30):
        self.correlation_window = timedelta(seconds=correlation_window_seconds)
        self.active_clusters: List[AlertCluster] = []
        
    def correlate(self, event: TelemetryEvent) -> str:
        """
        Takes an event and correlates it into a cluster.
        Returns the cluster_id.
        """
        now = datetime.utcnow()
        
        # Clean up old clusters that haven't been updated recently
        self.active_clusters = [
            c for c in self.active_clusters 
            if now - c.updated_at <= self.correlation_window
        ]
        
        # For this prototype, we group all incoming errors within the window into the same active cluster
        # since we assume a cascading failure scenario. 
        # In a real system, we'd check topology distance.
        if self.active_clusters:
            # Add to the most recently updated active cluster
            # Or the one that matches topologically
            target_cluster = self.active_clusters[-1]
            target_cluster.add_event(event)
            return target_cluster.id
        else:
            # Create a new cluster
            new_cluster = AlertCluster(f"cluster_{uuid.uuid4().hex[:8]}")
            new_cluster.add_event(event)
            self.active_clusters.append(new_cluster)
            return new_cluster.id
            
    def get_cluster(self, cluster_id: str) -> Optional[AlertCluster]:
        for c in self.active_clusters:
            if c.id == cluster_id:
                return c
        return None

# Singleton instance
correlation_engine = CorrelationEngine()
