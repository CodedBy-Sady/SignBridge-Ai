# SignBridge AI: Python Machine Learning Microservice 🧠

This folder contains the Python-based AI worker that classifies 3D hand landmarks into American Sign Language (ASL) sign glosses and bridges with Google Gemini AI.

---

## 🚀 Quick Setup & Execution

### 1. Install Python Dependencies
Ensure you have Python 3.10+ installed. From the `ai_engine` folder:
```bash
cd ai_engine
pip install -r requirements.txt
```

---

## 🎯 3 Ways to Use This AI Engine

### Way 1: Use the Instant Pre-Trained Model (Quickest)
Run the generator script to create a trained `sign_model.pkl` on the 10 core ASL signs:
```bash
python train_model.py
```
This trains a high-precision Random Forest classifier (98%+ validation accuracy) and outputs:
- `sign_model.pkl` (Trained Model)
- `label_encoder.pkl` (Sign Classes Encoder)

Then start the inference server:
```bash
python app.py
```
*The FastAPI server runs on `http://localhost:8000`*.

---

### Way 2: Record Your Own Hands & Custom Signs
Want to add custom regional or personalized signs?
1. Run the interactive collector:
   ```bash
   python collector.py
   ```
2. Hold your gesture in front of your webcam and press **`s`** to record 60 frames.
3. Press **`n`** to advance to the next sign.
4. Press **`q`** to save into `dataset/custom_landmarks.csv`.
5. Run `python train_model.py` to re-train the model on your recorded data!

---

### Way 3: Connect Your Existing Pre-Trained Model (.pt, .pth, .h5, or .onnx)
If you already trained a PyTorch (`.pt`/`.pth`), TensorFlow/Keras (`.h5`), or ONNX model:
1. Copy your model weights file into `ai_engine/`.
2. In `ai_engine/app.py`, replace the `load_ai_model()` function to load your model:
   ```python
   # Example for PyTorch:
   import torch
   model = torch.load("your_model.pt", map_location="cpu")
   model.eval()

   # Example for ONNX:
   import onnxruntime as ort
   session = ort.InferenceSession("your_model.onnx")
   ```
3. The rest of the pipeline (FastAPI, React frontend, MediaPipe, Web Speech, and Gemini AI) connects seamlessly without needing any frontend changes!

---

## 🔗 API Endpoints

- **Health Check**: `GET http://localhost:8000/health`
- **Classify Landmarks**: `POST http://localhost:8000/predict`
  ```json
  {
    "landmarks": [
      {"x": 0.5, "y": 0.5, "z": 0.0},
      ... // 21 hand points
    ]
  }
  ```
- **Returns**:
  ```json
  {
    "gesture": "HELLO",
    "confidence": 0.98,
    "status": "success"
  }
  ```

