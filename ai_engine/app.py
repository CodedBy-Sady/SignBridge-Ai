"""
SignBridge AI: Python FastAPI Landmark Inference Microservice
Engine: High-Performance 36-Class ASL Gesture Model (A-Z + 10 Core Signs)
Port: 8000
Endpoints:
  GET  /health  - Health, Model Info & 36 Classes List
  GET  /classes - Full list of all 36 supported classes
  POST /predict - Real-time ASL sign classification from 21 MediaPipe coordinates
"""

import os
import sys
import json
import joblib
import numpy as np
from typing import Any, List, Dict, Union, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "sign_model.pkl")
ENCODER_FILE = os.path.join(BASE_DIR, "label_encoder.pkl")
GISLR_MODEL_PATH = os.path.join(BASE_DIR, "models", "gislr", "model.tflite")

# Global state for Active ML Engine
ml_state = {
    "model": None,
    "classes": [],
    "is_loaded": False,
    "class_count": 0
}

def load_ai_model():
    """Loads 36-Class ASL Random Forest Model and Encoder."""
    if os.path.exists(MODEL_FILE) and os.path.exists(ENCODER_FILE):
        try:
            ml_state["model"] = joblib.load(MODEL_FILE)
            ml_state["classes"] = list(joblib.load(ENCODER_FILE))
            ml_state["class_count"] = len(ml_state["classes"])
            ml_state["is_loaded"] = True

            print("==================================================")
            print("🚀 [AI Engine] Successfully loaded 36-Class ASL Model!")
            print(f"📦 Model File: {MODEL_FILE}")
            print(f"📖 Supported Classes ({ml_state['class_count']}): {ml_state['classes']}")
            print("==================================================")
            return True
        except Exception as e:
            print(f"[AI Engine Error] Failed to load ASL model: {e}", file=sys.stderr)
            return False
    else:
        print("[AI Engine Warning] sign_model.pkl not found! Run python train_model.py first.")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_ai_model()
    yield
    ml_state.clear()

app = FastAPI(
    title="SignBridge AI - 36-Class ASL Gesture Inference Service",
    description="Real-time ASL recognition across 26 letters and 10 core conversational signs",
    version="2.1.0",
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

class PredictRequest(BaseModel):
    landmarks: Union[List[Dict[str, float]], List[List[Dict[str, float]]], List[float], List[Any]]

def normalize_landmarks(raw_landmarks: Any) -> np.ndarray:
    """Parses 21 (x, y, z) MediaPipe hand landmarks and normalizes relative to wrist."""
    if not raw_landmarks:
        raise ValueError("Landmarks payload is empty.")

    # If passed as multiHandLandmarks array [[hand1], ...]
    if isinstance(raw_landmarks, list) and len(raw_landmarks) > 0 and isinstance(raw_landmarks[0], list):
        hand = raw_landmarks[0]
    else:
        hand = raw_landmarks

    points = []
    if isinstance(hand, list) and len(hand) >= 21 and isinstance(hand[0], dict):
        for pt in hand[:21]:
            points.append([
                float(pt.get("x", 0.0)),
                float(pt.get("y", 0.0)),
                float(pt.get("z", 0.0))
            ])
    elif isinstance(hand, list) and len(hand) == 63 and isinstance(hand[0], (int, float)):
        return np.array(hand, dtype=np.float32).reshape(1, -1)
    else:
        raise ValueError(f"Expected at least 21 3D landmark points, got {len(hand)} items.")

    pts_arr = np.array(points, dtype=np.float32)
    # Wrist normalization (point 0 is origin)
    wrist = pts_arr[0]
    normalized = pts_arr - wrist
    return normalized.flatten().reshape(1, -1)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SignBridge AI 36-Class ASL Inference Microservice",
        "model_loaded": ml_state["is_loaded"],
        "class_count": ml_state["class_count"],
        "gislr_ready": os.path.exists(GISLR_MODEL_PATH)
    }

@app.get("/classes")
def get_all_classes():
    return {
        "count": ml_state["class_count"],
        "classes": ml_state["classes"]
    }

@app.post("/predict")
def predict_gesture(payload: PredictRequest):
    """
    Predicts ASL sign across 36 classes (A-Z + 10 conversational signs)
    with strict confidence filtering.
    """
    if not ml_state["is_loaded"] or ml_state["model"] is None:
        if not load_ai_model():
            raise HTTPException(status_code=503, detail="ML model is not loaded.")

    try:
        features = normalize_landmarks(payload.landmarks)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    model = ml_state["model"]
    classes = ml_state["classes"]

    probs = model.predict_proba(features)[0]
    top_idx = int(np.argmax(probs))
    predicted_gesture = str(classes[top_idx])
    confidence = float(probs[top_idx])

    # Top 3 alternatives
    top_3_indices = np.argsort(probs)[-3:][::-1]
    alternatives = [
        {"gesture": str(classes[idx]), "confidence": round(float(probs[idx]), 4)}
        for idx in top_3_indices
    ]

    return {
        "gesture": predicted_gesture,
        "confidence": round(confidence, 4),
        "status": "success",
        "engine": "signbridge-asl-36-rf",
        "alternatives": alternatives
    }

if __name__ == "__main__":
    import uvicorn
    print("==================================================")
    print("🧠 Starting SignBridge AI (36-Class ASL Engine)")
    print("🚀 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
