import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import load_ai_model, predict_gesture, PredictRequest
from train_model import create_canonical_pose, SIGN_CLASSES

def run_tests():
    print("Testing Pretrained Model Inference...")
    load_ai_model()
    correct = 0
    for sign in SIGN_CLASSES:
        pose = create_canonical_pose(sign)
        lm = [{"x": float(pt[0]), "y": float(pt[1]), "z": float(pt[2])} for pt in pose]
        res = predict_gesture(PredictRequest(landmarks=lm))
        pred = res["gesture"]
        conf = res["confidence"] * 100
        is_ok = pred == sign
        if is_ok:
            correct += 1
        status = "✅ PASS" if is_ok else "❌ FAIL"
        print(f"[{status}] Actual: {sign:<12} | Predicted: {pred:<12} | Conf: {conf:.1f}%")

    print(f"\nResult: {correct}/{len(SIGN_CLASSES)} ({correct/len(SIGN_CLASSES)*100:.1f}%) Passed.")

if __name__ == "__main__":
    run_tests()
