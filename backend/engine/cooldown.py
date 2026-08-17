from datetime import datetime, timedelta
from typing import Dict
from schemas import TelemetryEvent, CooldownPolicy
from engine.topology import topology_engine

class AdaptiveCooldownEngine:
    def __init__(self):
        # Maps (service, event_type) -> CooldownPolicy
        self.policies: Dict[str, CooldownPolicy] = {}
        # Maps (service, event_type) -> last_seen_time
        self.last_seen: Dict[str, datetime] = {}
        
    def _calculate_base(self, event: TelemetryEvent) -> int:
        if event.severity == "critical":
            return 30
        elif event.severity == "error":
            return 60
        elif event.severity == "warning":
            return 120
        return 300
        
    def evaluate(self, event: TelemetryEvent) -> bool:
        """Returns True if the event should be suppressed, False if it should be escalated."""
        key = f"{event.service}:{event.event_type}"
        
        # Determine criticality from topology
        node = topology_engine.graph.nodes.get(event.service, {})
        criticality = node.get("criticality", "medium")
        
        if key not in self.policies:
            base = self._calculate_base(event)
            self.policies[key] = CooldownPolicy(
                service=event.service,
                event_type=event.event_type,
                base_cooldown_sec=base,
                adaptive_modifier=1.0,
                current_suppression_window_sec=base
            )
            self.last_seen[key] = event.timestamp
            return False # First time seeing this, do not suppress
            
        policy = self.policies[key]
        last = self.last_seen[key]
        
        time_since_last = (event.timestamp - last).total_seconds()
        
        # Adaptive Logic:
        # If the event is critical and happens on a highly critical service, we shrink the cooldown
        # to ensure it escalates faster if it keeps happening.
        if event.severity == "critical" and criticality == "high":
            policy.adaptive_modifier = max(0.2, policy.adaptive_modifier - 0.1)
        elif time_since_last > policy.current_suppression_window_sec * 2:
            # If it hasn't happened in a long time, reset the modifier
            policy.adaptive_modifier = 1.0
            
        policy.current_suppression_window_sec = int(policy.base_cooldown_sec * policy.adaptive_modifier)
        
        if time_since_last < policy.current_suppression_window_sec:
            policy.suppressed_count += 1
            return True # Suppress
            
        # Cooldown expired, escalate
        self.last_seen[key] = event.timestamp
        policy.is_escalated = True
        return False
        
cooldown_engine = AdaptiveCooldownEngine()
