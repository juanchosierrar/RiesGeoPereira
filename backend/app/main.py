# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import disaster_data, pipeline_ops, alert_routes, chatbot_route

app = FastAPI(title="DisasterLens API")

# Allow your frontend (e.g., localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(disaster_data.router, prefix="/api/v1") 
app.include_router(pipeline_ops.router, prefix="/api/v1")
app.include_router(alert_routes.router, prefix="/api/v1") 
app.include_router(chatbot_route.router, prefix="/api/v1")      


@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.get("/api/v1/weather/radar")
def get_radar(station: str = "Munchique"):
    from app.services.radar_service import generate_radar_layer
    try:
        data = generate_radar_layer(station)
        return data
    except Exception as e:
        import traceback
        print(f"Error in radar service: {str(e)}")
        print(traceback.format_exc())
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/weather/radar/siata")
def get_siata_radar():
    from app.services.radar_service import generate_siata_layer
    try:
        data = generate_siata_layer()
        return data
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))