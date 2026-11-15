import os
import json
import numpy as np
from ai_edge_litert.interpreter import Interpreter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "gislr", "model.tflite")
MAP_PATH = os.path.join(BASE_DIR, "models", "gislr", "sign_to_prediction_index_map.json")

def test_engine():
    print("=" * 60)
    print("🔍 Testing Google GISLR 250-Word TFLite Model...")
    print(f"Model path: {MODEL_PATH}")
    print(f"Map path: {MAP_PATH}")
    
    assert os.path.exists(MODEL_PATH), "model.tflite missing!"
    assert os.path.exists(MAP_PATH), "sign_to_prediction_index_map.json missing!"

    with open(MAP_PATH, "r", encoding="utf-8") as f:
        sign_map = json.load(f)
    
    idx_to_sign = {v: k for k, v in sign_map.items()}
    print(f"✅ Loaded 250 Sign Classes. Total: {len(idx_to_sign)}")
    print(f"Sample classes: {list(sign_map.keys())[:15]}")

    interpreter = Interpreter(model_path=MODEL_PATH)
    runner = interpreter.get_signature_runner("serving_default")

    # Construct sample 543 landmarks frame with hand active
    frame = np.zeros((1, 543, 3), dtype=np.float32)
    # Put sample hand at right_hand index (522:543)
    frame[0, 522:543, 0] = np.linspace(0.4, 0.6, 21)
    frame[0, 522:543, 1] = np.linspace(0.4, 0.7, 21)

    out = runner(inputs=frame)["outputs"]
    top_idx = int(np.argmax(out))
    top_sign = idx_to_sign[top_idx]
    
    # Softmax probabilities
    exp_out = np.exp(out - np.max(out))
    probs = exp_out / np.sum(exp_out)
    confidence = float(probs[top_idx])

    print(f"\n✅ Inference Success!")
    print(f"Predicted Sign: '{top_sign}' (confidence: {confidence*100:.2f}%)")
    print("=" * 60)

if __name__ == "__main__":
    test_engine()
