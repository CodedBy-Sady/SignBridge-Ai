"""
SignBridge AI: Python FastAPI Dual Landmark Inference Microservice
Engines:
  1. 36-Class ASL Gesture Model (A-Z + 10 Core Signs)
  2. 60-Class BdSLW60 Bangla Sign Model (Family, Food, Daily, Household, Medical)
Port: 8000
Endpoints:
  GET  /health        - Health, Models Status & Classes Info
  GET  /classes       - ASL supported classes
  GET  /bdsl/classes  - Full list and metadata of all 60 BdSL classes
  POST /predict       - Real-time gesture prediction (supports lang="asl" or lang="bdsl")
"""

import os
import sys
import json
import joblib
import numpy as np
from typing import Any, List, Dict, Union, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ASL Model Paths
ASL_MODEL_FILE = os.path.join(BASE_DIR, "sign_model.pkl")
ASL_ENCODER_FILE = os.path.join(BASE_DIR, "label_encoder.pkl")
GISLR_MODEL_PATH = os.path.join(BASE_DIR, "models", "gislr", "model.tflite")

# BdSL 60 Model Paths
BDSL_MODEL_FILE = os.path.join(BASE_DIR, "bdsl60_model.pkl")
BDSL_ENCODER_FILE = os.path.join(BASE_DIR, "bdsl60_encoder.pkl")
BDSL_METADATA_FILE = os.path.join(BASE_DIR, "bdsl60_metadata.json")

# State holders
asl_state = {
    "model": None,
    "classes": [],
    "is_loaded": False,
    "class_count": 0
}

bdsl_state = {
    "model": None,
    "classes": [],
    "metadata": {},
    "is_loaded": False,
    "class_count": 0
}

def load_models():
    """Loads both ASL (36 classes) and BdSL (60 classes) models."""
    # 1. Load ASL Model
    if os.path.exists(ASL_MODEL_FILE) and os.path.exists(ASL_ENCODER_FILE):
        try:
            asl_state["model"] = joblib.load(ASL_MODEL_FILE)
            asl_state["classes"] = list(joblib.load(ASL_ENCODER_FILE))
            asl_state["class_count"] = len(asl_state["classes"])
            asl_state["is_loaded"] = True
            print(f"🚀 [AI Engine] Loaded ASL 36-Class Model ({asl_state['class_count']} classes)")
        except Exception as e:
            print(f"[AI Engine Error] Failed to load ASL model: {e}", file=sys.stderr)

    # 2. Load BdSL 60 Model
    if os.path.exists(BDSL_MODEL_FILE) and os.path.exists(BDSL_ENCODER_FILE):
        try:
            bdsl_state["model"] = joblib.load(BDSL_MODEL_FILE)
            bdsl_state["classes"] = list(joblib.load(BDSL_ENCODER_FILE))
            bdsl_state["class_count"] = len(bdsl_state["classes"])
            if os.path.exists(BDSL_METADATA_FILE):
                with open(BDSL_METADATA_FILE, "r", encoding="utf-8") as f:
                    bdsl_state["metadata"] = json.load(f)
            bdsl_state["is_loaded"] = True
            print(f"🇧🇩 [AI Engine] Loaded BdSL 60-Class Model ({bdsl_state['class_count']} words)")
        except Exception as e:
            print(f"[AI Engine Error] Failed to load BdSL model: {e}", file=sys.stderr)

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield
    asl_state.clear()
    bdsl_state.clear()

app = FastAPI(
    title="SignBridge AI - Dual ASL & BdSL Gesture Inference Service",
    description="Real-time recognition for 36-Class ASL and 60-Class Bangla Sign Language (BdSLW60)",
    version="2.5.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite) and Node backend (Express)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    landmarks: Union[List[Dict[str, float]], List[List[Dict[str, float]]], List[float], List[Any]]
    lang: Optional[str] = "asl"  # "asl" or "bdsl"

def normalize_landmarks(raw_landmarks: Any) -> np.ndarray:
    """Parses 21 (x, y, z) MediaPipe hand landmarks and normalizes relative to wrist."""
    if not raw_landmarks:
        raise ValueError("Landmarks payload is empty.")

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
        "service": "SignBridge AI Dual ASL & BdSL Inference Microservice",
        "asl": {
            "loaded": asl_state["is_loaded"],
            "classes": asl_state["class_count"]
        },
        "bdsl": {
            "loaded": bdsl_state["is_loaded"],
            "classes": bdsl_state["class_count"],
            "dataset": "BdSLW60 (arXiv:2402.08635)"
        },
        "gislr_ready": os.path.exists(GISLR_MODEL_PATH)
    }

@app.get("/classes")
def get_asl_classes():
    return {
        "count": asl_state["class_count"],
        "classes": asl_state["classes"]
    }

@app.get("/bdsl/classes")
def get_bdsl_classes():
    return {
        "count": bdsl_state["class_count"],
        "classes": bdsl_state["classes"],
        "metadata": bdsl_state.get("metadata", {})
    }

@app.post("/predict")
def predict_gesture(payload: PredictRequest, lang: Optional[str] = Query(None)):
    """
    Predicts signs across ASL (36 classes) or BdSL (60 classes)
    based on requested language parameter.
    """
    # Check language target: "bdsl" / "bn" / "bangla" vs "asl" / "en"
    req_lang = lang if isinstance(lang, str) else getattr(payload, "lang", "asl")
    target_lang = (req_lang or "asl").lower()
    is_bdsl = target_lang in ["bdsl", "bn", "bangla"]

    if is_bdsl:
        if not bdsl_state["is_loaded"] or bdsl_state["model"] is None:
            load_models()
            if not bdsl_state["is_loaded"]:
                raise HTTPException(status_code=503, detail="BdSL 60-Class model is not loaded. Run train_bdsl60.py first.")
        active_model = bdsl_state["model"]
        active_classes = bdsl_state["classes"]
        engine_tag = "signbridge-bdsl-60-rf"
    else:
        if not asl_state["is_loaded"] or asl_state["model"] is None:
            load_models()
            if not asl_state["is_loaded"]:
                raise HTTPException(status_code=503, detail="ASL 36-Class model is not loaded.")
        active_model = asl_state["model"]
        active_classes = asl_state["classes"]
        engine_tag = "signbridge-asl-36-rf"

    try:
        features = normalize_landmarks(payload.landmarks)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    probs = active_model.predict_proba(features)[0]
    top_idx = int(np.argmax(probs))
    predicted_gesture = str(active_classes[top_idx])
    confidence = float(probs[top_idx])

    # Top 3 alternatives
    top_3_indices = np.argsort(probs)[-3:][::-1]
    alternatives = [
        {"gesture": str(active_classes[idx]), "confidence": round(float(probs[idx]), 4)}
        for idx in top_3_indices
    ]

    return {
        "gesture": predicted_gesture,
        "confidence": round(confidence, 4),
        "status": "success",
        "lang": "bdsl" if is_bdsl else "asl",
        "engine": engine_tag,
        "alternatives": alternatives
    }

if __name__ == "__main__":
    import uvicorn
    print("==================================================")
    print("🧠 Starting SignBridge AI Dual Inference Microservice")
    print("🚀 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
