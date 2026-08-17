from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router as api_router
from simulation.chaos import chaos_simulator

app = FastAPI(title="Kryven API", description="Autonomous Incident Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
# WebSocket is technically at /api/ws/events due to router prefix, let's fix it if needed.
# Wait, in router.py I did: @router.websocket("/ws/events") -> so it'll be /api/ws/events

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/chaos/{scenario}")
async def trigger_chaos(scenario: str):
    if scenario == "db-exhaustion":
        await chaos_simulator.start_scenario(scenario)
        return {"status": "started", "scenario": scenario}
    return {"status": "not_found"}, 404

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
