# SignBridge AI: Python Machine Learning Microservice 🧠

This folder contains the Python-based AI microservice that runs **Google's Official 1st-Place Pretrained GISLR (Isolated Sign Language Recognition) Model**, classifying real-time 3D MediaPipe coordinates across **250 American Sign Language (ASL) words** and bridging with Google Gemini AI.

---

## 🏆 Model Architecture & Engine

- **Model Source:** Google Isolated Sign Language Recognition (GISLR) - 1st Place Solution (`hoyso48/1st-place-solution-inference`)
- **Format:** TensorFlow Lite (`model.tflite`) powered by Google LiteRT runtime
- **Vocabulary:** 250 isolated ASL vocabulary concepts (`sign_to_prediction_index_map.json`)
- **Inference Runtime:** FastAPI on `http://localhost:8000`

---

## 🚀 Quick Setup & Execution

### 1. Install Python Dependencies
Ensure you have Python 3.10+ installed. From the `ai_engine` folder:
```bash
cd ai_engine
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

### 2. Start the Inference Server
```bash
python app.py
```
*The FastAPI server runs on `http://localhost:8000`*.

Or from root workspace:
```bash
npm run dev:ai
```

---

## 🔗 API Endpoints

- **Health Check**: `GET http://localhost:8000/health`
- **Supported Classes List**: `GET http://localhost:8000/classes` (All 250 words)
- **Classify Landmarks**: `POST http://localhost:8000/predict`
  ```json
  {
    "landmarks": [
      {"x": 0.5, "y": 0.5, "z": 0.0},
      ... // 21 or 543 coordinates
    ]
  }
  ```
- **Returns**:
  ```json
  {
    "gesture": "WATER",
    "confidence": 0.94,
    "status": "success",
    "engine": "google-gislr-250-tflite",
    "alternatives": [
      {"gesture": "DRINK", "confidence": 0.04},
      {"gesture": "CUP", "confidence": 0.01}
    ]
  }
  ```
