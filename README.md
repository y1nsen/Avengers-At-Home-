# Avengers Assemble: AR Card Battler 🦸‍♂️⚡

An augmented reality 1v1 tabletop card battler built for the web using **Three.js**, **MindAR.js**, and **Socket.io**. Point your phone's camera at physical Marvel hero cards to summon 3D animated superheroes, trigger cinematic VFX, and wage tactical turn-based combat.

---

## 🌟 Key Features

- **Multi-Card AR Tracking with ArUco Markers**:
  - Optical feature tracking powered by MindAR (WebAssembly / TensorFlow.js).
  - High-contrast ArUco markers ensure instant target acquisition and edge stability.
- **Card-Specific Hero Spawning**:
  - Each character strictly spawns on their designated card (Spider-Man on Spider-Man's card, Thor on Thor's card). Non-matching cards are ignored until a Tactical Swap occurs.
- **Stationary Pose Smoothing (One-Euro Filter)**:
  - Custom-tuned cutoff frequency (`filterMinCF: 0.0005`) and velocity coefficient (`filterBeta: 0.05`) completely eliminate micro-jitter and vibration on static cards.
- **Tracking State Persistence (SLAM Gyroscope Fallback)**:
  - When the camera loses direct line-of-sight to the card (hand occlusion, camera tilt, quick motion), the internal gyroscope holds the 3D model fixed in physical space for a 2.5-second grace period.
  - Smooth slerp/lerp re-anchoring eliminates visual popping when line-of-sight is re-established.
- **Mobile-First Landscape UI**:
  - Pixel-faithful interface with fluid `dvh`/`vw` scaling optimized for 20:9 displays (e.g. Nothing Phone 2a).
  - Two-stage card scanning flow with live camera preview and neon green `#44FF00` detection lock.
  - Fullscreen toggle with cross-browser vendor prefix support.
- **Real-Time Multiplayer & AI Mode**:
  - Play against AI or challenge a friend in 1v1 multiplayer with turn synchronization and tactical intercepts.

---

## 🛠️ Technology Stack

- **Frontend & 3D Engine**: [Three.js](https://threejs.org/) (WebGL), [Vite](https://vitejs.dev/)
- **Augmented Reality**: [MindAR.js](https://hiukim.github.io/mind-ar-js-doc/) (WebAssembly / TensorFlow.js)
- **Networking**: [Socket.io](https://socket.io/) (1v1 room management & action relay)
- **3D Assets**: glTF / GLB animated character models with skeletal animations and VFX shaders

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A smartphone with a modern browser (Google Chrome recommended) connected to the same Wi-Fi network

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/y1nsen/Avengers-At-Home-.git
   cd Avengers-At-Home-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Compile MindAR targets if you modify card artwork:
   ```bash
   npm run compile:mind
   ```

---

## 🎮 Running the Application

### 1. Start the HTTPS Dev Server (Required for Camera & Gyroscope access on mobile)
```bash
npm run dev:https
```

### 2. Start the Multiplayer Socket Server
In a separate terminal window:
```bash
npm run server
```

### 3. Open on Mobile
- Open Chrome on your mobile phone and navigate to:
  ```
  https://<YOUR-COMPUTER-IP>:3000
  ```
- Accept the local SSL certificate and grant Camera and Motion/Orientation permissions.
- Rotate your device into **Landscape Mode**.
- Tap **Play**, pick your squad of 3 heroes, point your camera at the active hero's card, and assemble!

---

## 📁 Project Structure

```
├── public/
│   ├── assets/
│   │   ├── characters/        # 3D GLB models (Spider-Man, Thor, etc.)
│   │   ├── hdri/              # Environment lighting
│   │   └── ui/                # Hero profile icons and badges
│   └── cards/
│       ├── images/            # Physical card artwork with ArUco markers
│       └── targets/           # Compiled targets.mind and targets_map.json
├── server/
│   ├── RoomManager.js         # Authoritative room & match manager
│   └── server.js              # Express + Socket.io server entry point
├── src/
│   ├── ar/
│   │   ├── MindARManager.js   # MindAR WebAssembly engine wrapper
│   │   ├── TrackingPersistenceManager.js # Gyroscope SLAM fallback engine
│   │   └── ARSimulator.js     # Desktop browser simulator
│   ├── combat/
│   │   ├── CombatEngine.js    # Turn logic, HP, damage calculations
│   │   ├── HeroData.js        # Stats, abilities, and multipliers
│   │   └── AIBrain.js         # Single-player opponent logic
│   ├── network/
│   │   └── NetworkManager.js  # Client-side Socket.io relay
│   ├── renderer/
│   │   ├── CharacterController.js # Model loading, animations, scaling
│   │   ├── ThreeScene.js      # Lighting, shadows, scene graph
│   │   └── VFXManager.js      # Particle effects and attack bursts
│   ├── ui/
│   │   └── UIManager.js       # Screen transitions, scanning UI, HUD
│   ├── main.js                # Game application coordinator
│   └── style.css              # Design system & responsive styles
├── compile_cards.js           # Headless target compiler
├── index.html                 # Main web application entry point
├── package.json
└── vite.config.js
```

---

## 💡 Assets & Build Architecture (`public/` vs `dist/`)

- **`public/` (Source Assets)**:
  The authoritative source folder for all static assets (3D GLB models, card artwork with ArUco markers, compiled `targets.mind`, and UI icons). Always add or modify your game assets here.
- **`dist/` (Build Output)**:
  Generated automatically when running `npm run build`. Vite bundles the code in `src/` and copies all files from `public/` into `dist/` for production deployment. `dist/` is an ephemeral build artifact, ignored by Git, and can be safely cleaned anytime via:
  ```bash
  npm run clean
  ```

