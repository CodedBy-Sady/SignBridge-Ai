"""
SignBridge AI: Python FastAPI Landmark Inference Microservice
Engine: Google Kaggle GISLR 250-Word Pretrained TFLite Model (1st Place Architecture)
Port: 8000
Endpoints:
  GET  /health  - Health, Model Info & 250 Classes List
  POST /predict - Real-time ASL sign classification across 250 sign words
"""

import os
import sys
import json
import numpy as np
from typing import Any, List, Dict, Union, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_edge_litert.interpreter import Interpreter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GISLR_MODEL_PATH = os.path.join(BASE_DIR, "models", "gislr", "model.tflite")
GISLR_MAP_PATH = os.path.join(BASE_DIR, "models", "gislr", "sign_to_prediction_index_map.json")

# Global state for GISLR Engine
gislr_state = {
    "interpreter": None,
    "runner": None,
    "idx_to_sign": {},
    "sign_to_idx": {},
    "is_loaded": False,
    "class_count": 0
}

def load_gislr_model():
    """Loads Google GISLR 250-Word TFLite model and vocabulary map."""
    if os.path.exists(GISLR_MODEL_PATH) and os.path.exists(GISLR_MAP_PATH):
        try:
            with open(GISLR_MAP_PATH, "r", encoding="utf-8") as f:
                sign_map = json.load(f)
            
            gislr_state["sign_to_idx"] = sign_map
            gislr_state["idx_to_sign"] = {v: k for k, v in sign_map.items()}
            gislr_state["class_count"] = len(sign_map)

            interpreter = Interpreter(model_path=GISLR_MODEL_PATH)
            gislr_state["interpreter"] = interpreter
            gislr_state["runner"] = interpreter.get_signature_runner("serving_default")
            gislr_state["is_loaded"] = True

            print("==================================================")
            print("🚀 [AI Engine] Successfully loaded Google GISLR Model!")
            print(f"📦 Model File: {GISLR_MODEL_PATH}")
            print(f"📖 Total Supported ASL Words: {gislr_state['class_count']}")
            print("==================================================")
            return True
        except Exception as e:
            print(f"[AI Engine Error] Failed to load Google GISLR TFLite: {e}", file=sys.stderr)
            return False
    else:
        print("[AI Engine Warning] Google GISLR model.tflite or map not found!")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_gislr_model()
    yield
    gislr_state.clear()

app = FastAPI(
    title="SignBridge AI - Google GISLR 250-Word Inference Service",
    description="Real-time 250-word ASL gesture classifier using Google's 1st-place GISLR Model",
    version="2.0.0",
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

def adapt_to_543_landmarks(raw_landmarks: Any) -> np.ndarray:
    """
    Transforms any incoming landmark format (21 hand points, 42 two-hand points, or full 543)
    into the required [1, 543, 3] Google GISLR input tensor.
    Indices:
      - 0 to 467: Face (468)
      - 468 to 488: Left Hand (21)
      - 489 to 521: Pose (33)
      - 522 to 542: Right Hand (21)
    """
    frame = np.zeros((1, 543, 3), dtype=np.float32)

    if not raw_landmarks:
        return frame

    # If passed as multiHandLandmarks array [[hand1], [hand2]]
    if isinstance(raw_landmarks, list) and len(raw_landmarks) > 0 and isinstance(raw_landmarks[0], list):
        hand1 = raw_landmarks[0]
        hand2 = raw_landmarks[1] if len(raw_landmarks) > 1 else None

        # Hand 1 placed in Right Hand slot (dominant)
        if isinstance(hand1, list):
            for i, pt in enumerate(hand1[:21]):
                if isinstance(pt, dict):
                    frame[0, 522 + i, 0] = float(pt.get("x", 0.0))
                    frame[0, 522 + i, 1] = float(pt.get("y", 0.0))
                    frame[0, 522 + i, 2] = float(pt.get("z", 0.0))
        
        # Hand 2 placed in Left Hand slot
        if hand2 and isinstance(hand2, list):
            for i, pt in enumerate(hand2[:21]):
                if isinstance(pt, dict):
                    frame[0, 468 + i, 0] = float(pt.get("x", 0.0))
                    frame[0, 468 + i, 1] = float(pt.get("y", 0.0))
                    frame[0, 468 + i, 2] = float(pt.get("z", 0.0))
        return frame

    # If single hand array of 21 points
    if isinstance(raw_landmarks, list) and len(raw_landmarks) >= 21 and isinstance(raw_landmarks[0], dict):
        if len(raw_landmarks) >= 543:
            # Full holistic
            for i, pt in enumerate(raw_landmarks[:543]):
                frame[0, i, 0] = float(pt.get("x", 0.0))
                frame[0, i, 1] = float(pt.get("y", 0.0))
                frame[0, i, 2] = float(pt.get("z", 0.0))
        else:
            # Single hand placed in Right Hand slot
            for i, pt in enumerate(raw_landmarks[:21]):
                frame[0, 522 + i, 0] = float(pt.get("x", 0.0))
                frame[0, 522 + i, 1] = float(pt.get("y", 0.0))
                frame[0, 522 + i, 2] = float(pt.get("z", 0.0))
        return frame

    return frame

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SignBridge AI Google GISLR Inference Engine",
        "model": "Google 1st Place Winning Isolated Sign Language Model",
        "model_loaded": gislr_state["is_loaded"],
        "class_count": gislr_state["class_count"],
        "sample_words": list(gislr_state["sign_to_idx"].keys())[:20] if gislr_state["is_loaded"] else []
    }

@app.get("/classes")
def get_all_classes():
    """Returns the complete list of 250 ASL words supported."""
    return {
        "count": gislr_state["class_count"],
        "classes": sorted(list(gislr_state["sign_to_idx"].keys()))
    }

@app.post("/predict")
def predict_gesture(payload: PredictRequest):
    """
    Predicts ASL sign across 250 words from MediaPipe landmarks.
    """
    if not gislr_state["is_loaded"] or gislr_state["runner"] is None:
        if not load_gislr_model():
            raise HTTPException(
                status_code=503,
                detail="Google GISLR model is not loaded. Check model files in models/gislr."
            )

    try:
        frame_tensor = adapt_to_543_landmarks(payload.landmarks)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Landmark processing error: {e}")

    runner = gislr_state["runner"]
    idx_to_sign = gislr_state["idx_to_sign"]

    # Run inference
    raw_outputs = runner(inputs=frame_tensor)["outputs"]

    # Softmax conversion
    exp_out = np.exp(raw_outputs - np.max(raw_outputs))
    probs = exp_out / np.sum(exp_out)

    top_idx = int(np.argmax(probs))
    predicted_word = idx_to_sign.get(top_idx, "UNKNOWN")
    confidence = float(probs[top_idx])

    # Top 3 alternatives
    top_3_indices = np.argsort(probs)[-3:][::-1]
    alternatives = [
        {"gesture": idx_to_sign.get(int(idx), "").upper(), "confidence": round(float(probs[idx]), 4)}
        for idx in top_3_indices
    ]

    return {
        "gesture": predicted_word.upper(),
        "confidence": round(confidence, 4),
        "status": "success",
        "engine": "google-gislr-250-tflite",
        "alternatives": alternatives
    }

if __name__ == "__main__":
    import uvicorn
    print("==================================================")
    print("🧠 Starting SignBridge AI (Google GISLR 250 Words)")
    print("🚀 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
