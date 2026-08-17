import asyncio
import uuid
import random
from datetime import datetime, timedelta
from schemas import TelemetryEvent
from api.router import process_event_background
from engine.topology import topology_engine

class ChaosSimulator:
    def __init__(self):
        self.is_running = False
        self.scenario_task = None
        
    async def start_scenario(self, scenario_name: str):
        if self.is_running:
            return
        self.is_running = True
        
        scenarios = {
            "db-exhaustion": self._scenario_db_exhaustion,
            "redis-failure": self._scenario_redis_eviction,
            "network-partition": self._scenario_network_partition,
            "traffic-spike": self._scenario_traffic_spike,
            "api-latency": self._scenario_api_latency,
            "memory-pressure": self._scenario_memory_pressure,
            "kafka-lag": self._scenario_kafka_lag,
            "cascading-failure": self._scenario_cascading
        }
        
        if scenario_name in scenarios:
            self.scenario_task = asyncio.create_task(scenarios[scenario_name]())
        else:
            self.is_running = False
            
    async def stop(self):
        self.is_running = False
        if self.scenario_task:
            self.scenario_task.cancel()
            self.scenario_task = None
            
    async def _emit_event(self, service: str, instance: str, event_type: str, severity: str, message: str, latency: int = None, status: int = None, ts_offset_ms: int = 0):
        ts = datetime.utcnow() + timedelta(milliseconds=ts_offset_ms)
        event = TelemetryEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=ts,
            service=service,
            instance=instance,
            event_type=event_type,
            severity=severity,
            message=message,
            latency_ms=latency,
            status_code=status
        )
        await process_event_background(event)
        
    async def _scenario_db_exhaustion(self):
        try:
            # Stage 1: Resource Saturation
            topology_engine.update_node_metrics("postgresql", latency=200, health="warning")
            for i in range(10):
                await self._emit_event("postgresql", "db-primary", "warning", "warning", f"Connection pool utilization at {80 + i}%", latency=250, ts_offset_ms=i*100)
            await asyncio.sleep(1)
            
            # Stage 2: Database Timeout
            topology_engine.update_node_metrics("postgresql", latency=5000, health="critical")
            topology_engine.update_edge_metrics("payment-service", "postgresql", dep_health="critical")
            for i in range(20):
                await self._emit_event("postgresql", "db-primary", "error", "critical", "Database connection timeout after 5000ms", latency=5000, ts_offset_ms=1000 + i*50)
            await asyncio.sleep(1)
            
            # Stage 3: Order Service Latency & Payment 500s
            topology_engine.update_node_metrics("payment-service", error_rate=60, health="critical")
            topology_engine.update_node_metrics("order-service", latency=1200, health="warning")
            topology_engine.update_edge_metrics("payment-service", "postgresql", error_prop=True)
            for i in range(30):
                await self._emit_event("payment-service", f"pay-pod-{i%5}", "error", "critical", "Error querying database: connection timeout", status=500, ts_offset_ms=2000 + i*30)
                await self._emit_event("order-service", f"ord-pod-{i%8}", "warning", "warning", "Payment service response time > 1000ms", latency=1200, ts_offset_ms=2010 + i*30)
            await asyncio.sleep(1)
            
            # Stage 4: API Gateway Failure
            topology_engine.update_node_metrics("order-service", error_rate=40, health="critical")
            topology_engine.update_node_metrics("api-gateway", error_rate=25, health="critical")
            topology_engine.update_edge_metrics("api-gateway", "order-service", error_prop=True)
            for i in range(40):
                await self._emit_event("api-gateway", f"gw-{i%3}", "error", "critical", "Upstream returned 500 for /api/checkout", status=502, ts_offset_ms=3000 + i*20)
                await asyncio.sleep(0.05)
        finally:
            self.is_running = False

    async def _scenario_redis_eviction(self):
        try:
            topology_engine.update_node_metrics("redis", health="warning")
            for i in range(15):
                await self._emit_event("redis", "cache-1", "warning", "warning", "High eviction rate detected", ts_offset_ms=i*50)
            await asyncio.sleep(1)
            topology_engine.update_node_metrics("auth-service", error_rate=30, health="critical")
            topology_engine.update_edge_metrics("api-gateway", "auth-service", error_prop=True)
            for i in range(30):
                await self._emit_event("auth-service", "auth-pod-1", "error", "critical", "Cache miss latency spike", latency=800, ts_offset_ms=1000 + i*30)
                await self._emit_event("api-gateway", "gw-1", "error", "error", "Auth timeout", status=401, ts_offset_ms=1020 + i*30)
                await asyncio.sleep(0.05)
        finally:
            self.is_running = False

    # Stubs for the remaining 6 scenarios to prevent the file from getting too massive for the prototype
    async def _scenario_network_partition(self):
        self.is_running = False
    async def _scenario_traffic_spike(self):
        self.is_running = False
    async def _scenario_api_latency(self):
        self.is_running = False
    async def _scenario_memory_pressure(self):
        self.is_running = False
    async def _scenario_kafka_lag(self):
        self.is_running = False
    async def _scenario_cascading(self):
        self.is_running = False

chaos_simulator = ChaosSimulator()
