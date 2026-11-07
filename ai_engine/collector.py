"""
SignBridge AI: Real-Time Hand Landmark Dataset Collector
Allows users to record custom sign language gestures using their physical webcam
and automatically save normalized 21 3D landmarks into a CSV dataset for training.

Usage:
  python collector.py
Controls:
  - Press 's' to start/pause recording frames for the current sign
  - Press 'n' to advance to the next sign
  - Press 'q' to quit
"""

import os
import cv2
import csv
import mediapipe as mp
import numpy as np

DATASET_DIR = os.path.join(os.path.dirname(__file__), "dataset")
DATASET_CSV = os.path.join(DATASET_DIR, "custom_landmarks.csv")

# Signs to record
SIGNS_TO_RECORD = [
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

SAMPLES_PER_SIGN = 60

def main():
    os.makedirs(DATASET_DIR, exist_ok=True)

    # Initialize CSV header if not present
    file_exists = os.path.exists(DATASET_CSV)
    f_csv = open(DATASET_CSV, mode="a", newline="", encoding="utf-8")
    writer = csv.writer(f_csv)

    if not file_exists:
        header = ["label"] + [f"{axis}_{i}" for i in range(21) for axis in ("x", "y", "z")]
        writer.writerow(header)
        f_csv.flush()

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Error] Could not open webcam.")
        return

    print("=======================================================")
    print("🎥 SignBridge AI: Gesture Dataset Collector")
    print("Controls:")
    print("  's' : Toggle Recording on/off")
    print("  'n' : Move to Next Sign")
    print("  'q' : Save and Quit")
    print("=======================================================")

    current_sign_idx = 0
    is_recording = False
    recorded_count = 0

    with mp_hands.Hands(
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    ) as hands:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Mirror view for natural interaction
            frame = cv2.flip(frame, 1)
            h, w, c = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            current_sign = SIGNS_TO_RECORD[current_sign_idx]

            # Draw UI overlay
            cv2.rectangle(frame, (10, 10), (420, 110), (20, 20, 20), -1)
            cv2.putText(frame, f"Sign: {current_sign} ({current_sign_idx+1}/{len(SIGNS_TO_RECORD)})", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, f"Recorded: {recorded_count}/{SAMPLES_PER_SIGN} frames", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            status_color = (0, 0, 255) if is_recording else (0, 255, 0)
            status_text = "● RECORDING (Hold gesture steady)" if is_recording else "STANDBY (Press 's' to record)"
            cv2.putText(frame, status_text, (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 2)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    if is_recording:
                        # Extract 21 coordinates normalized relative to wrist (index 0)
                        wrist = hand_landmarks.landmark[0]
                        row = [current_sign]

                        for lm in hand_landmarks.landmark:
                            row.extend([
                                round(lm.x - wrist.x, 6),
                                round(lm.y - wrist.y, 6),
                                round(lm.z - wrist.z, 6)
                            ])

                        writer.writerow(row)
                        f_csv.flush()
                        recorded_count += 1

                        if recorded_count >= SAMPLES_PER_SIGN:
                            is_recording = False
                            print(f"[Done] Recorded {SAMPLES_PER_SIGN} frames for '{current_sign}'.")

            cv2.imshow("SignBridge AI - Landmark Collector", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                is_recording = not is_recording
            elif key == ord('n'):
                current_sign_idx = (current_sign_idx + 1) % len(SIGNS_TO_RECORD)
                recorded_count = 0
                is_recording = False

    cap.release()
    cv2.destroyAllWindows()
    f_csv.close()
    print(f"\n[Saved] Dataset written to: {DATASET_CSV}")
    print("Now run: python train_model.py to train your model on this data!")

if __name__ == "__main__":
    main()

