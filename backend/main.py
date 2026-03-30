import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
import tempfile
import os

from database.db import engine, Base
from routes import predict, history
from models.schemas import HealthResponse
import services.model_handler as model_handler
from services.audio_processor import extract_features, extract_features_from_bytes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Deepfake Audio Detection API", version="2.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(predict.router)
app.include_router(history.router)

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "ok",
        "model_loaded": model_handler.is_model_loaded()
    }

@app.websocket("/ws/realtime")
async def websocket_realtime(websocket: WebSocket):
    """WebSocket endpoint for real-time audio analysis.
    Client sends raw audio bytes (PCM 16-bit, 22050 Hz, mono).
    Server responds with JSON prediction results.
    """
    await websocket.accept()
    print("WebSocket client connected for real-time analysis")
    
    try:
        while True:
            # Receive audio data as bytes
            data = await websocket.receive_bytes()
            
            if len(data) < 4410:  # At least 0.1 seconds of audio at 22050Hz
                await websocket.send_json({
                    "status": "waiting",
                    "message": "Need more audio data..."
                })
                continue
            
            try:
                # Convert bytes to numpy array (PCM 16-bit signed)
                audio_array = np.frombuffer(data, dtype=np.int16).astype(np.float32)
                audio_array = audio_array / 32768.0  # Normalize to [-1, 1]
                sr = 22050
                
                # Extract features
                features = extract_features_from_bytes(audio_array, sr)
                
                if features is not None:
                    # Run prediction
                    result_text, confidence, risk_level = model_handler.predict_audio(features)
                    
                    await websocket.send_json({
                        "status": "result",
                        "result": result_text,
                        "confidence": confidence,
                        "risk_level": risk_level,
                        "is_fake": result_text == "Deepfake Audio"
                    })
                else:
                    await websocket.send_json({
                        "status": "error",
                        "message": "Could not extract features from audio chunk"
                    })
                    
            except RuntimeError as e:
                await websocket.send_json({
                    "status": "error",
                    "message": str(e)
                })
            except Exception as e:
                await websocket.send_json({
                    "status": "error",
                    "message": f"Analysis error: {str(e)}"
                })
                
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
