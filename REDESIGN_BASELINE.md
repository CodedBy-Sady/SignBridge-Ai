# SignBridge AI: Homepage Redesign Baseline (Behaviour Inventory)

**Date:** 2026-11-18  
**Branch:** `redesign/homepage-ui`  
**Purpose:** Comprehensive baseline documentation of all existing functionality, interactive elements, routes, handlers, auth behaviors, and state bindings before any UI/presentation redesign.

---

## 1. Routes and Pages

| Path | Component | Props Received | Protected / Auth Behavior |
|---|---|---|---|
| `/` | `LandingPage` | `onOpenAuth: (mode) => void` | Public. Displays presentation, hero, interactive demo, and auth triggers. |
| `/login` | `AuthPage` | `initialMode="login"` | Public. Direct login route with JWT and Google OAuth. |
| `/register` | `AuthPage` | `initialMode="register"` | Public. Registration route. |
| `/communicate` | `CommunicatePage` | `onOpenAuth: (mode) => void` | Protected. If not authenticated, displays prompt/modal to sign in. Handles real-time MediaPipe, camera, STT, TTS, Gemini. |
| `/history` | `SessionHistoryPage` | `onOpenAuth: (mode) => void` | Protected. Shows user session transcripts and allow deleting sessions. |
| `*` | `NotFoundPage` | None | 404 fallback page. |

---

## 2. Global Navbar (`Navbar.jsx`)

### 2.1 Brand Logo
- **Element:** `<Link to="/" aria-label="SignBridge AI Homepage">`
- **Current Visual:** Gradient icon tile with emoji `🤝`, Wordmark `SignBridge AI`, subtitle `Two-Way Assistive Voice`.

### 2.2 Navigation Links
- `<Link to="/">`: "How It Works" (Active when `location.pathname === '/'`).
- **When Authenticated (`isAuthenticated === true`):**
  - `<Link to="/communicate">`: "Live Communicate"
  - `<Link to="/history">`: "Session History"
- **When Logged Out (`isAuthenticated === false`):**
  - `<button onClick={() => onOpenAuth('login')}>`: "Live Demo & Dashboard"

### 2.3 Accessibility Quick Bar
All controls are connected to `AccessibilityContext` (`useAccessibility` hook):
1. **Font Size Cycle Button:**
   - **Handler:** `onClick={cycleFontSize}`
   - **Cycle order:** `'normal'` (1x) $\rightarrow$ `'large'` (1.2x) $\rightarrow$ `'xlarge'` (1.4x) $\rightarrow$ `'normal'`
   - **DOM effect:** Adds `.text-scale-large` or `.text-scale-xlarge` class to `document.documentElement`.
   - **Storage key:** `localStorage.setItem('signbridge_font_size', fontSize)`
2. **High Contrast / Theme Toggle:**
   - **Handler:** `onClick={toggleHighContrast}`
   - **DOM effect:** Toggles `.theme-high-contrast` and `.dark` classes on `document.documentElement`.
   - **Storage key:** `localStorage.setItem('signbridge_high_contrast', String(highContrast))`
3. **Audio Feedback Toggle:**
   - **Handler:** `onClick={toggleSound}`
   - **State:** Toggles `soundEffects` boolean (controls acoustic cues on incoming messages).
   - **Storage key:** `localStorage.setItem('signbridge_sound', String(soundEffects))`

### 2.4 User Actions / Auth State
Connected to `AuthContext` (`useAuth` hook):
- **When Authenticated (`isAuthenticated === true`):**
  - **Role Badge Chip:** `<button onClick={handleRoleToggle}>`
    - Toggles between `'deaf_user'` ("Deaf User" with purple styling) and `'hearing_user'` ("Hearing User" with emerald styling) via `updateUserRole(nextRole)`.
  - **Avatar:** Displays `user.avatar_url` or initial letter badge.
  - **Logout Button:** `<button onClick={logout} aria-label="Sign out">`, calls `logout()`.
- **When Logged Out (`isAuthenticated === false`):**
  - **Sign In Button:** `<button onClick={() => onOpenAuth('login')}>` $\rightarrow$ opens modal in login mode.
  - **Get Started Button:** `<button onClick={() => onOpenAuth('register')}>` $\rightarrow$ opens modal in register mode.
- **Mobile Menu (Hamburger):**
  - Toggle button: `onClick={() => setMobileMenuOpen(!mobileMenuOpen)}`
  - Drawer reproduces navigation links, auth actions, and logout with identical handlers.

---

## 3. Homepage (`LandingPage.jsx`)

### 3.1 Hero Section
- **Badge:** "🤝 Bridging Deaf & Hearing Worlds"
- **Heading:** "Talk to Anyone. Even Without Knowing Sign Language."
- **Primary CTA Button:**
  - **Handler:** `onClick={handleStartLive}`
  - **Logic:** If `isAuthenticated === true`, executes `navigate('/communicate')`. If `false`, calls `onOpenAuth('login')`.
  - **Label:** `{isAuthenticated ? 'Open Live Conversation' : 'Start Conversation (Sign In)'}`
- **Secondary CTA Button (Logged Out only):**
  - **Handler:** `onClick={() => onOpenAuth('register')}`
  - **Label:** "Create Free Account"

### 3.2 Interactive Demo Simulator
Operates completely client-side without camera, backend, or login requirements:
- **Tab Switcher:**
  - Tab 1: `activeTab === 'deaf_to_hearing'` ("1. Deaf Person Signs → Speaks Aloud")
  - Tab 2: `activeTab === 'hearing_to_deaf'` ("2. Hearing Person Speaks → Big Clear Text")
- **Tab 1 Exact Data & Behavior:**
  - State: `selectedDeafSign` (initialized to Greeting).
  - Sample Tiles:
    1. Greeting: `title: 'Greeting'`, `tokens: ['HELLO', 'MEET', 'NICE']`, `voice: 'Hello! It is very nice to meet you.'`, `emoji: '👋'`
    2. Medical Help: `title: 'Medical Help'`, `tokens: ['HELP', 'DOCTOR']`, `voice: 'Please help, I need to see a doctor.'`, `emoji: '🩺'`
    3. Restroom Inquiry: `title: 'Restroom Inquiry'`, `tokens: ['WHERE', 'RESTROOM']`, `voice: 'Could you please tell me where the nearest restroom is?'`, `emoji: '🚻'`
    4. Thank You: `title: 'Thank You'`, `tokens: ['THANK YOU', 'VERY MUCH']`, `voice: 'Thank you so much for your assistance!'`, `emoji: '🙏'`
  - Tile click handler: `onClick={() => handleTestDeafVoice(item)}` $\rightarrow$ updates `selectedDeafSign` and calls `speak(item.voice)` from `useTextToSpeech`.
  - Play button handler: `onClick={() => speak(selectedDeafSign.voice)}` $\rightarrow$ calls `useTextToSpeech().speak()`. Shows speaking status `isSpeaking`.
- **Tab 2 Exact Data & Behavior:**
  - State: `hearingSpeechInput` (initialized to phrase 1) and `simulatedVoiceActive`.
  - Sample Phrases:
    1. `'Hello! I can understand you clearly. How can I help you today?'`
    2. `'The doctor is available on the second floor, room 204.'`
    3. `'Yes, the restroom is straight down this hallway on your left.'`
    4. `'You are very welcome! Have a wonderful day.'`
  - Phrase click handler: `onClick={() => handleSimulateHearingSpeech(phrase)}` $\rightarrow$ sets input and temporarily activates `simulatedVoiceActive` (pulse animation).
  - High-contrast reader panel displays `hearingSpeechInput`.

### 3.3 Bottom Action Notice
- Buttons calling `onOpenAuth('login')` and `onOpenAuth('register')`.

---

## 4. Shared Footer (`Footer.jsx`)

- **Brand Description:** Assistive two-way communication platform description.
- **Badges:** WCAG 2.1 AA Compliant, High Contrast Ready, Powered by Gemini LLM.
- **Core Modalities:** Static text list (no dynamic state or APIs).
- **System Health:** Static HTML text (Web Speech STT: Active, Web Speech TTS: Ready, Gemini API Bridge: Online). **Confirmed: purely static markup with no live network/socket checks.**
- **Copyright & Community Notice:** Year & attribution.

---

## 5. Verification Baseline
- **Build Status:** `vite build` completed in 1.48s with **0 errors**.
- **Automated Tests:** No existing test runner defined in `package.json`.
- **Dependencies:** 0 new dependencies needed.
