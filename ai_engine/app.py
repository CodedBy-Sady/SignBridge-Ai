"""
SignBridge AI: Python FastAPI Landmark Inference Microservice
Port: 8000
Endpoints:
  GET  /health  - Health & Model status
  POST /predict - Real-time ASL sign classification from 21 3D MediaPipe coordinates
"""

import os
import sys
import joblib
import numpy as np
from typing import Any, List, Dict, Union, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "sign_model.pkl")
ENCODER_FILE = os.path.join(BASE_DIR, "label_encoder.pkl")

# Global model state
ml_state = {
    "model": None,
    "classes": [],
    "is_loaded": False
}

def load_ai_model():
    """Loads pre-trained Random Forest model and classes."""
    if os.path.exists(MODEL_FILE) and os.path.exists(ENCODER_FILE):
        try:
            ml_state["model"] = joblib.load(MODEL_FILE)
            ml_state["classes"] = joblib.load(ENCODER_FILE)
            ml_state["is_loaded"] = True
            print(f"[AI Engine] Successfully loaded ASL model from {MODEL_FILE}")
            print(f"[AI Engine] Available classes ({len(ml_state['classes'])}): {ml_state['classes']}")
            return True
        except Exception as e:
            print(f"[AI Engine Error] Failed to load model: {e}", file=sys.stderr)
            return False
    else:
        print("[AI Engine Warning] sign_model.pkl or label_encoder.pkl not found! Run python train_model.py first.")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML model
    load_ai_model()
    yield
    # Shutdown
    ml_state.clear()

app = FastAPI(
    title="SignBridge AI - Landmark Inference Service",
    description="Real-time 3D hand landmark gesture classifier for SignBridge AI",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite port 5173) and Node backend (Express port 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LandmarkItem(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0

class PredictRequest(BaseModel):
    landmarks: Union[List[Dict[str, float]], List[List[Dict[str, float]]], List[float], List[Any]]

def normalize_landmarks_to_features(raw_landmarks: Any) -> np.ndarray:
    """
    Parses flexible landmark formats into 63 normalized features relative to wrist.
    Supports:
      - Array of 21 objects [{x, y, z}, ...]
      - Multi-hand array [[{x, y, z}, ...]] (picks dominant hand at index 0)
      - Flat 63-element list of floats
    """
    if not raw_landmarks:
        raise ValueError("Landmarks payload is empty.")

    # If passed as multiHandLandmarks array [[...], ...]
    if isinstance(raw_landmarks, list) and len(raw_landmarks) > 0 and isinstance(raw_landmarks[0], list):
        hand = raw_landmarks[0]
    else:
        hand = raw_landmarks

    points = []
    # If list of dicts: [{x, y, z}, ...]
    if isinstance(hand, list) and len(hand) >= 21 and isinstance(hand[0], dict):
        for pt in hand[:21]:
            x = float(pt.get("x", 0.0))
            y = float(pt.get("y", 0.0))
            z = float(pt.get("z", 0.0))
            points.append([x, y, z])
    # If flat float list
    elif isinstance(hand, list) and len(hand) == 63 and isinstance(hand[0], (int, float)):
        return np.array(hand, dtype=np.float32).reshape(1, -1)
    else:
        raise ValueError(f"Expected at least 21 3D landmark points, got {len(hand)} items.")

    pts_arr = np.array(points, dtype=np.float32)  # shape (21, 3)

    # Wrist (point 0) relative normalization for invariant positioning
    wrist = pts_arr[0]
    normalized = pts_arr - wrist

    # Flatten to 63 features
    features = normalized.flatten().reshape(1, -1)
    return features

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SignBridge AI Landmark Inference Engine",
        "model_loaded": ml_state["is_loaded"],
        "classes": ml_state["classes"],
        "class_count": len(ml_state["classes"])
    }

@app.post("/predict")
def predict_gesture(payload: PredictRequest):
    """
    Predicts ASL sign from 21 MediaPipe hand landmarks.
    Returns:
      {
        "gesture": "HELLO",
        "confidence": 0.98,
        "status": "success",
        "alternatives": [...]
      }
    """
    if not ml_state["is_loaded"] or ml_state["model"] is None:
        # Try loading once more dynamically
        if not load_ai_model():
            raise HTTPException(
                status_code=503,
                detail="ML model is not loaded. Ensure train_model.py has run successfully."
            )

    try:
        features = normalize_landmarks_to_features(payload.landmarks)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    model = ml_state["model"]
    probs = model.predict_proba(features)[0]
    classes = ml_state["classes"]

    # Top prediction
    top_idx = int(np.argmax(probs))
    predicted_gesture = str(classes[top_idx])
    confidence = float(probs[top_idx])

    # Top 3 alternatives for diagnostic insight
    top_3_indices = np.argsort(probs)[-3:][::-1]
    alternatives = [
        {"gesture": str(classes[idx]), "confidence": round(float(probs[idx]), 4)}
        for idx in top_3_indices
    ]

    return {
        "gesture": predicted_gesture,
        "confidence": round(confidence, 4),
        "status": "success",
        "alternatives": alternatives
    }

if __name__ == "__main__":
    import uvicorn
    print("==================================================")
    print("🧠 Starting SignBridge AI Inference Microservice")
    print("🚀 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
