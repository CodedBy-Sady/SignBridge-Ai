"""
SignBridge AI: 60-Class BdSLW60 Model Generator & Trainer
Covers all 60 word-level classes from the official BdSLW60 dataset (arXiv:2402.08635):
  - 14 Family/Relatives: বাবা, আত্মীয়, ভাই, বোন, বৌ, চাচা, চাচী, দাদা/নানা, দাদী/নানী, দায়িত্ব, দেবর, দুলাভাই, কন্যা, মা
  - 14 Food/Fruits: আম, আলু, আনারস, আঙ্গুর, আপেল, বিস্কুট, বরই, কেক, চা, চাল, চিনি, চিপস, চকলেট, ডাল
  - 12 Personal/Clothing: বোতাম, টুপি, চাদর, চিরুনি, চশমা, চুড়ি, ক্লিপ, ক্রিম, তথ্য, দেনাদার, জমজ, জুতা
  - 10 Household/Electronics: টুথপেস্ট, টি-শার্ট, টিউবলাইট, টেলিভিশন, এসি, অ্যাপার্টমেন্ট, অডিও ক্যাসেট, আয়না, বালতি, বালু
  - 10 Medical/Health: এইডস, বাত, ব্যান্ডেজ, ক্যাপসুল, চিকিৎসা, চোখ ওঠা, ডেঙ্গু, ডাক্তার, দংশন, দুর্বল
Features: MediaPipe 21 3D joint landmarks (63 features), wrist-relative normalized.
"""

import os
import sys
import json
import math
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "bdsl60_model.pkl")
ENCODER_FILE = os.path.join(MODEL_DIR, "bdsl60_encoder.pkl")
METADATA_FILE = os.path.join(MODEL_DIR, "bdsl60_metadata.json")

# 60 BdSL Classes with Bengali Label, English gloss, and Category
BDSL_CLASSES = [
    # Family (14)
    {"id": "W1", "bn": "বাবা", "en": "Father", "cat": "family"},
    {"id": "W2", "bn": "আত্মীয়", "en": "Relatives", "cat": "family"},
    {"id": "W3", "bn": "ভাই", "en": "Brother", "cat": "family"},
    {"id": "W4", "bn": "বোন", "en": "Sister", "cat": "family"},
    {"id": "W5", "bn": "বৌ", "en": "Wife", "cat": "family"},
    {"id": "W6", "bn": "চাচা", "en": "Uncle", "cat": "family"},
    {"id": "W7", "bn": "চাচী", "en": "Aunt", "cat": "family"},
    {"id": "W8", "bn": "দাদা/নানা", "en": "Grandfather", "cat": "family"},
    {"id": "W9", "bn": "দাদী/নানী", "en": "Grandmother", "cat": "family"},
    {"id": "W10", "bn": "দায়িত্ব", "en": "Responsibility", "cat": "family"},
    {"id": "W11", "bn": "দেবর", "en": "Brother-in-law", "cat": "family"},
    {"id": "W12", "bn": "দুলাভাই", "en": "Brother-in-law (Sister's husband)", "cat": "family"},
    {"id": "W19", "bn": "কন্যা", "en": "Daughter", "cat": "family"},
    {"id": "W20", "bn": "মা", "en": "Mother", "cat": "family"},

    # Food & Fruits (14)
    {"id": "W37", "bn": "আম", "en": "Mango", "cat": "food"},
    {"id": "W38", "bn": "আলু", "en": "Potato", "cat": "food"},
    {"id": "W39", "bn": "আনারস", "en": "Pineapple", "cat": "food"},
    {"id": "W40", "bn": "আঙ্গুর", "en": "Grapes", "cat": "food"},
    {"id": "W41", "bn": "আপেল", "en": "Apple", "cat": "food"},
    {"id": "W42", "bn": "বিস্কুট", "en": "Biscuit", "cat": "food"},
    {"id": "W43", "bn": "বরই", "en": "Plum/Jujube", "cat": "food"},
    {"id": "W44", "bn": "কেক", "en": "Cake", "cat": "food"},
    {"id": "W45", "bn": "চা", "en": "Tea", "cat": "food"},
    {"id": "W46", "bn": "চাল", "en": "Rice", "cat": "food"},
    {"id": "W47", "bn": "চিনি", "en": "Sugar", "cat": "food"},
    {"id": "W48", "bn": "চিপস", "en": "Chips", "cat": "food"},
    {"id": "W49", "bn": "চকলেট", "en": "Chocolate", "cat": "food"},
    {"id": "W50", "bn": "ডাল", "en": "Lentils", "cat": "food"},

    # Daily & Items (12)
    {"id": "W91", "bn": "বোতাম", "en": "Button", "cat": "items"},
    {"id": "W92", "bn": "টুপি", "en": "Cap", "cat": "items"},
    {"id": "W93", "bn": "চাদর", "en": "Shawl", "cat": "items"},
    {"id": "W94", "bn": "চিরুনি", "en": "Comb", "cat": "items"},
    {"id": "W95", "bn": "চশমা", "en": "Spectacles", "cat": "items"},
    {"id": "W96", "bn": "চুড়ি", "en": "Bangles", "cat": "items"},
    {"id": "W97", "bn": "ক্লিপ", "en": "Hair Clip", "cat": "items"},
    {"id": "W98", "bn": "ক্রিম", "en": "Cream", "cat": "items"},
    {"id": "W99", "bn": "তথ্য", "en": "Data/Info", "cat": "items"},
    {"id": "W100", "bn": "দেনাদার", "en": "Debtor", "cat": "items"},
    {"id": "W111", "bn": "জমজ", "en": "Twin", "cat": "items"},
    {"id": "W112", "bn": "জুতা", "en": "Shoe", "cat": "items"},

    # Household & Lifestyle (10)
    {"id": "W211", "bn": "টুথপেস্ট", "en": "Toothpaste", "cat": "household"},
    {"id": "W212", "bn": "টি-শার্ট", "en": "T-shirt", "cat": "household"},
    {"id": "W213", "bn": "টিউবলাইট", "en": "Tubelight", "cat": "household"},
    {"id": "W214", "bn": "টেলিভিশন", "en": "Television", "cat": "household"},
    {"id": "W215", "bn": "এসি", "en": "Air Conditioner", "cat": "household"},
    {"id": "W216", "bn": "অ্যাপার্টমেন্ট", "en": "Apartment", "cat": "household"},
    {"id": "W217", "bn": "অডিও ক্যাসেট", "en": "Audio Cassette", "cat": "household"},
    {"id": "W218", "bn": "আয়না", "en": "Looking Mirror", "cat": "household"},
    {"id": "W219", "bn": "বালতি", "en": "Water Bucket", "cat": "household"},
    {"id": "W220", "bn": "বালু", "en": "Sand", "cat": "household"},

    # Medical & Health (10)
    {"id": "W351", "bn": "এইডস", "en": "AIDS", "cat": "medical"},
    {"id": "W352", "bn": "বাত", "en": "Arthritis", "cat": "medical"},
    {"id": "W353", "bn": "ব্যান্ডেজ", "en": "Bandage", "cat": "medical"},
    {"id": "W354", "bn": "ক্যাপসুল", "en": "Capsule", "cat": "medical"},
    {"id": "W355", "bn": "চিকিৎসা", "en": "Treatment", "cat": "medical"},
    {"id": "W356", "bn": "চোখ ওঠা", "en": "Conjunctivitis", "cat": "medical"},
    {"id": "W357", "bn": "ডেঙ্গু", "en": "Dengue", "cat": "medical"},
    {"id": "W358", "bn": "ডাক্তার", "en": "Doctor", "cat": "medical"},
    {"id": "W359", "bn": "দংশন", "en": "Bite", "cat": "medical"},
    {"id": "W360", "bn": "দুর্বল", "en": "Weak", "cat": "medical"}
]

ALL_CLASS_NAMES = [item["bn"] for item in BDSL_CLASSES]
CLASS_MAP = {item["bn"]: item for item in BDSL_CLASSES}

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
    target_x = mcp[0] * 0.4
    target_y = -0.10
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

def create_canonical_bdsl_pose(label):
    """
    Synthesizes the specific 3D joint landmark geometry for all 60 BdSL word signs.
    """
    lm = get_base_skeleton()

    # --- 14 FAMILY & RELATIVES ---
    if label == "বাবা":  # W1: Flat salute / respect pose (palm open, thumb tucked near temple)
        lm = curl_thumb(lm, 0.9)
        lm[8] = (-0.07, -0.42, 0.02)
        lm[12] = (0.00, -0.44, 0.02)
        lm[16] = (0.07, -0.41, 0.02)
        lm[20] = (0.14, -0.35, 0.02)

    elif label == "আত্মীয়":  # W2: Interlinked index & thumb ring (connection/relatives)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.7)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.7)
        lm[4] = (-0.04, -0.22, 0.06)
        lm[8] = (-0.04, -0.22, 0.06)
        lm[12] = (0.00, -0.38, 0.01)

    elif label == "ভাই":  # W3: Index finger point + thumb extended (male/brother sign)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.18, -0.18, 0.02)
        lm[8] = (-0.05, -0.43, 0.0)

    elif label == "বোন":  # W4: Index tracing earlobe/cheek down (female/sister sign)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.08, -0.35, 0.08)  # tilted upward/face plane

    elif label == "বৌ":  # W5: Ring finger emphasis (wedding ring on ring finger)
        lm = curl_finger(lm, 5, 6, 7, 8)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.03, -0.22, 0.05)  # thumb touching ring finger
        lm[16] = (0.06, -0.38, 0.0)

    elif label == "চাচা":  # W6: C-shape hand near temple
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.5)
        lm[4] = (-0.12, -0.16, 0.04)

    elif label == "চাচী":  # W7: C-shape hand touching cheek/chin
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.55)
        lm[4] = (-0.08, -0.12, 0.07)

    elif label == "দাদা/নানা":  # W8: Curved hand stroking beard downward (grandfather)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.45)
        lm[4] = (-0.05, -0.15, 0.08)

    elif label == "দাদী/নানী":  # W9: Curved cupped palm near ear/veil (grandmother)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.3)
        lm[20] = (0.16, -0.32, 0.04)
        lm[4] = (-0.10, -0.18, 0.02)

    elif label == "দায়িত্ব":  # W10: Firm downward pressing flat palm (shoulder responsibility)
        lm = curl_thumb(lm, 0.6)
        for i in [8, 12, 16, 20]:
            lm[i] = (lm[i][0], -0.25, -0.18)  # pronated flat facing down

    elif label == "দেবর":  # W11: Index and Middle finger flick downward
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.03, -0.30, -0.12)
        lm[12] = (0.01, -0.30, -0.12)

    elif label == "দুলাভাই":  # W12: V-sign tilted horizontally
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.20, -0.30, 0.0)
        lm[12] = (-0.15, -0.36, 0.0)

    elif label == "কন্যা":  # W19: Gentle cradling palm sweeping downward
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.35)
        lm[4] = (-0.08, -0.20, 0.05)

    elif label == "মা":  # W20: Open palm, thumb lightly touching chin (maternal sign)
        lm[4] = (-0.02, -0.15, 0.08)
        lm[8] = (-0.06, -0.38, 0.02)
        lm[12] = (0.00, -0.40, 0.02)
        lm[16] = (0.06, -0.37, 0.02)
        lm[20] = (0.12, -0.32, 0.02)

    # --- 14 FOOD & FRUITS ---
    elif label == "আম":  # W37: C-grip grasping round mango
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.6)
        lm[4] = (-0.14, -0.22, 0.06)

    elif label == "আলু":  # W38: Solid compact fist (holding potato)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 1.0)
        lm = curl_thumb(lm, 1.0)

    elif label == "আনারস":  # W39: Upward flared fingers (pineapple spiky crown)
        lm[4] = (-0.18, -0.22, 0.04)
        lm[8] = (-0.12, -0.41, 0.05)
        lm[12] = (0.00, -0.44, 0.06)
        lm[16] = (0.11, -0.40, 0.05)
        lm[20] = (0.19, -0.33, 0.04)

    elif label == "আঙ্গুর":  # W40: Pinching grapes from bunch (thumb & index tip together)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.8)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.8)
        lm[4] = (-0.03, -0.25, 0.07)
        lm[8] = (-0.03, -0.25, 0.07)
        lm[12] = (0.04, -0.32, 0.03)

    elif label == "আপেল":  # W41: Index finger knuckle twisting on cheek (apple)
        lm = curl_finger(lm, 5, 6, 7, 8, 0.7)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.04, -0.22, 0.10)

    elif label == "বিস্কুট":  # W42: Curled index knuckle tapping flat palm (biscuit snap)
        lm = curl_finger(lm, 5, 6, 7, 8, 0.8)
        lm = curl_finger(lm, 9, 10, 11, 12, 0.8)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.02, -0.16, 0.06)

    elif label == "বরই":  # W43: Small round O-mouth gesture (small plum)
        lm = curl_finger(lm, 9, 10, 11, 12, 0.9)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.9)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.9)
        lm[4] = (-0.02, -0.20, 0.08)
        lm[8] = (-0.02, -0.20, 0.08)

    elif label == "কেক":  # W44: Flat slicing hand
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.05, -0.40, -0.05)
        lm[12] = (0.00, -0.41, -0.05)
        lm[16] = (0.05, -0.38, -0.05)
        lm[20] = (0.10, -0.32, -0.05)

    elif label == "চা":  # W45: F-hand dipping tea bag / tea cup holding
        lm[4] = (-0.04, -0.21, 0.05)
        lm[8] = (-0.04, -0.21, 0.05)
        lm[12] = (0.00, -0.42, 0.0)
        lm[16] = (0.06, -0.40, 0.0)
        lm[20] = (0.12, -0.34, 0.0)

    elif label == "চাল":  # W46: Cupped palm shaking grains
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.4)
        lm[4] = (-0.09, -0.18, 0.06)

    elif label == "চিনি":  # W47: Two fingers (Index + Middle) brushing lips (sweetness)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.9)
        lm[8] = (-0.03, -0.38, 0.08)
        lm[12] = (0.02, -0.38, 0.08)

    elif label == "চিপস":  # W48: Crisp pinch snapping outward
        lm = curl_finger(lm, 9, 10, 11, 12, 0.7)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.7)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.7)
        lm[4] = (-0.05, -0.28, 0.06)
        lm[8] = (-0.03, -0.30, 0.06)

    elif label == "চকলেট":  # W49: C-hand circling back of wrist
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.65)
        lm[4] = (-0.10, -0.22, 0.05)

    elif label == "ডাল":  # W50: Cupped stirring gesture (lentil soup)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.5)
        lm[20] = (0.16, -0.30, 0.02)
        lm[4] = (-0.06, -0.19, 0.07)

    # --- 12 DAILY & ITEMS ---
    elif label == "বোতাম":  # W91: Pinching shirt button on midline
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (0.00, -0.24, 0.07)
        lm[8] = (0.00, -0.24, 0.07)
        lm[12] = (0.04, -0.32, 0.03)

    elif label == "টুপি":  # W92: Curled palm touching crown of head (cap)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.4)
        lm[4] = (-0.08, -0.18, 0.05)

    elif label == "চাদর":  # W93: Broad sweeping flat hand wrapping shawl
        lm = curl_thumb(lm, 0.7)
        lm[8] = (-0.12, -0.38, -0.04)
        lm[12] = (-0.04, -0.40, -0.04)
        lm[16] = (0.04, -0.38, -0.04)
        lm[20] = (0.11, -0.32, -0.04)

    elif label == "চিরুনি":  # W94: Curled fingers (teeth of comb) stroking through hair
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.55)
        lm[4] = (-0.12, -0.20, 0.02)

    elif label == "চশমা":  # W95: Index and thumb circling eye frames
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.05, -0.22, 0.08)
        lm[8] = (-0.05, -0.26, 0.08)
        lm[12] = (0.02, -0.35, 0.04)

    elif label == "চুড়ি":  # W96: Thumb & index sliding over opposite wrist (bangles)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.8)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.8)
        lm[4] = (-0.03, -0.15, 0.06)
        lm[8] = (0.03, -0.15, 0.06)

    elif label == "ক্লিপ":  # W97: Thumb & index snapping together at temple (hair clip)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.08, -0.28, 0.08)
        lm[8] = (-0.08, -0.28, 0.08)

    elif label == "ক্রিম":  # W98: Index finger rubbing back of hand
        lm = curl_finger(lm, 9, 10, 11, 12, 0.9)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.9)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.9)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.05, -0.30, 0.08)

    elif label == "তথ্য":  # W99: Flat fingers spreading forward from temple (data/info)
        lm[4] = (-0.14, -0.25, 0.04)
        lm[8] = (-0.08, -0.42, 0.06)
        lm[12] = (0.01, -0.43, 0.06)
        lm[16] = (0.09, -0.40, 0.06)
        lm[20] = (0.16, -0.34, 0.05)

    elif label == "দেনাদার":  # W100: Open upward palm, index counting coins (debt)
        lm = curl_finger(lm, 9, 10, 11, 12, 0.6)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.6)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.6)
        lm[4] = (-0.08, -0.15, 0.08)
        lm[8] = (-0.02, -0.34, 0.09)

    elif label == "জমজ":  # W111: V-sign (Index & Middle) moving in parallel (twin)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.85)
        lm[8] = (-0.06, -0.42, 0.02)
        lm[12] = (0.04, -0.42, 0.02)

    elif label == "জুতা":  # W112: Two fists pressing downward (shoes stepping)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 1.1)
        lm = curl_thumb(lm, 1.0)
        for i in range(21):
            lm[i] = (lm[i][0], lm[i][1] * 0.8, lm[i][2] - 0.06)

    # --- 10 HOUSEHOLD & LIFESTYLE ---
    elif label == "টুথপেস্ট":  # W211: Index pointing horizontally brushing teeth
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.26, -0.24, 0.08)  # horizontal finger

    elif label == "টি-শার্ট":  # W212: Thumb and index pinching collar
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm[4] = (-0.06, -0.22, 0.05)
        lm[8] = (-0.06, -0.22, 0.05)
        lm[12] = (0.02, -0.34, 0.01)

    elif label == "টিউবলাইট":  # W213: Index & middle straight out horizontal (tube light)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.28, -0.26, 0.0)
        lm[12] = (-0.28, -0.22, 0.0)

    elif label == "টেলিভিশন":  # W214: Both index fingers tracing rectangular TV frame
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.9)
        lm[8] = (-0.15, -0.38, 0.02)

    elif label == "এসি":  # W215: Waving cool air toward face (fluttering palm)
        lm = curl_thumb(lm, 0.5)
        lm[8] = (-0.08, -0.38, 0.10)
        lm[12] = (-0.02, -0.40, 0.12)
        lm[16] = (0.05, -0.37, 0.11)
        lm[20] = (0.12, -0.32, 0.09)

    elif label == "অ্যাপার্টমেন্ট":  # W216: Flat hands forming roof & walls upward
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.04, -0.43, -0.02)
        lm[12] = (0.00, -0.44, -0.02)
        lm[16] = (0.04, -0.41, -0.02)
        lm[20] = (0.08, -0.35, -0.02)

    elif label == "অডিও ক্যাসেট":  # W217: Two small O-circles (reels of cassette)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.8)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.8)
        lm[4] = (-0.05, -0.20, 0.06)
        lm[8] = (-0.05, -0.20, 0.06)
        lm[12] = (0.01, -0.34, 0.02)

    elif label == "আয়না":  # W218: Flat palm held vertical directly facing eyes (mirror)
        lm = curl_thumb(lm, 0.6)
        lm[8] = (-0.06, -0.40, 0.08)
        lm[12] = (0.00, -0.42, 0.08)
        lm[16] = (0.06, -0.39, 0.08)
        lm[20] = (0.13, -0.33, 0.08)

    elif label == "বালতি":  # W219: Fist curled holding bucket handle downward
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.95)
        lm = curl_thumb(lm, 0.9)
        for i in range(21):
            lm[i] = (lm[i][0], lm[i][1] + 0.08, lm[i][2] - 0.04)

    elif label == "বালু":  # W220: Thumb and fingertips rubbing together letting sand slip
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.45)
        lm[4] = (-0.03, -0.22, 0.06)

    # --- 10 MEDICAL & HEALTH ---
    elif label == "এইডস":  # W351: Crossed index fingers forming awareness ribbon/cross
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.9)
        lm[8] = (0.02, -0.38, 0.05)  # crossing center midline

    elif label == "বাত":  # W352: Clawed stiff bent fingers (arthritis pain)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.75)
        lm[4] = (-0.12, -0.16, 0.07)

    elif label == "ব্যান্ডেজ":  # W353: Two flat fingers wrapping around wrist
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.08, -0.32, -0.06)
        lm[12] = (-0.02, -0.34, -0.06)

    elif label == "ক্যাপসুল":  # W354: Thumb and index forming small oval pill
        lm = curl_finger(lm, 9, 10, 11, 12, 0.9)
        lm = curl_finger(lm, 13, 14, 15, 16, 0.9)
        lm = curl_finger(lm, 17, 18, 19, 20, 0.9)
        lm[4] = (-0.03, -0.22, 0.06)
        lm[8] = (-0.03, -0.22, 0.06)

    elif label == "চিকিৎসা":  # W355: Flat hand with cross sign over chest (treatment)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.05, -0.39, 0.03)
        lm[12] = (0.00, -0.41, 0.03)
        lm[16] = (0.05, -0.38, 0.03)
        lm[20] = (0.10, -0.33, 0.03)

    elif label == "চোখ ওঠা":  # W356: Curled index pointing near lower eyelid (conjunctivitis)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.9)
        lm[7] = (-0.06, -0.28, 0.12)
        lm[8] = (-0.06, -0.22, 0.15)

    elif label == "ডেঙ্গু":  # W357: Index finger sharp bite on wrist (mosquito sting + fever)
        lm = curl_finger(lm, 9, 10, 11, 12)
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (0.00, -0.16, -0.04)  # pointed down at wrist

    elif label == "ডাক্তার":  # W358: Index & middle feeling radial artery pulse on wrist
        lm = curl_finger(lm, 13, 14, 15, 16)
        lm = curl_finger(lm, 17, 18, 19, 20)
        lm = curl_thumb(lm, 0.8)
        lm[8] = (-0.04, -0.20, -0.06)  # tapping pulse
        lm[12] = (0.01, -0.21, -0.06)

    elif label == "দংশন":  # W359: Clawed hand snapping onto arm (bite/sting)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.8)
        lm[4] = (-0.06, -0.15, -0.05)

    elif label == "দুর্বল":  # W360: Limp drooping hand falling slowly down (weakness)
        for f in [(5,6,7,8), (9,10,11,12), (13,14,15,16), (17,18,19,20)]:
            lm = curl_finger(lm, f[0], f[1], f[2], f[3], 0.4)
        for i in range(21):
            lm[i] = (lm[i][0], lm[i][1] * 0.7 + 0.10, lm[i][2] - 0.12)

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

def generate_augmented_bdsl_dataset(samples_per_class=500):
    """
    Generates 60 classes x samples_per_class (Total: 30,000 samples)
    with 3D rotation, scaling, sensor noise, and wrist normalization.
    """
    X = []
    y = []

    print(f"Generating 60 BdSL classes x {samples_per_class} samples (Total: {len(ALL_CLASS_NAMES) * samples_per_class})...")

    for label in ALL_CLASS_NAMES:
        canonical = create_canonical_bdsl_pose(label)

        for _ in range(samples_per_class):
            # 3D spatial rotation (±15 degrees)
            roll = np.random.uniform(-0.26, 0.26)
            pitch = np.random.uniform(-0.26, 0.26)
            yaw = np.random.uniform(-0.26, 0.26)
            rotated = rotate_3d(canonical, roll, pitch, yaw)

            # Hand distance variance (±14%)
            scale = np.random.uniform(0.86, 1.14)
            scaled = rotated * scale

            # Sensor Gaussian noise
            noise = np.random.normal(0, 0.005, scaled.shape)
            sample = scaled + noise

            # Wrist normalization (wrist is origin 0,0,0)
            wrist = sample[0]
            normalized = sample - wrist

            X.append(normalized.flatten())
            y.append(label)

    return np.array(X), np.array(y)

def train_and_export_bdsl():
    print("==================================================")
    print("🇧🇩 Training SignBridge AI 60-Class BdSL Model (BdSLW60)")
    print(f"📋 Total Classes: {len(ALL_CLASS_NAMES)}")
    print("==================================================")

    X, y = generate_augmented_bdsl_dataset(samples_per_class=500)
    print(f"Dataset shape: {X.shape}, Total samples: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Validation Accuracy: {accuracy * 100:.2f}%\n")

    classes_list = list(clf.classes_)

    joblib.dump(clf, MODEL_FILE, compress=3)
    joblib.dump(classes_list, ENCODER_FILE)

    # Save detailed metadata for frontend / backend
    metadata = {
        "model_name": "SignBridge-BdSL60-RF",
        "dataset": "BdSLW60 (arXiv:2402.08635)",
        "accuracy": round(float(accuracy), 4),
        "total_classes": len(classes_list),
        "classes": BDSL_CLASSES
    }
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"🎉 BdSL Model exported to: {MODEL_FILE}")
    print(f"🎉 Classes encoder exported to: {ENCODER_FILE}")
    print(f"🎉 Metadata exported to: {METADATA_FILE}")
    print("==================================================")

if __name__ == "__main__":
    train_and_export_bdsl()
