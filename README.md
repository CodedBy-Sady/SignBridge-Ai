# SignBridge AI: Connecting People Beyond Language 🤝

**SignBridge AI** is an assistive, real-time two-way communication platform bridging the gap between deaf or non-speaking individuals (who communicate through sign language) and hearing individuals (who do not understand sign language).

---

## 🌟 Key Architecture & Capabilities

### Channel 1: Deaf User → Hearing User (Sign-to-Speech)
1. **Vision Ingestion**: Live webcam input captured via HTML5 `navigator.mediaDevices`.
2. **Hand Landmark Extraction**: Modular bridge ready for MediaPipe 3D hand landmarks (21 joint coordinates per hand).
3. **Sign Gloss Classification**: Buffers and classifies spatial-temporal gestures into discrete ASL glosses (e.g., `["HELP", "DOCTOR"]`).
4. **Google Gemini LLM Reconstitution**: Ingests isolated sign glosses and conversation context, returning grammatically natural, polite English sentences (`"I need a doctor for help."`).
5. **Text-to-Speech (TTS) Synthesis**: Vocalizes the reconstructed sentence aloud to the hearing participant using `window.speechSynthesis`.

### Channel 2: Hearing User → Deaf User (Voice-to-Text)
1. **Real-time Speech Recognition**: Captures audio using the browser's native Web Speech API (`SpeechRecognition`).
2. **Instant Live Captions**: Continuous interim and final transcript streaming.
3. **High-Contrast Typography**: Large, legible visual feedback cards built to WCAG 2.1 AA specifications.
4. **Visual Alert Pulse**: Perimeter optical screen flashes to visually alert the deaf participant when a new turn is received.
5. **Fallback Keyboard Input**: Manual typing option for silent or noisy environments.

---

## 📁 Project Directory Structure

```
SignBridge ai/
├── server/
│   ├── config/
│   │   └── db.js                 # MySQL2 connection pool with in-memory test fallback
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Google OAuth, Profile
│   │   ├── sessionController.js  # Create session, list, get history, post turns, end
│   │   └── aiController.js       # Gemini sentence reconstruction & landmark bridge
│   ├── database/
│   │   └── schema.sql            # MySQL schema with users, sessions, messages tables
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT bearer authentication validator
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   ├── userModel.js          # User queries (MySQL / fallback)
│   │   ├── sessionModel.js       # Session queries & message counts
│   │   └── messageModel.js       # Chronological conversation turn queries
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── sessionRoutes.js      # /api/sessions routes
│   │   └── aiRoutes.js           # /api/ai routes
│   ├── services/
│   │   └── geminiService.js      # Google Gemini 1.5/2.0 API & linguistic fallback
│   ├── .env.example              # Server environment template
│   ├── .env                      # Server configuration
│   ├── package.json              # Server dependencies & scripts
│   └── server.js                 # Express server bootstrap & health check
│
├── client/
│   ├── public/
│   │   └── vite.svg              # Brand icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Brand, navigation, accessibility toggles
│   │   │   ├── Footer.jsx               # WCAG 2.1 AA notice & system health
│   │   │   ├── AuthModal.jsx            # Sign In / Sign Up / Google Auth / Quick Demo
│   │   │   ├── DeafSignPanel.jsx        # Camera viewport, 3D landmarks, gloss tokens
│   │   │   ├── HearingVoicePanel.jsx    # Pulsing microphone, live STT, large captions
│   │   │   ├── DialogueStream.jsx       # Unified interleaved transcript with TTS
│   │   │   └── SessionSummaryModal.jsx  # Metrics & export (.txt / .json)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Auth state, JWT persistence, demo sign-in
│   │   │   └── AccessibilityContext.jsx # Contrast mode, font size, visual alert flash
│   │   ├── hooks/
│   │   │   ├── useSpeechToText.js       # Web Speech Recognition API wrapper
│   │   │   ├── useTextToSpeech.js       # SpeechSynthesis API wrapper
│   │   │   └── useWebcam.js             # MediaDevices stream & simulation mode
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Hero, workflow architecture, CTA
│   │   │   ├── CommunicatePage.jsx      # Dual-panel two-way live dashboard
│   │   │   ├── SessionHistoryPage.jsx   # Master-detail archive & transcript view
│   │   │   └── NotFoundPage.jsx         # 404 handler
│   │   ├── services/
│   │   │   ├── api.js                   # Axios client with JWT interceptor
│   │   │   └── aiService.js             # Landmark temporal buffer & Gemini bridge
│   │   ├── App.jsx                      # Router & layout provider
│   │   ├── main.jsx                     # Entry mount
│   │   └── index.css                    # Tailwind CSS & high-contrast rules
│   ├── index.html                       # HTML5 entry with Inter font
│   ├── vite.config.js                   # Vite dev server with /api proxy
│   ├── tailwind.config.js               # Accessibility palettes & keyframes
│   ├── postcss.config.js                # PostCSS configuration
│   ├── .env.example                     # Client environment template
│   ├── .env                             # Client environment config
│   └── package.json                     # Client dependencies
│
├── package.json                         # Root package manager & concurrently runner
└── README.md                            # Comprehensive system documentation
```

---

## 🗄️ Database Setup (MySQL 8.0+)

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal CLI).
2. Execute the schema script:
   ```bash
   mysql -u root -p < server/database/schema.sql
   ```
3. The script creates:
   - Database `signbridge_db`
   - `users` table (UUID, email, password_hash, google_id, role)
   - `sessions` table (UUID, user_id, title, status, metadata)
   - `messages` table (UUID, session_id, sender_role, input_type, raw_content, final_content, confidence_score, timestamp)
   - Pre-seeded demo accounts:
     - Deaf User: `alex.deaf@signbridge.ai` (Password: `Password123!`)
     - Hearing User: `sarah.hearing@signbridge.ai` (Password: `Password123!`)

> **Note**: If your local MySQL is not running during initial development, `server/config/db.js` automatically starts in a zero-configuration In-Memory Mock Mode with identical schema queries, so you can develop and test immediately without any errors.

---

## ⚙️ Environment Variables

### Server (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

JWT_SECRET=signbridge_super_secret_jwt_key_2026

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=signbridge_db

# Google OAuth 2.0 (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini API Key (For sentence reconstruction)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Client (`client/.env`):
```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=
```

---

## 🚀 Installation & Running

### Option 1: Root Concurrently (Recommended)
```bash
# Install all dependencies
npm run install:all

# Run both Server (port 5000) and Client (port 3000) concurrently
npm run dev
```

### Option 2: Separate Terminals
```bash
# Terminal 1 - Backend Server
cd server
npm install
npm run dev

# Terminal 2 - Frontend Client
cd client
npm install
npm run dev
```

Navigate to:
- **Frontend App**: `http://localhost:3000`
- **Backend Health Check**: `http://localhost:5000/api/health`

