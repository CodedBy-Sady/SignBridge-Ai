"""
SignBridge AI: Pretrained ASL Gesture Model Generator & Trainer
Generates high-fidelity landmark datasets for 10 core ASL signs with 3D rotation,
jitter augmentation, and wrist-relative coordinate normalization.
Trains a high-precision Random Forest Classifier and exports:
  - sign_model.pkl
  - label_encoder.pkl
"""

import os
import math
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "sign_model.pkl")
ENCODER_FILE = os.path.join(MODEL_DIR, "label_encoder.pkl")

# 10 Core ASL Signs supported by SignBridge AI
SIGN_CLASSES = [
    "HELLO",
    "THANK YOU",
    "HELP",
    "DOCTOR",
    "PLEASE",
    "YES",
    "NO",
    "WHERE",
    "RESTROOM",
    "I LOVE YOU"
]

def get_base_skeleton():
    """Returns canonical neutral 21 landmarks for human hand starting at origin (wrist = 0,0,0)."""
    return [
        (0.0, 0.0, 0.0),        # 0: Wrist
        (-0.06, -0.05, 0.01),   # 1: Thumb CMC
        (-0.10, -0.11, 0.02),   # 2: Thumb MCP
        (-0.13, -0.16, 0.03),   # 3: Thumb IP
        (-0.15, -0.21, 0.04),   # 4: Thumb Tip
        (-0.05, -0.18, 0.01),   # 5: Index MCP
        (-0.06, -0.27, 0.01),   # 6: Index PIP
        (-0.07, -0.34, 0.01),   # 7: Index DIP
        (-0.07, -0.40, 0.01),   # 8: Index Tip
        (0.00, -0.18, 0.00),    # 9: Middle MCP
        (0.00, -0.28, 0.00),    # 10: Middle PIP
        (0.00, -0.36, 0.00),    # 11: Middle DIP
        (0.00, -0.42, 0.00),    # 12: Middle Tip
        (0.05, -0.17, -0.01),   # 13: Ring MCP
        (0.06, -0.26, -0.01),   # 14: Ring PIP
        (0.07, -0.33, -0.01),   # 15: Ring DIP
        (0.07, -0.39, -0.01),   # 16: Ring Tip
        (0.09, -0.15, -0.02),   # 17: Pinky MCP
        (0.12, -0.22, -0.02),   # 18: Pinky PIP
        (0.14, -0.28, -0.02),   # 19: Pinky DIP
        (0.15, -0.33, -0.02),   # 20: Pinky Tip
    ]

def curl_finger(landmarks, mcp_idx, pip_idx, dip_idx, tip_idx, curl_factor=1.0):
    """Curl a finger toward the palm base."""
    mcp = landmarks[mcp_idx]
    pts = list(landmarks)
    target_x, target_y = mcp[0] * 0.4, -0.10
    
    pts[pip_idx] = (
        pts[pip_idx][0] + (target_x - pts[pip_idx][0]) * 0.3 * curl_factor,
        pts[pip_idx][1] * (1.0 - 0.25 * curl_factor),
        pts[pip_idx][2] + 0.04 * curl_factor
    )
    pts[dip_idx] = (
        pts[dip_idx][0] + (target_x - pts[dip_idx][0]) * 0.6 * curl_factor,
        pts[mcp_idx][1] + (target_y - pts[mcp_idx][1]) * 0.5 * curl_factor,
        pts[dip_idx][2] + 0.07 * curl_factor
    )
    pts[tip_idx] = (
        target_x + 0.01 * curl_factor,
        target_y + 0.01 * curl_factor,
        0.06 * curl_factor
    )
    return pts

def curl_thumb(landmarks, curl_factor=1.0):
    """Curl thumb across the palm."""
    pts = list(landmarks)
    pts[2] = (-0.06 * (1.0 - 0.3 * curl_factor), -0.10, 0.03 * curl_factor)
    pts[3] = (-0.03 * (1.0 - 0.5 * curl_factor), -0.12, 0.05 * curl_factor)
    pts[4] = (0.00, -0.14, 0.06 * curl_factor)
    return pts

def create_canonical_pose(sign_name):
    """Constructs the canonical 3D geometry for each ASL gesture."""
    lm = get_base_skeleton()

    if sign_name == "HELLO":
        # Open hand, all fingers extended and spread
        pass

    elif sign_name == "THANK YOU":
        # Flat hand moving forward, fingers close together, hand tilted
        lm[8] = (-0.03, -0.40, 0.05)
        lm[12] = (0.00, -0.42, 0.06)
        lm[16] = (0.03, -0.39, 0.05)
        lm[20] = (0.06, -0.34, 0.04)
        lm[4] = (-0.08, -0.18, 0.03)

    elif sign_name == "HELP":
        # Thumbs up: all 4 fingers tightly curled, thumb pointing straight up
        lm = curl_finger(lm, 5, 6, 7, 8, curl_factor=1.0)
        lm = curl_finger(lm, 9, 10, 11, 12, curl_factor=1.0)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        lm[2] = (-0.06, -0.14, 0.02)
        lm[3] = (-0.06, -0.22, 0.03)
        lm[4] = (-0.06, -0.30, 0.04)

    elif sign_name == "DOCTOR":
        # Bent index and middle fingers (tapping wrist pulse)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        lm = curl_thumb(lm, curl_factor=0.9)
        lm[7] = (-0.06, -0.26, 0.06)
        lm[8] = (-0.06, -0.20, 0.09)
        lm[11] = (0.00, -0.28, 0.06)
        lm[12] = (0.00, -0.22, 0.09)

    elif sign_name == "PLEASE":
        # Flat hand on chest, thumb slightly out
        lm[4] = (-0.11, -0.15, 0.02)
        lm[8] = (-0.03, -0.38, 0.02)
        lm[12] = (0.00, -0.40, 0.02)
        lm[16] = (0.03, -0.37, 0.02)
        lm[20] = (0.06, -0.32, 0.02)

    elif sign_name == "YES":
        # Closed fist nodding
        lm = curl_finger(lm, 5, 6, 7, 8, curl_factor=1.0)
        lm = curl_finger(lm, 9, 10, 11, 12, curl_factor=1.0)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        lm = curl_thumb(lm, curl_factor=1.0)

    elif sign_name == "NO":
        # Index and middle snapping down to touch thumb, ring and pinky curled
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        touch_point = (-0.04, -0.17, 0.05)
        lm[4] = touch_point
        lm[8] = (-0.04, -0.18, 0.05)
        lm[12] = (-0.03, -0.18, 0.05)

    elif sign_name == "WHERE":
        # Index finger pointing straight up, others curled
        lm = curl_finger(lm, 9, 10, 11, 12, curl_factor=1.0)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        lm = curl_thumb(lm, curl_factor=0.8)
        lm[6] = (-0.05, -0.28, 0.0)
        lm[7] = (-0.05, -0.36, 0.0)
        lm[8] = (-0.05, -0.44, 0.0)

    elif sign_name == "RESTROOM":
        # ASL "T" hand: thumb tucked between index and middle, others curled
        lm = curl_finger(lm, 5, 6, 7, 8, curl_factor=0.9)
        lm = curl_finger(lm, 9, 10, 11, 12, curl_factor=1.0)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm = curl_finger(lm, 17, 18, 19, 20, curl_factor=1.0)
        lm[4] = (-0.03, -0.21, 0.04)

    elif sign_name == "I LOVE YOU":
        # Thumb, Index, Pinky extended; Middle and Ring curled
        lm = curl_finger(lm, 9, 10, 11, 12, curl_factor=1.0)
        lm = curl_finger(lm, 13, 14, 15, 16, curl_factor=1.0)
        lm[2] = (-0.11, -0.12, 0.02)
        lm[3] = (-0.15, -0.18, 0.03)
        lm[4] = (-0.19, -0.23, 0.04)
        lm[8] = (-0.07, -0.42, 0.01)
        lm[20] = (0.17, -0.35, -0.02)

    return np.array(lm)

def rotate_3d(points, roll, pitch, yaw):
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(roll), -math.sin(roll)],
        [0, math.sin(roll), math.cos(roll)]
    ])
    Ry = np.array([
        [math.cos(pitch), 0, math.sin(pitch)],
        [0, 1, 0],
        [-math.sin(pitch), 0, math.cos(pitch)]
    ])
    Rz = np.array([
        [math.cos(yaw), -math.sin(yaw), 0],
        [math.sin(yaw), math.cos(yaw), 0],
        [0, 0, 1]
    ])
    return points @ (Rz @ Ry @ Rx).T

def generate_augmented_dataset(samples_per_sign=600):
    X = []
    y = []

    print(f"Generating {len(SIGN_CLASSES)} ASL classes x {samples_per_sign} samples...")

    for sign in SIGN_CLASSES:
        canonical = create_canonical_pose(sign)

        for _ in range(samples_per_sign):
            # 1. 3D Rotation (±18 deg)
            roll = np.random.uniform(-0.30, 0.30)
            pitch = np.random.uniform(-0.30, 0.30)
            yaw = np.random.uniform(-0.30, 0.30)
            rotated = rotate_3d(canonical, roll, pitch, yaw)

            # 2. Scale factor (±15%)
            scale = np.random.uniform(0.85, 1.15)
            scaled = rotated * scale

            # 3. Gaussian sensor noise
            noise = np.random.normal(0, 0.007, scaled.shape)
            sample = scaled + noise

            # 4. Wrist normalization
            wrist = sample[0]
            normalized = sample - wrist

            X.append(normalized.flatten())
            y.append(sign)

    return np.array(X), np.array(y)

def train_and_export():
    print("==================================================")
    print("🚀 Training SignBridge AI ASL Classification Model")
    print("==================================================")

    X, y = generate_augmented_dataset(samples_per_sign=700)
    print(f"Dataset shape: {X.shape}, Total samples: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Validation Accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, digits=4))

    # CRITICAL: Export clf.classes_ directly so indices match predict_proba
    classes_list = list(clf.classes_)

    joblib.dump(clf, MODEL_FILE)
    joblib.dump(classes_list, ENCODER_FILE)

    print(f"🎉 Model exported to: {MODEL_FILE}")
    print(f"🎉 Classes encoder exported to: {ENCODER_FILE}")
    print(f"Order of classes: {classes_list}")
    print("==================================================")

if __name__ == "__main__":
    train_and_export()
