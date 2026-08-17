import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulation.chaos import chaos_simulator
from engine.fingerprint import fingerprinter
from engine.correlation import correlation_engine
from engine.topology import topology_engine
from engine.root_cause import root_cause_engine
from engine.incident_graph import incident_graph_engine
from api.router import events_db, process_event_background, incidents_db

async def run_scenario_and_validate(scenario_name: str):
    print(f"\n{'='*50}\nTesting Scenario: {scenario_name}\n{'='*50}")
    
    # Reset state
    events_db.clear()
    incidents_db.clear()
    fingerprinter.known_fingerprints.clear()
    correlation_engine.active_clusters.clear()
    # topology_engine doesn't have reset, skip
    
    # Generate events
    await chaos_simulator.start_scenario(scenario_name.replace('_', '-'))
    if chaos_simulator.scenario_task:
        await chaos_simulator.scenario_task
    
    print(f"Events generated.")
        
    print(f"Active Incidents: {len(incidents_db)}")
    
    if len(incidents_db) == 0:
        print("FAIL: No incident generated.")
        return False
        
    incident = list(incidents_db.values())[0]
    
    print(f"Incident Title: {incident.title}")
    print(f"Root Cause: {incident.root_cause.service if incident.root_cause else 'None'}")
    print(f"Confidence: {incident.confidence}")
    print(f"Blast Radius (Services): {incident.blast_radius.affected_services if incident.blast_radius else 'None'}")
    print(f"Recommendation Priority: {incident.recommendation.priority if incident.recommendation else 'None'}")
    print(f"Compression Ratio: {incident.noise_reduction_ratio * 100:.1f}%")
    
    # Validate based on scenario
    if scenario_name == 'db-exhaustion':
        assert 'postgres' in (incident.root_cause.service.lower() if incident.root_cause else ''), "Root cause should be postgres"
        assert incident.recommendation.priority == 'P0', "Postgres failure should be P0"
        
    elif scenario_name == 'redis-failure':
        assert 'redis' in (incident.root_cause.service.lower() if incident.root_cause else '') or 'auth' in (incident.root_cause.service.lower() if incident.root_cause else ''), "Root cause should be redis/auth"
        assert 'cache' in incident.recommendation.reason.lower() or 'evict' in incident.recommendation.reason.lower(), "Should mention cache"
        
    elif scenario_name == 'network-partition':
        assert 'kafka' in (incident.root_cause.service.lower() if incident.root_cause else '') or 'order' in (incident.root_cause.service.lower() if incident.root_cause else ''), "Root cause should be related to kafka/order partition"
        assert 'network' in incident.recommendation.reason.lower() or 'partition' in incident.recommendation.reason.lower(), "Should mention network partition"
        
    return True

async def main():
    scenarios = ['db-exhaustion', 'redis-failure', 'network-partition']
    success = True
    for s in scenarios:
        if not await run_scenario_and_validate(s):
            success = False
            
    if success:
        print("\n\nSUCCESS: All intelligence engines validated dynamically across scenarios.")
    else:
        print("\n\nFAILED: One or more scenarios did not yield the expected dynamic intelligence.")

if __name__ == "__main__":
    asyncio.run(main())
