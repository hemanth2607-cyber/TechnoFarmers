// AgroSmart / Ulavan Connect AI - Main Application Controller

let currentSiteLanguage = localStorage.getItem('agro_site_lang') || 'ta';
let localMediaStream = null;
let staticNoiseAnimationId = null;
let searchDebounceTimer = null;

// Comprehensive Tamil Nadu District & Hubs Translation Mapping
const TN_PLACE_TRANSLATIONS = {
  "karur": "கரூர்",
  "coimbatore": "கோயம்புத்தூர்",
  "madurai": "மதுரை",
  "salem": "சேலம்",
  "erode": "ஈரோடு",
  "thanjavur": "தஞ்சாவூர்",
  "tiruchirappalli": "திருச்சிராப்பள்ளி",
  "trichy": "திருச்சிராப்பள்ளி",
  "tirupur": "திருப்பூர்",
  "tiruppur": "திருப்பூர்",
  "dindigul": "திண்டுக்கல்",
  "theni": "தேனி",
  "namakkal": "நாமக்கல்",
  "dharmapuri": "தருமபுரி",
  "krishnagiri": "கிருஷ்ணகிரி",
  "tirunelveli": "திருநெல்வேலி",
  "thoothukudi": "தூத்துக்குடி",
  "tuticorin": "தூத்துக்குடி",
  "kanyakumari": "கன்னியாகுமரி",
  "nagercoil": "நாகர்கோவில்",
  "vellore": "வேலூர்",
  "ranipet": "ராணிப்பேட்டை",
  "tirupathur": "திருப்பத்தூர்",
  "tiruvannamalai": "திருவண்ணாமலை",
  "villupuram": "விழுப்புரம்",
  "kallakurichi": "கள்ளக்குறிச்சி",
  "cuddalore": "கடலூர்",
  "nagapattinam": "நாகப்பட்டினம்",
  "tiruvarur": "திருவாரூர்",
  "mayiladuthurai": "மயிலாடுதுறை",
  "pudukkottai": "புதுக்கோட்டை",
  "sivaganga": "சிவகங்கை",
  "ramanathapuram": "இராமநாதபுரம்",
  "virudhunagar": "விருதுநகர்",
  "tenkasi": "தென்காசி",
  "nilgiris": "நீலகிரி",
  "ooty": "ஊட்டி",
  "chennai": "சென்னை",
  "kanchipuram": "காஞ்சிபுரம்",
  "chengalpattu": "செங்கல்பட்டு",
  "tiruvallur": "திருவள்ளூர்",
  "ariyalur": "அரியலூர்",
  "perambalur": "பெரம்பலூர்"
};

function getTamilPlaceName(name) {
  if (!name) return "";
  const clean = name.trim().toLowerCase();
  if (TN_PLACE_TRANSLATIONS[clean]) return TN_PLACE_TRANSLATIONS[clean];
  if (/[\u0B80-\u0BFF]/.test(name)) return name;
  for (const [en, ta] of Object.entries(TN_PLACE_TRANSLATIONS)) {
    if (clean.includes(en)) return ta;
  }
  return name;
}

function getEnglishPlaceName(name) {
  if (!name) return "";
  const clean = name.trim();
  for (const [en, ta] of Object.entries(TN_PLACE_TRANSLATIONS)) {
    if (ta === clean || clean.toLowerCase() === en) {
      return en.charAt(0).toUpperCase() + en.slice(1);
    }
  }
  return name;
}

// Default Selected Agricultural Location
let currentPlace = {
  name: "Coimbatore",
  lat: 11.0055,
  lon: 76.9661,
  name_ta: "கோயம்புத்தூர்"
};

try {
  const savedPlace = localStorage.getItem('agro_selected_place');
  if (savedPlace) {
    currentPlace = JSON.parse(savedPlace);
    currentPlace.name = getEnglishPlaceName(currentPlace.name);
    currentPlace.name_ta = getTamilPlaceName(currentPlace.name_ta || currentPlace.name);
  }
} catch (e) {}

let currentWeatherContext = {
  weather_condition: "Sunny & Clear",
  air_temperature: 28,
  humidity: 65,
  rain_probability: "10%"
};

// Global accessor for Voice and AI modules
window.getCurrentPlaceContext = function() {
  const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
  const en = getEnglishPlaceName(currentPlace.name);
  const ta = getTamilPlaceName(currentPlace.name_ta || currentPlace.name);
  return {
    location: isTa ? ta : en,
    weather_condition: currentWeatherContext.weather_condition,
    air_temperature: currentWeatherContext.air_temperature,
    humidity: currentWeatherContext.humidity,
    rain_probability: currentWeatherContext.rain_probability
  };
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  lucide.createIcons();
  startClock();
  initData();
  setupWebSocket();
  initTvStatic();
  initSmartTower();
  applyLanguage(currentSiteLanguage);
  updatePlaceUI(currentPlace);
  loadPlaceWeather(currentPlace.name, currentPlace.lat, currentPlace.lon);
});

// ==========================================
// Theme Management (Dark / Light Theme)
// ==========================================
function initTheme() {
  const saved = localStorage.getItem('agro_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('agro_theme', theme);
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.innerText = theme === 'dark' ? 'light_mode' : 'dark_mode';
    icon.className = theme === 'dark' 
      ? 'material-symbols-outlined text-[19px] text-amber-300' 
      : 'material-symbols-outlined text-[19px] text-stone-700';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
  if (typeof showToast === 'function') {
    showToast(newTheme === 'dark' 
      ? (isTa ? 'இரவுப் பயன்முறை (Dark Theme) இயக்கப்பட்டது' : 'Dark Theme Enabled') 
      : (isTa ? 'பகல் பயன்முறை (Light Theme) இயக்கப்பட்டது' : 'Light Theme Enabled')
    );
  }
}
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;

// ==========================================
// 1. Full Website Language Switching
// ==========================================
function changeSiteLanguage(lang) {
  currentSiteLanguage = lang;
  window.currentSiteLanguage = lang;
  localStorage.setItem('agro_site_lang', lang);
  applyLanguage(lang);
}

function toggleLanguageGlobal() {
  const current = currentSiteLanguage || 'ta';
  const nextLang = (current === 'ta' || current === 'tamil') ? 'en' : 'ta';
  changeSiteLanguage(nextLang);
  if (typeof showToast === 'function') {
    showToast(nextLang === 'ta' ? 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது (Tamil View)' : 'Switched to English View');
  }
}
window.toggleLanguageGlobal = toggleLanguageGlobal;

function applyLanguage(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['ta'];

  // Update text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerText = dict[key];
    }
  });

  // Update placeholder nodes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Update language switcher pill buttons
  const taEl = document.getElementById('langTA');
  const enEl = document.getElementById('langEN');
  if (lang === 'ta') {
    if (taEl) taEl.className = 'text-primary font-bold';
    if (enEl) enEl.className = 'text-on-surface-variant font-medium';
  } else {
    if (enEl) enEl.className = 'text-primary font-bold';
    if (taEl) taEl.className = 'text-on-surface-variant font-medium';
  }

  // Toggle AI recommendation language box (hide Tamil box in English mode)
  const adviceEn = document.getElementById('ai-advisor-advice-en');
  const adviceTa = document.getElementById('ai-advisor-advice-ta');
  if (adviceEn && adviceTa) {
    if (lang === 'en') {
      adviceEn.classList.remove('hidden');
      adviceTa.classList.add('hidden');
    } else {
      adviceEn.classList.add('hidden');
      adviceTa.classList.remove('hidden');
    }
  }

  // Live update weather condition description if already cached
  const weatherCondEl = document.getElementById('weather-cond-display');
  if (weatherCondEl && window.currentWeatherRaw) {
    weatherCondEl.innerText = lang === 'en' ? window.currentWeatherRaw.condition_en : window.currentWeatherRaw.condition_ta;
  }

  // Live update initial AI greeting if present
  const initialGreeting = document.getElementById('initial-ai-greeting');
  if (initialGreeting) {
    initialGreeting.innerText = dict['ai.greeting'] || initialGreeting.innerText;
  }

  // Live update scanner upload hint
  const uploadHint = document.getElementById('click-to-upload-hint');
  if (uploadHint) {
    uploadHint.innerText = lang === 'en' ? 'Upload / Drop Photo' : 'படம் மாற்ற அழுத்தவும்';
  }
  const scannerSub = document.getElementById('scanner-subtitle');
  if (scannerSub) {
    scannerSub.innerText = lang === 'en' ? 'Crop Health & Leaf Vision Diagnostics' : 'பயிர் நோய் பகுப்பாய்வு & பட ஆய்வு';
  }

  // Sync voice engine
  if (typeof setLanguage === 'function') {
    setLanguage(lang);
  }

  document.documentElement.lang = lang;
  updatePlaceUI(currentPlace);
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// ==========================================
// 2. Tab Navigation
// ==========================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');

  const tabs = ['dashboard', 'controls', 'marketplace'];
  tabs.forEach(t => {
    const btn = document.getElementById(`nav-${t}`);
    if (t === tabName) {
      btn.className = "nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all bg-farm-800 text-white shadow-farm";
    } else {
      btn.className = "nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all text-stone-600 hover:bg-stone-100";
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Live Clock
function startClock() {
  const clockEl = document.getElementById('live-clock');
  const cctvTimeEl = document.getElementById('cctv-timestamp');
  setInterval(() => {
    const now = new Date();
    if (clockEl) clockEl.innerText = now.toLocaleTimeString();
    if (cctvTimeEl) cctvTimeEl.innerText = `LIVE ${now.toISOString().replace('T', ' ').substring(0, 19)}`;
  }, 1000);
}

// Initial Data Loading
async function initData() {
  const telemetry = await AgroAPI.getLatestTelemetry();
  updateTelemetryUI(telemetry);
}

function setupWebSocket() {
  AgroAPI.initWebSocket((data) => {
    updateTelemetryUI(data);
  });
}

function updateTelemetryUI(data) {
  if (!data) return;
  if (data.soil_moisture !== undefined) {
    const el = document.getElementById('sensor-moisture');
    if (el) el.innerText = Math.round(data.soil_moisture);
    const hEl = document.getElementById('header-moisture');
    if (hEl) hEl.innerText = `${Math.round(data.soil_moisture)}%`;
    const tMoist = document.getElementById('tower-moisture');
    if (tMoist) tMoist.innerText = Math.round(data.soil_moisture);
  }
  if (data.soil_temperature !== undefined) {
    const el = document.getElementById('sensor-temp');
    if (el) el.innerText = Math.round(data.soil_temperature);
    const tTemp = document.getElementById('tower-temp');
    if (tTemp) tTemp.innerText = (data.soil_temperature + 5.4).toFixed(1);
  }
  if (data.soil_ph !== undefined) {
    const el = document.getElementById('sensor-ph');
    if (el) el.innerText = data.soil_ph.toFixed(1);
    const tPh = document.getElementById('tower-ph');
    if (tPh) tPh.innerText = data.soil_ph.toFixed(1);
  }
  if (data.water_tank_level !== undefined) {
    const el = document.getElementById('sensor-tank');
    if (el) el.innerText = Math.round(data.water_tank_level);
  }
  if (typeof triggerTowerSignalPulse === 'function') {
    triggerTowerSignalPulse();
  }
}

// ==========================================
// 3. Location Selector & Real Place Weather
// ==========================================
function openLocationModal() {
  const modal = document.getElementById('location-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeLocationModal() {
  const modal = document.getElementById('location-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function updatePlaceUI(place) {
  if (!place) return;
  const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
  const enName = getEnglishPlaceName(place.name || "Coimbatore");
  const taName = getTamilPlaceName(place.name_ta || place.name || "கோயம்புத்தூர்");
  const displayName = isTa ? taName : enName;

  const heroPlaceEl = document.getElementById('hero-selected-place');
  if (heroPlaceEl) {
    heroPlaceEl.innerText = displayName;
  }
  const sectorTitle = document.getElementById('dashboard-sector-title');
  if (sectorTitle) {
    sectorTitle.innerText = isTa
      ? `${displayName} ஸ்மார்ட் பண்ணை பிரிவு 4B`
      : `${displayName} Smart Farm Sector 4B`;
  }
  const sectorSub = document.getElementById('dashboard-sector-subtitle');
  if (sectorSub) {
    sectorSub.innerText = isTa
      ? `${displayName} பண்ணை பிரிவு 4B • நேரலை சென்சார்கள் இயங்குகின்றன`
      : `${displayName} Field Sector 4B • Live Telemetry Active`;
  }
}

async function selectPlace(name, lat, lon, name_ta = "") {
  const enName = getEnglishPlaceName(name);
  const taName = name_ta ? getTamilPlaceName(name_ta) : getTamilPlaceName(name);
  currentPlace = { name: enName, lat, lon, name_ta: taName };
  localStorage.setItem('agro_selected_place', JSON.stringify(currentPlace));
  updatePlaceUI(currentPlace);
  closeLocationModal();

  // Load real meteorological data for this place
  await loadPlaceWeather(enName, lat, lon);
}

async function loadPlaceWeather(name, lat, lon) {
  const weatherData = await AgroAPI.getLivePlaceWeather(name, lat, lon);
  if (!weatherData) return;

  const current = weatherData.current;
  const forecast = weatherData.forecast;

  // Cache raw weather for immediate client language toggle
  window.currentWeatherRaw = current;
  window.currentForecastRaw = forecast;

  // Save in global state for AI prompts
  currentWeatherContext = {
    weather_condition: currentSiteLanguage === 'en' ? current.condition_en : current.condition_ta,
    air_temperature: current.temperature,
    humidity: current.humidity,
    rain_probability: forecast?.tomorrow?.rain_prob ? `${forecast.tomorrow.rain_prob}%` : "30%"
  };

  // Update Hero Temperature Pill & Stitch Weather Bar
  const heroTempEl = document.getElementById('hero-live-temp');
  if (heroTempEl) {
    heroTempEl.innerText = `${Math.round(current.temperature)}°C`;
  }
  const weatherTempEl = document.getElementById('weather-temp-display');
  if (weatherTempEl) weatherTempEl.innerText = `${Math.round(current.temperature)}°C`;
  const weatherCondEl = document.getElementById('weather-cond-display');
  if (weatherCondEl) weatherCondEl.innerText = currentSiteLanguage === 'en' ? current.condition_en : current.condition_ta;
  const weatherWindEl = document.getElementById('weather-wind-display');
  if (weatherWindEl && current.wind_speed !== undefined) weatherWindEl.innerText = Math.round(current.wind_speed);

  // Update Sensor Cards on Dashboard
  // 1. Weather Card
  const weatherCard = document.querySelector('[data-i18n="sensor.weather.title"]')?.closest('.sensor-card');
  if (weatherCard) {
    const tempVal = weatherCard.querySelector('.text-3xl');
    if (tempVal) tempVal.innerText = Math.round(current.temperature);
    
    const condDesc = weatherCard.querySelector('[data-i18n="sensor.weather.change"]');
    if (condDesc) {
      condDesc.innerText = `${current.icon} ${currentSiteLanguage === 'en' ? current.condition_en : current.condition_ta}`;
    }

    const rainDesc = weatherCard.querySelector('[data-i18n="sensor.weather.desc"]');
    if (rainDesc && forecast?.tomorrow) {
      const prob = forecast.tomorrow.rain_prob;
      rainDesc.innerText = currentSiteLanguage === 'en' 
        ? `Rain chance tomorrow: ${prob}% • Humidity ${current.humidity}%` 
        : `நாளை மழை பெய்ய வாய்ப்பு: ${prob}% • ஈரப்பதம் ${current.humidity}%`;
    }
  }

  // 2. Real Soil Moisture Card
  const moistureVal = document.getElementById('sensor-moisture');
  if (moistureVal && current.soil_moisture_pct !== undefined) {
    moistureVal.innerText = current.soil_moisture_pct;
    const hEl = document.getElementById('header-moisture');
    if (hEl) hEl.innerText = `${current.soil_moisture_pct}%`;
  }

  // 3. Root Soil Temperature Card
  const tempSensorVal = document.getElementById('sensor-temp');
  if (tempSensorVal && current.soil_temperature) {
    tempSensorVal.innerText = Math.round(current.soil_temperature);
  }

  // 4. Update Forecast Slots in Controls Tab
  if (forecast) {
    const updateSlot = (idPrefix, slotData) => {
      const el = document.getElementById(idPrefix);
      if (el && slotData) {
        el.innerText = `${slotData.icon || '🌤️'} ${slotData.temp}°C (${slotData.rain_prob}% rain)`;
      }
    };
    updateSlot('controls-w-now', forecast.now);
    updateSlot('controls-w-2pm', forecast.after_2h);
    updateSlot('controls-w-6pm', forecast.evening);
    updateSlot('controls-w-tmrw', forecast.tomorrow);
  }
}

function handleLocationSearch(query) {
  clearTimeout(searchDebounceTimer);
  const container = document.getElementById('location-search-results');
  if (!query || query.trim().length < 2) {
    container.classList.add('hidden');
    container.innerHTML = "";
    return;
  }

  searchDebounceTimer = setTimeout(async () => {
    container.innerHTML = `<div class="p-3 text-stone-400 italic">தேடுகிறது... (Searching places)</div>`;
    container.classList.remove('hidden');

    const results = await AgroAPI.searchPlaces(query.trim());
    if (!results || results.length === 0) {
      container.innerHTML = `<div class="p-3 text-stone-500">இடங்கள் கிடைக்கவில்லை. வேறு ஊர் பெயரை முயற்சிக்கவும்.</div>`;
      return;
    }

    container.innerHTML = "";
    results.forEach(r => {
      const enName = getEnglishPlaceName(r.name);
      const taName = getTamilPlaceName(r.name);
      const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
      const item = document.createElement('div');
      item.className = "p-2.5 hover:bg-farm-50 cursor-pointer flex items-center justify-between text-stone-800 transition-colors";
      item.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>📍</span>
          <div>
            <span class="font-semibold">${isTa ? taName : enName}</span>
            <span class="text-[10px] text-stone-500 block">${r.admin1 || ''}, ${r.country || ''}</span>
          </div>
        </div>
        <span class="text-[10px] text-farm-700 bg-farm-100 px-2 py-0.5 rounded font-mono">${isTa ? 'தேர்வு' : 'Select'}</span>
      `;
      item.onclick = () => selectPlace(enName, r.latitude, r.longitude, taName);
      container.appendChild(item);
    });
  }, 350);
}

// ==========================================
// 4. CCTV TV Static & Real Connection
// ==========================================
function initTvStatic() {
  const canvas = document.getElementById('cctv-static-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 320;
  canvas.height = 180;

  function renderNoise() {
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const buffer32 = new Uint32Array(imgData.data.buffer);
    const len = buffer32.length;

    // Fast static noise loop
    for (let i = 0; i < len; i++) {
      // 50% random grey/white pixels
      if (Math.random() < 0.5) {
        const val = Math.floor(Math.random() * 180) + 40;
        buffer32[i] = (255 << 24) | (val << 16) | (val << 8) | val;
      } else {
        buffer32[i] = (255 << 24) | (15 << 16) | (15 << 8) | 15;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle horizontal CRT scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }

    staticNoiseAnimationId = requestAnimationFrame(renderNoise);
  }

  renderNoise();
}

function openCctvConnectModal() {
  const modal = document.getElementById('cctv-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeCctvConnectModal() {
  const modal = document.getElementById('cctv-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Connect Method 1: Local Device Webcam / Phone Camera
async function connectLocalWebcam() {
  closeCctvConnectModal();

  try {
    localMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment"
      },
      audio: false
    });

    const videoEl = document.getElementById('cctv-video-stream');
    videoEl.srcObject = localMediaStream;
    videoEl.classList.remove('hidden');

    // Stop and hide TV static
    if (staticNoiseAnimationId) cancelAnimationFrame(staticNoiseAnimationId);
    document.getElementById('cctv-static-canvas').classList.add('hidden');
    document.getElementById('cctv-disconnected-overlay').classList.add('hidden');
    document.getElementById('cctv-live-hud').classList.remove('hidden');

    // Update status badge to Live
    const badge = document.getElementById('cctv-status-badge');
    badge.className = "text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-red-200";
    document.getElementById('cctv-status-dot').className = "w-2 h-2 rounded-full bg-red-600 farm-pulse";
    document.getElementById('cctv-status-text').innerText = currentSiteLanguage === 'en' ? "🔴 LIVE FEED • 30 FPS" : "🔴 நேரலை (LIVE) • 30 FPS";

    // Toggle Buttons
    document.getElementById('btn-open-cctv-modal').classList.add('hidden');
    document.getElementById('btn-disconnect-cctv').classList.remove('hidden');

    // Notify Backend
    AgroAPI.connectCctv({
      camera_name: "Local Device Webcam",
      stream_url: "local_webcam_stream",
      source_type: "webcam"
    });

    lucide.createIcons();
  } catch (err) {
    alert("Camera permission denied or camera unavailable: " + err.message);
  }
}

// Connect Method 2: IP Camera / RTSP Video Stream
async function connectStreamUrl() {
  const urlInput = document.getElementById('cctv-stream-url-input');
  const nameInput = document.getElementById('cctv-cam-name-input');
  const streamUrl = (urlInput.value || "").trim();
  const camName = (nameInput.value || "Farm IP Cam").trim();

  if (!streamUrl) {
    alert("Please enter a valid RTSP / HTTP video stream URL.");
    return;
  }

  closeCctvConnectModal();

  const videoEl = document.getElementById('cctv-video-stream');
  videoEl.srcObject = null;
  videoEl.src = streamUrl;
  videoEl.classList.remove('hidden');

  // Stop static noise
  if (staticNoiseAnimationId) cancelAnimationFrame(staticNoiseAnimationId);
  document.getElementById('cctv-static-canvas').classList.add('hidden');
  document.getElementById('cctv-disconnected-overlay').classList.add('hidden');
  document.getElementById('cctv-live-hud').classList.remove('hidden');

  // Update Camera Label
  document.getElementById('cctv-cam-label').innerText = `${camName} • 1080p`;

  // Status Badge
  const badge = document.getElementById('cctv-status-badge');
  badge.className = "text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-red-200";
  document.getElementById('cctv-status-dot').className = "w-2 h-2 rounded-full bg-red-600 farm-pulse";
  document.getElementById('cctv-status-text').innerText = "🔴 LIVE IP STREAM";

  document.getElementById('btn-open-cctv-modal').classList.add('hidden');
  document.getElementById('btn-disconnect-cctv').classList.remove('hidden');

  AgroAPI.connectCctv({
    camera_name: camName,
    stream_url: streamUrl,
    source_type: "ip_stream"
  });

  lucide.createIcons();
}

// Disconnect CCTV (Restore TV Static & No Signal Overlay)
function disconnectRealCctv() {
  // Stop webcam tracks if active
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(track => track.stop());
    localMediaStream = null;
  }

  const videoEl = document.getElementById('cctv-video-stream');
  videoEl.pause();
  videoEl.srcObject = null;
  videoEl.removeAttribute('src');
  videoEl.classList.add('hidden');

  // Hide HUD, Show Static Noise & Disconnected OSD
  document.getElementById('cctv-live-hud').classList.add('hidden');
  document.getElementById('cctv-static-canvas').classList.remove('hidden');
  document.getElementById('cctv-disconnected-overlay').classList.remove('hidden');

  // Restart static noise loop
  initTvStatic();

  // Reset Status Badge
  const badge = document.getElementById('cctv-status-badge');
  badge.className = "text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-stone-200";
  document.getElementById('cctv-status-dot').className = "w-2 h-2 rounded-full bg-stone-400";
  document.getElementById('cctv-status-text').innerText = currentSiteLanguage === 'en' ? "⚫ NO SIGNAL • DISCONNECTED" : "⚫ சிக்னல் இல்லை (DISCONNECTED)";

  // Buttons
  document.getElementById('btn-open-cctv-modal').classList.remove('hidden');
  document.getElementById('btn-disconnect-cctv').classList.add('hidden');

  AgroAPI.disconnectCctv();
  lucide.createIcons();
}

// ==========================================
// 5. Chat UI with Direct & Relevant Answers
// ==========================================
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  appendMessage("user", text);

  // Show thinking indicator
  const container = document.getElementById('chat-messages');
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = "thinking-bubble";
  thinkingDiv.className = "bg-farm-50 text-farm-800 p-3 rounded-lg border border-farm-100 max-w-[85%] text-xs italic flex items-center space-x-2";
  const thinkText = currentSiteLanguage === 'en' ? "AgroSmart AI is thinking..." : "உழவன் தோழன் யோசிக்கிறது... (Thinking)";
  thinkingDiv.innerHTML = `<span class="w-2 h-2 rounded-full bg-farm-600 farm-pulse"></span><span>${thinkText}</span>`;
  container.appendChild(thinkingDiv);
  container.scrollTop = container.scrollHeight;

  // Call API with Location Context
  let replyText = null;
  let engineName = currentSiteLanguage === 'en' ? "AgroSmart AI" : "உழவன் தோழன்";
  const placeContext = window.getCurrentPlaceContext();

  const apiRes = await AgroAPI.chatWithAI(text, currentSiteLanguage, placeContext);
  
  // Remove thinking indicator
  const thinkEl = document.getElementById('thinking-bubble');
  if (thinkEl) thinkEl.remove();

  let speechText = null;

  if (apiRes && apiRes.reply) {
    replyText = apiRes.reply;
    speechText = apiRes.speech_text || apiRes.reply;
    if (apiRes.engine) engineName += ` (${apiRes.engine})`;
  } else {
    // Client fallback NLP
    const lower = text.toLowerCase();
    const k = VOICE_KNOWLEDGE[currentSiteLanguage] || VOICE_KNOWLEDGE['ta'];
    if (lower.includes("soil") || lower.includes("moisture") || lower.includes("மண்") || lower.includes("thanni") || lower.includes("eeram") || lower.includes("paachalama")) {
      replyText = k.soilMoisture;
    } else if (lower.includes("weather") || lower.includes("rain") || lower.includes("வானிலை") || lower.includes("mazhai") || lower.includes("malai")) {
      replyText = k.weather;
    } else if (lower.includes("pest") || lower.includes("பூச்சி") || lower.includes("poochi") || lower.includes("marunthu") || lower.includes("spray")) {
      replyText = k.pests;
    } else if (lower.includes("harvest") || lower.includes("அறுவடை") || lower.includes("aruvadai") || lower.includes("arukalam") || lower.includes("parikka")) {
      replyText = k.harvest;
    } else if (lower.includes("price") || lower.includes("mandi") || lower.includes("விலை") || lower.includes("rate") || lower.includes("kasu")) {
      replyText = k.price;
    } else if (lower.includes("uram") || lower.includes("fertilizer") || lower.includes("urea") || lower.includes("potash")) {
      replyText = k.fertilizer;
    } else {
      replyText = k.greeting;
    }
    speechText = replyText;
  }

  appendMessage("ai", replyText, engineName, speechText);
  speakText(speechText || replyText, currentSiteLanguage);
}

function quickPrompt(topic) {
  const prompts = {
    soil: { ta: "Thanni paachalama bro? Mann eeram eppadi irukku?", en: "How is my soil moisture today?" },
    weather: { ta: "Nalaiki mazhai varuma? Paasanam eppadi pannanum?", en: "Will it rain tomorrow? How should I irrigate?" },
    pest: { ta: "Thakkali chediyila poochi thollai jaasthi ah irukku, enna spray pannalam?", en: "What organic spray should I use for tomato pests?" },
    harvest: { ta: "Thakkali eppo arukalam? Harvest ready ah?", en: "When can I harvest my tomatoes?" },
    price: { ta: "Thakkali rate enna ippo mandiyila? Nalla vilaikku pogutha?", en: "What is the current tomato mandi price?" },
    fertilizer: { ta: "Poo pidikkura time-la enna uram podanum?", en: "What fertilizer should I apply during flowering stage?" }
  };
  const text = prompts[topic][currentSiteLanguage] || prompts[topic].ta;
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

function formatMarkdownToHtml(rawText, isUser = false) {
  if (!rawText) return '';
  let text = String(rawText).trim();

  // Escape raw HTML tags to prevent XSS
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__
  const boldClass = isUser ? 'font-bold text-white' : 'font-bold text-on-surface dark:text-white';
  text = text.replace(/\*\*(.+?)\*\*/g, `<strong class="${boldClass}">$1</strong>`);
  text = text.replace(/__(.+?)__/g, `<strong class="${boldClass}">$1</strong>`);

  // Italic: *text* (single-line only to avoid runaway matches across bullet lists)
  text = text.replace(/(?<![\*\w])\*([^\*\r\n]+)\*(?![\*\w])/g, '<em class="italic">$1</em>');

  // Bullet items starting with • or - or *
  const bulletDot = isUser 
    ? '<span class="text-stone-300 font-bold shrink-0 leading-tight select-none">•</span>' 
    : '<span class="text-primary font-bold shrink-0 leading-tight select-none">•</span>';
  
  const lines = text.split(/\r?\n/);
  const result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (inList) {
        result.push('</div>');
        inList = false;
      }
      result.push('<div class="h-2"></div>');
      continue;
    }

    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    if (isBullet) {
      if (!inList) {
        result.push('<div class="space-y-1 my-1">');
        inList = true;
      }
      let content = trimmed;
      if (content.startsWith('•')) content = content.substring(1).trim();
      else if (content.startsWith('- ') || content.startsWith('* ')) content = content.substring(2).trim();

      result.push(`<div class="flex items-start gap-1.5">${bulletDot}<span class="flex-1 leading-snug">${content}</span></div>`);
    } else {
      if (inList) {
        result.push('</div>');
        inList = false;
      }
      result.push(`<div class="leading-relaxed">${trimmed}</div>`);
    }
  }

  if (inList) {
    result.push('</div>');
  }

  return result.join('');
}
window.formatMarkdownToHtml = formatMarkdownToHtml;

function appendMessage(sender, text, customSender = null, speechText = null, imageUrl = null) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const msgDiv = document.createElement('div');
  const isUser = sender === 'user';
  const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
  
  const userLabel = isTa ? '👤 உழவர் (நீங்கள்)' : '👤 Farmer (You)';
  const senderTitle = isUser ? userLabel : (customSender || (isTa ? '🤖 உழவன் தோழன் AI' : '🤖 AgroSmart AI'));

  msgDiv.className = isUser 
    ? "bg-stone-800 text-white p-3 rounded-xl ml-auto max-w-[88%] shadow-xs" 
    : "bg-surface-container-lowest text-on-surface p-3.5 rounded-xl border border-primary/20 max-w-[92%] shadow-xs";

  window.chatSpeechRegistry = window.chatSpeechRegistry || [];
  const speechIndex = window.chatSpeechRegistry.push(speechText || text) - 1;

  const readAloudLabel = isTa ? 'மீண்டும் வாசி' : 'Read Aloud';
  const stopLabel = isTa ? 'நிறுத்து' : 'Stop';

  const aiVoiceActionButtons = !isUser ? `
    <div class="mt-2.5 pt-2 border-t border-outline-variant/20 flex flex-wrap items-center gap-2">
      <button onclick="speakText(window.chatSpeechRegistry[${speechIndex}], currentSiteLanguage)" class="px-2.5 py-1 text-[11px] rounded bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant/30 font-semibold flex items-center space-x-1 shadow-2xs transition-all">
        <span>🔊</span>
        <span>${readAloudLabel}</span>
      </button>
      <button onclick="stopSpeech()" class="px-2.5 py-1 text-[11px] rounded bg-white hover:bg-red-50 text-red-600 border border-stone-200 font-semibold flex items-center space-x-1 shadow-2xs transition-all">
        <span>⏹️</span>
        <span>${stopLabel}</span>
      </button>
    </div>
  ` : '';

  const imagePreviewHtml = imageUrl ? `
    <div class="mb-2.5 rounded-xl overflow-hidden border border-outline-variant/30 max-h-56 bg-black/5">
      <img src="${imageUrl}" alt="Crop Photo" class="w-full h-auto max-h-56 object-cover rounded-xl shadow-xs">
    </div>
  ` : '';

  msgDiv.innerHTML = `
    <div class="flex items-center space-x-2 text-xs font-semibold ${isUser ? 'text-stone-300' : 'text-primary'} mb-1.5">
      <span>${senderTitle}</span>
      <span class="text-[10px] text-stone-400 font-normal">Just now</span>
    </div>
    ${imagePreviewHtml}
    <div class="text-xs sm:text-sm leading-relaxed">${formatMarkdownToHtml(text, isUser)}</div>
    ${aiVoiceActionButtons}
  `;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}
window.appendMessage = appendMessage;

// Valve Toggles
async function toggleValve(id, isChecked) {
  await AgroAPI.toggleValve(id, isChecked);
}

function triggerSimulatedSMS() {
  const msg = currentSiteLanguage === 'en' 
    ? "AgroSmart Alert: Soil moisture level 78% optimal. Valve #1 running."
    : "உழவன் எச்சரிக்கை: தக்காளி தோட்டம் ஈரப்பதம் 78%. பாசனம் தேவையில்லை.";
  alert(`📱 SMS Sent (+91 98765 43210): '${msg}'`);
}

function scrollToVoiceAssistant() {
  document.getElementById('ai-assistant-card').scrollIntoView({ behavior: 'smooth' });
}

function scrollToCCTV() {
  document.getElementById('cctv-card').scrollIntoView({ behavior: 'smooth' });
}

function openAddProductModal() {
  const promptName = currentSiteLanguage === 'en' ? "Enter Product Name (e.g., Organic Capsicum):" : "விளைபொருள் பெயர் (எ.கா: குடைமிளகாய்):";
  const name = prompt(promptName);
  if (!name) return;

  const promptPrice = currentSiteLanguage === 'en' ? "Enter Price per kg in ₹:" : "கிலோவுக்கு விலை (ரூபாயில்):";
  const price = prompt(promptPrice, "60");
  if (!price) return;

  const promptStock = currentSiteLanguage === 'en' ? "Enter Stock in kg:" : "கையிருப்பு (கிலோவில்):";
  const stock = prompt(promptStock, "150");
  if (!stock) return;

  const perKgLabel = currentSiteLanguage === 'en' ? "per kg" : "கிலோவுக்கு";
  const stockLabel = currentSiteLanguage === 'en' ? "Stock" : "கையிருப்பு";

  const container = document.getElementById('products-list');
  const newCard = document.createElement('div');
  newCard.className = "flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-all border border-stone-100";
  newCard.innerHTML = `
    <div class="flex items-center space-x-4">
      <div class="text-3xl">🫑</div>
      <div>
        <h4 class="font-semibold text-stone-900">${name}</h4>
        <div class="flex items-center space-x-3 mt-1">
          <span class="text-base font-bold text-farm-700">₹${price} <span class="text-xs font-normal text-stone-500">${perKgLabel}</span></span>
          <span class="text-[11px] bg-farm-100 text-farm-800 font-medium px-2 py-0.5 rounded">Active</span>
        </div>
        <div class="flex items-center space-x-3 text-xs text-stone-400 mt-1">
          <span>${stockLabel}: ${stock} kg</span>
          <span>• 1 view</span>
          <span>• 5.0 ★</span>
        </div>
      </div>
    </div>
    <button class="text-xs border border-stone-300 px-3 py-1.5 rounded hover:bg-white text-stone-700 font-medium">Edit</button>
  `;
  container.prepend(newCard);
  const successMsg = currentSiteLanguage === 'en' ? `Added ${name} to your Marketplace inventory!` : `விளைபொருள் ${name} உங்கள் சந்தை பட்டியலில் சேர்க்கப்பட்டது!`;
  alert(successMsg);
}

// ==========================================
// 10. Smart Tower (IoT + 5 Sensors) Controller
// ==========================================
let towerState = {
  viewMode: 'schematic', // 'schematic' or 'photorealistic'
  temperature: 29.4,
  humidity: 68,
  moisture: 78,
  ph: 6.8,
  lux: 54200,
  battery: 98,
  solarVolt: 19.4,
  solarAmp: 2.1,
  rssi: -62,
  packetCount: 14290,
  activeSensorTab: 'temp'
};

function initSmartTower() {
  updateTowerUI();
  initOscilloscope();
  
  // Continuous signal transmission simulation
  setInterval(() => {
    // Subtle realistic live sensor fluctuations
    towerState.temperature = +(29.2 + Math.random() * 0.5).toFixed(1);
    towerState.humidity = Math.round(67 + Math.random() * 2);
    towerState.moisture = Math.round(77 + Math.random() * 2);
    towerState.ph = +(6.78 + Math.random() * 0.08).toFixed(1);
    towerState.lux = Math.round(53800 + Math.random() * 800);
    towerState.packetCount += 1;
    
    updateTowerUI();
    triggerTowerSignalPulse();
  }, 3000);
}

function updateTowerUI() {
  const elTemp = document.getElementById('tower-temp');
  if (elTemp) elTemp.innerText = towerState.temperature;

  const elHum = document.getElementById('tower-humidity');
  if (elHum) elHum.innerText = towerState.humidity;

  const elMoist = document.getElementById('tower-moisture');
  if (elMoist) elMoist.innerText = towerState.moisture;

  const elPh = document.getElementById('tower-ph');
  if (elPh) elPh.innerText = towerState.ph;

  const elLux = document.getElementById('tower-lux');
  if (elLux) elLux.innerText = towerState.lux.toLocaleString();

  const elPacket = document.getElementById('tower-packet-counter');
  if (elPacket) elPacket.innerText = towerState.packetCount.toLocaleString();

  const elBatt = document.getElementById('tower-battery-badge');
  if (elBatt) elBatt.innerText = `${towerState.battery}% (${towerState.solarVolt}V)`;

  updateRawPayloadSnippet();
}

function triggerTowerSignalPulse() {
  const lines = document.querySelectorAll('.tower-signal-line');
  lines.forEach((line) => {
    line.classList.add('signal-glow');
    setTimeout(() => line.classList.remove('signal-glow'), 1200);
  });

  const dots = document.querySelectorAll('.tower-signal-pulse-dot');
  dots.forEach(dot => {
    dot.style.animation = 'none';
    dot.offsetHeight; // trigger reflow
    dot.style.animation = '';
  });
}

function switchTowerView(mode) {
  towerState.viewMode = mode;
  const viewSchematic = document.getElementById('tower-view-schematic');
  const viewPhoto = document.getElementById('tower-view-photorealistic');
  const btnSchematic = document.getElementById('btn-view-schematic');
  const btnPhoto = document.getElementById('btn-view-photorealistic');

  if (mode === 'schematic') {
    if (viewSchematic) viewSchematic.classList.remove('hidden');
    if (viewPhoto) viewPhoto.classList.add('hidden');
    if (btnSchematic) {
      btnSchematic.className = "px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white shadow-xs transition-all";
    }
    if (btnPhoto) {
      btnPhoto.className = "px-3 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container transition-all";
    }
  } else {
    if (viewSchematic) viewSchematic.classList.add('hidden');
    if (viewPhoto) viewPhoto.classList.remove('hidden');
    if (btnPhoto) {
      btnPhoto.className = "px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white shadow-xs transition-all";
    }
    if (btnSchematic) {
      btnSchematic.className = "px-3 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container transition-all";
    }
  }
}

function openTowerDetailsModal(sensorKey = 'temp') {
  towerState.activeSensorTab = sensorKey;
  const modal = document.getElementById('tower-details-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    selectTowerSensorDetail(sensorKey);
    drawOscilloscope();
    updateRawPayloadSnippet();
  }
}

function closeTowerDetailsModal() {
  const modal = document.getElementById('tower-details-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

const TOWER_SENSOR_METRICS = {
  temp: {
    title: "Temperature Sensor (°C) / வெப்பநிலை உணரி",
    model: "Sensirion SHT40 + Dallas DS18B20 Dual Digital Probe",
    accuracy: "±0.1°C (Operating: -40°C to +85°C)",
    current: "29.4 °C (Ambient) • 24.1 °C (Soil Depth 15cm)",
    calibration: "Calibrated on 15-Oct-2026 • Zero Drift: 0.02%",
    range: "Daily Min: 21.8°C • Daily Max: 33.2°C • Optimal Band: 22-32°C",
    bus: "I2C Address 0x44 • Sample Rate: 1000ms"
  },
  hum: {
    title: "Humidity Sensor (%) / காற்றின் ஈரப்பதம் உணரி",
    model: "Capacitive Polymer Relative Humidity Sensor (SHT40)",
    accuracy: "±1.5% RH (0 to 100% Non-condensing)",
    current: "68 % RH • Dew Point: 21.4°C • Vapor Pressure Deficit: 1.12 kPa",
    calibration: "Factory Calibrated NIST Traceable • Filter: PTFE Membrane IP67",
    range: "Daily Min: 52% • Daily Max: 89% • Target Band: 55-80%",
    bus: "I2C Bus 1 • 400kHz Fast Mode"
  },
  moist: {
    title: "Soil Moisture Sensor (%) / மண் ஈரப்பதம் உணரி",
    model: "FDR Frequency Domain Reflectometry High-Precision Probe",
    accuracy: "±2% VWC (Volumetric Water Content)",
    current: "78 % VWC • Saturation: 88% • Permanent Wilting Point: 14%",
    calibration: "Calibrated for Red Loamy / Clayey Farm Soil (Coimbatore)",
    range: "Target: 70-85% for Tomato foliage • Depth: 15cm & 30cm multi-level",
    bus: "RS-485 Modbus RTU (Address 0x01, Baud 9600)"
  },
  ph: {
    title: "Soil pH Sensor (pH level) / மண் அமில-கார உணரி",
    model: "ISFET Solid-State Glass Electrode with Gel Electrolyte",
    accuracy: "±0.05 pH (0.00 to 14.00 pH range)",
    current: "6.8 pH • Temperature Compensated (ATC at 24.1°C)",
    calibration: "3-Point Buffer Calibration (pH 4.01, 7.00, 10.01)",
    range: "Optimal Nutrient Uptake Zone: 6.2 - 7.2 pH (Neutral)",
    bus: "Analog 0-2V through 16-Bit ADS1115 ADC"
  },
  lux: {
    title: "Light Intensity Sensor (lux) / சூரிய ஒளி தீவிரம் உணரி",
    model: "ROHM BH1750FVI Digital Ambient Light Sensor",
    accuracy: "±10% (1 to 65,535 lux resolution)",
    current: "54,200 lux • PAR Irradiance: 1,420 µmol/m²/s • UV Index: 6.2",
    calibration: "Optical Diffuser Calibrated against Sunlight Standard CIE D65",
    range: "Full Sunlight: >50,000 lux • Active Crop Photosynthesis Stage",
    bus: "I2C Address 0x23 • High-Res Mode 2"
  }
};

function selectTowerSensorDetail(key) {
  towerState.activeSensorTab = key;
  const data = TOWER_SENSOR_METRICS[key] || TOWER_SENSOR_METRICS.temp;
  
  document.querySelectorAll('.sensor-spec-tab').forEach(tab => {
    if (tab.dataset.sensor === key) {
      tab.classList.add('bg-primary', 'text-white');
      tab.classList.remove('bg-surface-container', 'text-on-surface');
    } else {
      tab.classList.remove('bg-primary', 'text-white');
      tab.classList.add('bg-surface-container', 'text-on-surface');
    }
  });

  const titleEl = document.getElementById('spec-sensor-title');
  if (titleEl) titleEl.innerText = data.title;

  const modelEl = document.getElementById('spec-sensor-model');
  if (modelEl) modelEl.innerText = data.model;

  const accEl = document.getElementById('spec-sensor-accuracy');
  if (accEl) accEl.innerText = data.accuracy;

  const curEl = document.getElementById('spec-sensor-current');
  if (curEl) curEl.innerText = data.current;

  const calEl = document.getElementById('spec-sensor-cal');
  if (calEl) calEl.innerText = data.calibration;

  const rangeEl = document.getElementById('spec-sensor-range');
  if (rangeEl) rangeEl.innerText = data.range;

  const busEl = document.getElementById('spec-sensor-bus');
  if (busEl) busEl.innerText = data.bus;
}

function updateRawPayloadSnippet() {
  const codeEl = document.getElementById('tower-raw-payload');
  if (!codeEl) return;
  const payload = {
    mast_id: "TWR-AGRO-04B",
    sector: "Coimbatore-4B",
    timestamp: new Date().toISOString(),
    sensors: {
      temp_c: towerState.temperature,
      humidity_pct: towerState.humidity,
      soil_moisture_pct: towerState.moisture,
      soil_ph: towerState.ph,
      ambient_lux: towerState.lux
    },
    power: {
      battery_pct: towerState.battery,
      solar_pv_v: towerState.solarVolt,
      charge_current_a: towerState.solarAmp,
      mppt_status: "bulk_charging"
    },
    radio: {
      protocol: "LoRaWAN 1.0.3 / Cat-M1",
      rssi_dbm: towerState.rssi,
      snr_db: 9.4,
      packet_id: towerState.packetCount
    }
  };
  codeEl.innerText = JSON.stringify(payload, null, 2);
}

// Canvas-based Sensor Oscilloscope Waveform
let oscAnimationId = null;
function initOscilloscope() {
  const canvas = document.getElementById('tower-oscilloscope-canvas');
  if (!canvas) return;
  drawOscilloscope();
}

function drawOscilloscope() {
  const canvas = document.getElementById('tower-oscilloscope-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  let offset = 0;
  function render() {
    ctx.fillStyle = '#0f1712';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Sine telemetry signal wave
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;

    for (let x = 0; x < width; x++) {
      const y = height / 2 + 
        Math.sin((x + offset) * 0.05) * 22 + 
        Math.sin((x * 2 + offset * 1.5) * 0.02) * 8 +
        (Math.random() - 0.5) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    offset += 2;
    oscAnimationId = requestAnimationFrame(render);
  }

  if (oscAnimationId) cancelAnimationFrame(oscAnimationId);
  render();
}

function simulateTowerSensorTest() {
  const isTa = (currentSiteLanguage === 'ta' || currentSiteLanguage === 'tamil');
  triggerTowerSignalPulse();
  
  // Flash sensors
  document.querySelectorAll('.tower-sensor-box').forEach(box => {
    box.classList.add('ring-2', 'ring-primary');
    setTimeout(() => box.classList.remove('ring-2', 'ring-primary'), 1000);
  });

  if (typeof showToast === 'function') {
    showToast(isTa ? "கோபுரத்தின் 5 உணரிகளுக்கும் சிக்னல் சோதனை வெற்றிகரமாக முடிந்தது!" : "Sensor ping test completed successfully for all 5 probes!");
  }
}

window.initSmartTower = initSmartTower;
window.switchTowerView = switchTowerView;
window.openTowerDetailsModal = openTowerDetailsModal;
window.closeTowerDetailsModal = closeTowerDetailsModal;
window.selectTowerSensorDetail = selectTowerSensorDetail;
window.simulateTowerSensorTest = simulateTowerSensorTest;
window.triggerTowerSignalPulse = triggerTowerSignalPulse;

