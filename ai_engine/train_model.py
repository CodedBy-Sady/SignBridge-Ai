"""
SignBridge AI: 36-Class ASL Model Generator & Trainer
Classes (36 Total):
  - 26 Alphabet Letters: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
  - 10 Conversational Signs: HELLO, HELP, THANK YOU, PLEASE, YES, NO, DOCTOR, WHERE, RESTROOM, I LOVE YOU
Features: MediaPipe 21 3D joint landmarks (63 features), wrist-relative normalized.
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

# 36 ASL Classes
ALPHABET_CLASSES = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
WORD_CLASSES = [
    "HELLO", "HELP", "THANK YOU", "PLEASE", "YES",
    "NO", "DOCTOR", "WHERE", "RESTROOM", "I LOVE YOU"
]
ALL_CLASSES = sorted(ALPHABET_CLASSES + WORD_CLASSES)

def get_base_skeleton():
    """Canonical open-hand 21 3D joint coordinates starting at wrist (0, 0, 0)."""
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
    pts = list(landmarks)
    pts[2] = (-0.06 * (1.0 - 0.3 * curl_factor), -0.10, 0.03 * curl_factor)
    pts[3] = (-0.03 * (1.0 - 0.5 * curl_factor), -0.12, 0.05 * curl_factor)
    pts[4] = (0.00, -0.14, 0.06 * curl_factor)
    return pts

def create_canonical_pose(label):
    lm = get_base_skeleton()

    # --- 10 WORDS ---
    if label == "HELLO":
        return np.array(lm)

    elif label == "THANK YOU":
        lm[8] = (-0.03, -0.40, 0.05)
        lm[12] = (0.00, -0.42, 0.06)
        lm[16] = (0.03, -0.39, 0.05)
        lm[20] = (0.06, -0.34, 0.04)
        lm[4] = (-0.08, -0.18, 0.03)

    elif label == "HELP":
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[2] = (-0.06, -0.14, 0.02)
        lm[3] = (-0.06, -0.22, 0.03)
        lm[4] = (-0.06, -0.30, 0.04)

    elif label == "DOCTOR":
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.9)
        lm[7] = (-0.06, -0.26, 0.06)
        lm[8] = (-0.06, -0.20, 0.09)
        lm[11] = (0.00, -0.28, 0.06)
        lm[12] = (0.00, -0.22, 0.09)

    elif label == "PLEASE":
        lm[4] = (-0.11, -0.15, 0.02)
        lm[8] = (-0.03, -0.38, 0.02)
        lm[12] = (0.00, -0.40, 0.02)
        lm[16] = (0.03, -0.37, 0.02)
        lm[20] = (0.06, -0.32, 0.02)

    elif label == "YES":
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 1.0)

    elif label == "NO":
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        touch_point = (-0.04, -0.17, 0.05)
        lm[4] = touch_point
        lm[8] = (-0.04, -0.18, 0.05)
        lm[12] = (-0.03, -0.18, 0.05)

    elif label == "WHERE":
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.05, -0.44, 0.0)

    elif label == "RESTROOM":
        lm = curl_finger(lm, 5, 6, 7, 8, 0.9)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.03, -0.21, 0.04)

    elif label == "I LOVE YOU":
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm[4] = (-0.19, -0.23, 0.04)
        lm[8] = (-0.07, -0.42, 0.01)
        lm[20] = (0.17, -0.35, -0.02)

    # --- 26 ALPHABET LETTERS (A to Z) ---
    elif label == "A":
        # Fist with thumb resting on side pointing up
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.10, -0.22, 0.02)

    elif label == "B":
        # 4 fingers straight up, thumb tucked across palm
        lm = curl_thumb(lm, 1.0)

    elif label == "C":
        # Curved fingers and thumb like a C
        for i in [8, 12, 16, 20]:
            lm[i] = (lm[i][0] * 0.7, -0.25, 0.12)
        lm[4] = (-0.08, -0.12, 0.12)

    elif label == "D":
        # Index straight up, other fingers touch thumb
        lm = curl_finger(lm, 9, 10, 11, 12, 0.9)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.9)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.9)
        lm[4] = (-0.02, -0.18, 0.06)
        lm[8] = (-0.06, -0.42, 0.0)

    elif label == "E":
        # All fingers tightly clawed onto thumb
        for m, p, d, t in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, m, p, d, t, 1.2)
        lm[4] = (0.00, -0.11, 0.04)

    elif label == "F":
        # OK sign: Index touches thumb, middle, ring, pinky extended
        lm[4] = (-0.04, -0.20, 0.05)
        lm[8] = (-0.04, -0.20, 0.05)

    elif label == "G":
        # Index pointing sideways/horizontal, thumb parallel
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[8] = (-0.22, -0.25, 0.0)
        lm[4] = (-0.18, -0.23, 0.0)

    elif label == "H":
        # Index and middle pointing horizontal together
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.25, -0.26, 0.0)
        lm[12] = (-0.25, -0.22, 0.0)

    elif label == "I":
        # Pinky extended straight up, others curled in fist
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_thumb(lm, 0.9)
        lm[20] = (0.15, -0.34, 0.0)

    elif label == "J":
        # Pinky curved outward
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_thumb(lm, 0.9)
        lm[20] = (0.22, -0.28, 0.08)

    elif label == "K":
        # V sign with thumb resting between index and middle
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.03, -0.24, 0.04)
        lm[8] = (-0.08, -0.42, 0.0)
        lm[12] = (0.02, -0.36, 0.06)

    elif label == "L":
        # L shape: Index up, thumb at 90 degrees out
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.20, -0.12, 0.0)
        lm[8] = (-0.06, -0.42, 0.0)

    elif label == "M":
        # Thumb tucked under 3 fingers (Index, Middle, Ring)
        lm = curl_finger(lm, 5, 6, 7, 8, 0.8)
        lm = curl_finger(lm, 9, 10, 11, 12, 0.8)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.8)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.05, -0.14, 0.05)

    elif label == "N":
        # Thumb tucked under 2 fingers (Index, Middle)
        lm = curl_finger(lm, 5, 6, 7, 8, 0.8)
        lm = curl_finger(lm, 9, 10, 11, 12, 0.8)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.01, -0.14, 0.05)

    elif label == "O":
        # All fingertips touching thumb forming O loop
        for i in [8, 12, 16, 20]:
            lm[i] = (-0.05, -0.20, 0.08)
        lm[4] = (-0.05, -0.19, 0.08)

    elif label == "P":
        # K shape pointed downward
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.05, -0.15, -0.05)
        lm[8] = (-0.06, -0.12, -0.18)
        lm[12] = (0.00, -0.18, -0.15)

    elif label == "Q":
        # G shape pointed downward
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[8] = (-0.12, -0.12, -0.18)
        lm[4] = (-0.08, -0.15, -0.14)

    elif label == "R":
        # Index and middle crossed
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (0.01, -0.40, 0.02)
        lm[12] = (-0.03, -0.40, -0.02)

    elif label == "S":
        # Fist with thumb curled over front of fingers
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.01, -0.16, 0.06)

    elif label == "T":
        # Fist with thumb tucked between index and middle
        lm = curl_finger(lm, 5, 6, 7, 8, 0.9)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.03, -0.20, 0.05)

    elif label == "U":
        # Index and middle straight up together
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.02, -0.42, 0.0)
        lm[12] = (0.01, -0.42, 0.0)

    elif label == "V":
        # Index and middle spread in V
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.08, -0.41, 0.0)
        lm[12] = (0.06, -0.41, 0.0)

    elif label == "W":
        # Index, middle, ring spread in W
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.04, -0.15, 0.04)
        lm[8] = (-0.09, -0.40, 0.0)
        lm[12] = (0.00, -0.42, 0.0)
        lm[16] = (0.09, -0.40, 0.0)

    elif label == "X":
        # Index hooked, others in fist
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[7] = (-0.06, -0.28, 0.08)
        lm[8] = (-0.06, -0.22, 0.12)

    elif label == "Y":
        # Thumb and pinky extended out, others curled (Hang Loose)
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm[4] = (-0.20, -0.18, 0.02)
        lm[20] = (0.19, -0.30, -0.02)

    elif label == "Z":
        # Index finger pointing, slight diagonal
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.03, -0.43, 0.03)

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

def generate_augmented_dataset(samples_per_class=450):
    X = []
    y = []

    print(f"Generating 36 ASL classes x {samples_per_class} samples (Total: {36 * samples_per_class})...")

    for label in ALL_CLASSES:
        canonical = create_canonical_pose(label)

        for _ in range(samples_per_class):
            # 3D spatial rotation (±16 degrees)
            roll = np.random.uniform(-0.28, 0.28)
            pitch = np.random.uniform(-0.28, 0.28)
            yaw = np.random.uniform(-0.28, 0.28)
            rotated = rotate_3d(canonical, roll, pitch, yaw)

            # Scale variance (hand distance ±14%)
            scale = np.random.uniform(0.86, 1.14)
            scaled = rotated * scale

            # Sensor Gaussian noise
            noise = np.random.normal(0, 0.006, scaled.shape)
            sample = scaled + noise

            # Wrist normalization (wrist is 0,0,0)
            wrist = sample[0]
            normalized = sample - wrist

            X.append(normalized.flatten())
            y.append(label)

    return np.array(X), np.array(y)

def train_and_export():
    print("==================================================")
    print("🚀 Training SignBridge AI 36-Class ASL Model")
    print(f"📋 Classes ({len(ALL_CLASSES)}): {ALL_CLASSES}")
    print("==================================================")

    X, y = generate_augmented_dataset(samples_per_class=500)
    print(f"Dataset shape: {X.shape}, Total samples: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=140,
        max_depth=18,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Validation Accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, digits=4))

    classes_list = list(clf.classes_)

    joblib.dump(clf, MODEL_FILE)
    joblib.dump(classes_list, ENCODER_FILE)

    print(f"🎉 Model exported to: {MODEL_FILE}")
    print(f"🎉 Classes encoder exported to: {ENCODER_FILE}")
    print("==================================================")

if __name__ == "__main__":
    train_and_export()
