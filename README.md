# TerraPulse AI / உழவன் AI - Smart Farming Assistant 🌾🗼

> **An AI-powered Precision Agriculture & IoT Telemetry Platform with Real-Time Smart Tower Monitoring & Bilingual AI Voice Call Assistant.**

---

## 🌟 Key Features

### 1. 🗼 Smart Mast / Tower Telemetry (IoT Hardware)
- **Central IoT Hub**: Real-time sensor signal processing hub in the field.
- **5 High-Precision Sensors**:
  - 🌡️ **Ambient Temperature** (°C)
  - 💧 **Relative Air Humidity** (%)
  - 🌱 **Soil Moisture Content** (% Volumetric)
  - 🧪 **Soil pH Balance** (Acidity/Alkalinity)
  - ☀️ **Sunlight Intensity** (Lux)
- **Interactive Circuit Visualization**: Dual visualization with Schematic Engineering View & 3D Field Mast View, connected via live animated signal lines and pulses.
- **Telemetry Diagnostic Center**: Real-time signal oscilloscope, sensor calibration table, and live JSON packet inspector.

### 2. 📞 AI Voice Calling (Tamil & English)
- **Direct Voice Call Mode**: Dial the AI agricultural advisor directly through your browser or mobile phone.
- **Bilingual Speech Engine**: Automatic speech-to-text and natural speech synthesis in both Tamil (தமிழ்) and Indian English.
- **Live Visuals**: Web Audio API dial tones, live animated audio waveform equalizer, and rolling live transcript.

### 3. 🧠 Smart Advisory & Disease Detection
- Multi-crop suitability analysis, fertilizer recommendations, pest/disease prevention strategies, and real-time weather alerts.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Modern Web Browser (Chrome, Edge, Safari, Firefox)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hemanth2607-cyber/venkatproject.git
   cd venkatproject
   ```

2. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Run the server:**
   ```bash
   python backend/run.py
   ```

4. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 📁 Project Structure

```
venkatproject/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers and endpoints
│   │   ├── core/         # Configuration and system settings
│   │   ├── models/       # Pydantic schemas and models
│   │   └── services/     # AI advisory & telemetry simulation services
│   ├── requirements.txt  # Python package dependencies
│   ├── run.py            # Unified server runner (serves API & Frontend)
│   └── test_api.py       # API test suite
├── frontend/
│   ├── assets/           # Tower schematics, 3D mast images, icons
│   ├── css/
│   │   └── styles.css    # Clean, responsive vanilla CSS styling
│   ├── js/
│   │   ├── app.js        # Core frontend application logic
│   │   ├── translations.js # Tamil & English localization dictionary
│   │   └── voice.js      # AI Voice Calling & Audio Equalizer engine
│   └── index.html        # Main single-page application dashboard
└── README.md
```

---

## 🌐 Tech Stack

- **Backend**: FastAPI (Python), Uvicorn, Pydantic, HTTPX
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), Web Audio API, Web Speech API
- **Deployment**: Self-contained single-origin FastAPI application
