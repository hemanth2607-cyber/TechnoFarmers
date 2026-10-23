// Voice Assistant Engine with Native Tamil Audio Streaming, Speed Control & Stop/Restart Controls

let currentVoiceLang = 'ta'; // 'ta' or 'en'
let synth = window.speechSynthesis;
let currentPlayingAudio = null;
let lastSpokenText = "";
let isRecording = false;
let callTimerInterval = null;
let callSeconds = 0;
let isCallMicMuted = false;
let isCallSpeakerOn = true;
let isCallListening = false;
let callRecognition = null;
let chatRecognition = null;

const VOICE_KNOWLEDGE = {
  ta: {
    callWelcome: "வணக்கம் உழவரே, உங்கள் தோட்டத்து பயிருக்கு என்ன உதவி வேண்டும்?",
    greeting: "வணக்கம் உழவரே, நான் உங்களின் உழவன் ஏஐ உதவியாளர். மண் ஈரப்பதம், மழை நிலவரம், உரம், பூச்சி மேலாண்மை அல்லது தக்காளி மண்டி விலை பற்றி கேளுங்கள்.",
    soilMoisture: "உங்கள் தோட்டத்தின் மண் ஈரப்பதம் தற்போது 78 சதவீதம் ஆக உள்ளது. இது தக்காளி செடிகளுக்கு மிகவும் உகந்த அளவு. இப்போது தண்ணீர் பாய்ச்ச தேவையில்லை.",
    weather: "நாளை உங்கள் பகுதியில் மழை பெய்ய வாய்ப்புள்ளது. வேர் அழுகல் மற்றும் நீர் தேங்குவதை தடுக்க நீர்ப்பாசனத்தை 50 சதவீதம் குறைத்துக் கொள்ளவும்.",
    pests: "தக்காளி இலைகளில் அசுவினி மற்றும் சாறு உறிஞ்சும் பூச்சிகள் தென்படுகின்றன. ஒரு லிட்டர் தண்ணீருக்கு 5 மில்லி வேப்பெண்ணெய் கலந்து அதிகாலை அல்லது மாலை வேளையில் தெளிக்கவும்.",
    harvest: "பழங்களின் நிற மாற்றத்தின்படி இன்னும் ஐந்து முதல் ஏழு நாட்களில் தக்காளி அறுவடைக்கு முழுமையாக தயாராகிவிடும்.",
    price: "இன்றைய மண்டி நிலவரப்படி தக்காளி கிலோவுக்கு 85 ரூபாய் வரை நல்ல விலைக்கு போகிறது. நல்ல கிராக்கி இருப்பதால் அறுவடை செய்ய உகந்த நேரம்.",
    fertilizer: "பூ மற்றும் காய் பிடிக்கும் பருவத்தில் பொட்டாசியம் மற்றும் பாஸ்பரஸ் தேவை அதிகம். 19 19 19 அல்லது 0 52 34 நீரில் கரையும் உரத்தை சொட்டுநீர் மூலம் கொடுக்கலாம்."
  },
  en: {
    callWelcome: "Vanakkam farmer! Tell me, what advice do you need for your crops today?",
    greeting: "Vanakkam! I'm your AgroSmart farm assistant. Ask me anything about soil moisture, weather, pests, tomato prices, or fertilizers in Tamil, Thanglish, or English!",
    soilMoisture: "Your live soil moisture is at 78%, which is optimal for tomato crops. Drip irrigation does not need to be triggered right now.",
    weather: "Tomorrow's forecast predicts rain in your region. It is recommended to reduce irrigation by 50% to prevent root rot and waterlogging.",
    pests: "Early aphid symptoms detected on lower tomato foliage. Spray 5ml neem oil mixed with 1ml liquid soap per liter of water early morning or late evening.",
    harvest: "Based on current color-break staging and vegetative growth index, your tomatoes will reach peak harvest readiness in 5 to 7 days.",
    price: "Current APMC Mandi tomato price is 85 rupees per kg with strong wholesale demand. High market advantage for immediate harvest planning.",
    fertilizer: "For the flowering to fruiting stage, apply NPK 13:0:45 or 0:52:34 along with Micronutrient mix via fertigation for high fruit setting."
  }
};

/**
 * Clean text thoroughly for natural speech synthesis
 * Strips all markdown symbols, asterisks, hashtags, dashes, brackets, colons, emojis
 */
function cleanSpeechText(raw) {
  if (!raw) return "";
  let clean = raw
    // Remove markdown code blocks & links
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove symbols: * # _ ~ ` > | ( ) [ ] { }
    .replace(/[*#_~`>|\(\)\[\]\{\}]/g, " ")
    // Remove bullet hyphens, bullets, and numbered prefixes like "1.", "2."
    .replace(/^\s*[-•*]\s+/gm, " ")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/\b\d+\.\s*/g, " ")
    // Replace colons and semicolons with natural breath pauses (comma)
    .replace(/[:;]/g, ", ")
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{200D}]/gu, " ")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();

  // Limit to first 2-3 sentences for snappy, practical speech
  const sentences = clean.split(/(?<=[.?!।])\s+/);
  if (sentences.length > 3) {
    clean = sentences.slice(0, 3).join(" ");
  }
  return clean.substring(0, 240).trim();
}

/**
 * Stop any currently playing audio or speech synthesis
 */
function stopSpeech() {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (e) {}
    currentPlayingAudio = null;
  }

  if ('speechSynthesis' in window) {
    try {
      synth.cancel();
    } catch (e) {}
  }

  // Update UI speaking badges
  updateSpeakingStatusUI(false);
}

/**
 * Main Text-To-Speech player:
 * 1. Uses backend streaming native Tamil / English audio (/api/ai/tts)
 * 2. Speeds up slightly (rate = 1.08) for energetic, natural delivery
 * 3. Gracefully falls back to browser SpeechSynthesis if needed
 */
function speakText(text, lang = currentVoiceLang, onEndCallback = null) {
  stopSpeech();

  const clean = cleanSpeechText(text);
  if (!clean) {
    if (typeof onEndCallback === 'function') onEndCallback();
    return;
  }

  lastSpokenText = clean;
  updateSpeakingStatusUI(true, clean);

  const targetLang = (lang === 'ta' || lang === 'tamil' || lang === 'thanglish') ? 'ta' : 'en';

  // Strategy A: Native Tamil MP3 Audio Stream from backend endpoint
  const apiHost = window.AGRO_API_HOST || "";
  const audioUrl = `${apiHost}/api/ai/tts?text=${encodeURIComponent(clean)}&lang=${targetLang}`;
  const audio = new Audio(audioUrl);
  // User requested: "let the voice be a very little faster"
  audio.playbackRate = 1.08;
  currentPlayingAudio = audio;

  let audioPlaybackFailed = false;

  audio.onended = () => {
    currentPlayingAudio = null;
    updateSpeakingStatusUI(false);
    if (typeof onEndCallback === 'function') onEndCallback();
  };

  audio.onerror = (e) => {
    audioPlaybackFailed = true;
    console.warn("Native TTS audio failed, trying browser SpeechSynthesis fallback...", e);
    currentPlayingAudio = null;
    speakWithWebSpeechFallback(clean, targetLang, onEndCallback);
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      if (!audioPlaybackFailed) {
        speakWithWebSpeechFallback(clean, targetLang, onEndCallback);
      }
    });
  }
}

/**
 * Browser SpeechSynthesis Fallback
 */
function speakWithWebSpeechFallback(cleanText, lang, onEndCallback) {
  if (!('speechSynthesis' in window)) {
    updateSpeakingStatusUI(false);
    if (typeof onEndCallback === 'function') onEndCallback();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = synth.getVoices();

  if (lang === 'ta') {
    const tamilVoice = voices.find(v => v.lang.toLowerCase().startsWith('ta') || v.name.toLowerCase().includes('tamil') || v.name.includes('Valluvar'));
    if (tamilVoice) utterance.voice = tamilVoice;
    utterance.lang = 'ta-IN';
  } else {
    const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    utterance.lang = 'en-IN';
  }

  // Slightly faster speech rate (1.08)
  utterance.rate = 1.08;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    updateSpeakingStatusUI(false);
    if (typeof onEndCallback === 'function') onEndCallback();
  };
  utterance.onerror = () => {
    updateSpeakingStatusUI(false);
    if (typeof onEndCallback === 'function') onEndCallback();
  };

  synth.speak(utterance);
}

/**
 * Re-read the last spoken response aloud
 */
function readAloudLast() {
  if (lastSpokenText) {
    speakText(lastSpokenText, currentVoiceLang);
  } else {
    const defaultGreeting = VOICE_KNOWLEDGE[currentVoiceLang]?.greeting || VOICE_KNOWLEDGE['ta'].greeting;
    speakText(defaultGreeting, currentVoiceLang);
  }
}

function updateSpeakingStatusUI(isPlaying, text = "") {
  const globalStopBtn = document.getElementById('global-speech-stop-btn');
  const globalWaveIndicator = document.getElementById('global-speech-indicator');

  if (globalStopBtn) {
    if (isPlaying) {
      globalStopBtn.classList.remove('hidden');
    } else {
      globalStopBtn.classList.add('hidden');
    }
  }

  if (globalWaveIndicator) {
    if (isPlaying) {
      globalWaveIndicator.classList.remove('hidden');
    } else {
      globalWaveIndicator.classList.add('hidden');
    }
  }
}

function setLanguage(lang) {
  currentVoiceLang = lang;
  const greeting = VOICE_KNOWLEDGE[lang]?.greeting || VOICE_KNOWLEDGE['ta'].greeting;
  const greetingEl = document.getElementById('initial-ai-greeting');
  if (greetingEl) greetingEl.innerText = greeting;
}

// Inline Chat Speech Recognition (Tamil & English)
function toggleVoiceRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    return;
  }

  const btn = document.getElementById('mic-btn') || document.getElementById('voice-record-btn');
  if (isRecording) {
    if (chatRecognition) chatRecognition.stop();
    isRecording = false;
    if (btn) {
      btn.classList.remove('bg-red-500', 'text-white', 'farm-pulse');
      btn.classList.add('text-primary');
    }
    return;
  }

  chatRecognition = new SpeechRecognition();
  chatRecognition.lang = currentVoiceLang === 'ta' ? 'ta-IN' : 'en-IN';
  chatRecognition.interimResults = false;

  chatRecognition.onstart = () => {
    isRecording = true;
    if (btn) {
      btn.classList.add('bg-red-500', 'text-white', 'farm-pulse');
      btn.classList.remove('text-primary');
    }
  };

  chatRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chat-input');
    if (input) input.value = transcript;
    if (typeof sendChatMessage === 'function') sendChatMessage();
  };

  chatRecognition.onerror = () => {
    isRecording = false;
    if (btn) {
      btn.classList.remove('bg-red-500', 'text-white', 'farm-pulse');
      btn.classList.add('text-primary');
    }
  };

  chatRecognition.onend = () => {
    isRecording = false;
    if (btn) {
      btn.classList.remove('bg-red-500', 'text-white', 'farm-pulse');
      btn.classList.add('text-primary');
    }
  };

  chatRecognition.start();
}

// -------------------------------------------------------------
// Web Audio API Ringtone & Call Audio SFX
// -------------------------------------------------------------
let sfxAudioCtx = null;
let ringtoneInterval = null;
let ringOsc1 = null;
let ringOsc2 = null;

function getSfxAudioContext() {
  if (!sfxAudioCtx) {
    sfxAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sfxAudioCtx.state === 'suspended') {
    sfxAudioCtx.resume();
  }
  return sfxAudioCtx;
}

function playPhoneRingtone() {
  stopPhoneRingtone();
  try {
    const ctx = getSfxAudioContext();
    const playBurst = () => {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.3);
        osc2.stop(ctx.currentTime + 1.3);
      } catch (e) {}
    };

    playBurst();
    ringtoneInterval = setInterval(playBurst, 2400);
  } catch (e) {
    console.warn("Ringtone SFX error:", e);
  }
}

function stopPhoneRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

function playConnectChime() {
  try {
    const ctx = getSfxAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.36);
    });
  } catch (e) {}
}

function playDisconnectTone() {
  try {
    const ctx = getSfxAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch (e) {}
}

// Visualizer Waveform Animation
let visualizerInterval = null;
function startVisualizerWaves(isActive = true) {
  stopVisualizerWaves();
  const bars = document.querySelectorAll('.call-wave-bar');
  if (!bars.length) return;

  visualizerInterval = setInterval(() => {
    bars.forEach((bar) => {
      const height = isActive ? Math.floor(Math.random() * 32) + 8 : 4;
      bar.style.height = `${height}px`;
    });
  }, 100);
}

function stopVisualizerWaves() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
    visualizerInterval = null;
  }
  const bars = document.querySelectorAll('.call-wave-bar');
  bars.forEach(bar => { bar.style.height = '6px'; });
}

// -------------------------------------------------------------
// Interactive Voice Call Simulator with Full Stop & Restart
// -------------------------------------------------------------
function startVoiceCallModal() {
  const modal = document.getElementById('voice-call-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  callSeconds = 0;
  isCallMicMuted = false;
  isCallSpeakerOn = true;

  const isTa = (currentVoiceLang === 'ta' || currentVoiceLang === 'tamil');
  const timerEl = document.getElementById('call-timer');
  if (timerEl) timerEl.innerText = "00:00";

  const statusLine = document.getElementById('call-status-line');
  if (statusLine) {
    statusLine.innerText = isTa ? "அழைக்கிறது... உழவன் ஏஐ இணைக்கப்படுகிறது" : "Calling... Connecting to Ulavan AI";
  }

  const quoteEl = document.getElementById('call-transcript-quote');
  if (quoteEl) {
    quoteEl.innerHTML = `<span class="opacity-60 italic">${isTa ? "இணைக்கிறது..." : "Dialing..."}</span>`;
  }

  // Play outgoing phone dial tone
  playPhoneRingtone();
  startVisualizerWaves(false);

  // Connect after 1.8s
  setTimeout(() => {
    stopPhoneRingtone();
    playConnectChime();
    startVisualizerWaves(true);

    if (!modal.classList.contains('flex')) return;

    if (statusLine) {
      statusLine.innerText = isTa 
        ? "🟢 அழைப்பு இணைக்கப்பட்டது • உழவன் தோழன் பேசுகிறது..." 
        : "🟢 Call Connected • Ulavan AI Speaking...";
    }

    const welcome = VOICE_KNOWLEDGE[currentVoiceLang]?.callWelcome || VOICE_KNOWLEDGE['ta'].callWelcome;
    if (quoteEl) {
      quoteEl.innerHTML = `<strong>🤖 உழவன் AI:</strong> "${welcome}"`;
    }

    clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);

    // Speak welcome aloud, then automatically listen to farmer
    speakText(welcome, currentVoiceLang, () => {
      startVisualizerWaves(false);
      if (!isCallMicMuted && modal.classList.contains('flex')) {
        startCallListening();
      }
    });

  }, 1800);

  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function startCallListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusLine = document.getElementById('call-status-line');
  const isTa = (currentVoiceLang === 'ta' || currentVoiceLang === 'tamil');

  if (!SpeechRecognition) {
    if (statusLine) {
      statusLine.innerText = isTa 
        ? "💡 கீழே உள்ள தலைப்புகளைத் தட்டி பேசவும் (Tap topics below)" 
        : "💡 Tap quick topic questions below to ask";
    }
    return;
  }

  if (isCallMicMuted) return;

  try {
    if (callRecognition) {
      callRecognition.abort();
    }
    callRecognition = new SpeechRecognition();
    callRecognition.lang = isTa ? 'ta-IN' : 'en-IN';
    callRecognition.interimResults = false;

    callRecognition.onstart = () => {
      isCallListening = true;
      if (statusLine) {
        statusLine.innerText = isTa 
          ? "🔴 நீங்கள் பேசுவதைக் கேட்கிறது... (Listening now...)" 
          : "🔴 Listening to your voice... Speak now!";
      }
      const micBtn = document.getElementById('btn-call-mic');
      if (micBtn) micBtn.classList.add('ring-4', 'ring-emerald-400');
      startVisualizerWaves(true);
    };

    callRecognition.onresult = async (event) => {
      const userText = event.results[0][0].transcript;
      if (!userText || !userText.trim()) return;

      const quoteEl = document.getElementById('call-transcript-quote');
      if (quoteEl) {
        quoteEl.innerHTML = `<strong>👨‍🌾 உழவர்:</strong> "${userText}"`;
      }
      if (statusLine) {
        statusLine.innerText = isTa 
          ? "🤖 உழவன் தோழன் யோசிக்கிறது... (Analyzing...)" 
          : "🤖 Ulavan AI is thinking...";
      }

      // Query AI Backend with location & telemetry context
      const locationContext = window.getCurrentPlaceContext ? window.getCurrentPlaceContext() : null;
      let reply = null;
      try {
        if (window.AgroAPI && typeof AgroAPI.chatWithAI === 'function') {
          const res = await AgroAPI.chatWithAI(userText, currentVoiceLang, locationContext);
          if (res) {
            reply = res.speech_text || res.reply;
          }
        }
      } catch (err) {
        console.warn("Call chat API error:", err);
      }

      if (!reply) {
        const k = VOICE_KNOWLEDGE[currentVoiceLang] || VOICE_KNOWLEDGE['ta'];
        if (/மழை|வானிலை|rain|weather/i.test(userText)) reply = k.weather;
        else if (/பூச்சி|மருந்து|pest|insect/i.test(userText)) reply = k.pests;
        else if (/விலை|மண்டி|rate|price/i.test(userText)) reply = k.price;
        else if (/உரம்|npk|fertilizer/i.test(userText)) reply = k.fertilizer;
        else reply = k.soilMoisture;
      }

      const cleanReply = cleanSpeechText(reply);
      if (quoteEl) {
        quoteEl.innerHTML = `<div class="mb-1 text-on-surface-variant text-[11px]">👨‍🌾 "${userText}"</div><strong>🤖 உழவன் AI:</strong> "${cleanReply}"`;
      }
      if (statusLine) {
        statusLine.innerText = isTa 
          ? "🔊 உழவன் தோழன் பதிலளிக்கிறது... (Speaking...)" 
          : "🔊 Ulavan AI is speaking...";
      }

      startVisualizerWaves(true);

      // Speak reply out loud
      speakText(cleanReply, currentVoiceLang, () => {
        startVisualizerWaves(false);
        const modal = document.getElementById('voice-call-modal');
        if (modal && modal.classList.contains('flex') && !isCallMicMuted) {
          setTimeout(startCallListening, 700);
        }
      });
    };

    callRecognition.onerror = (e) => {
      isCallListening = false;
      startVisualizerWaves(false);
      if (statusLine) {
        statusLine.innerText = isTa 
          ? "🎤 மைக்கை தட்டி அல்லது கீழே உள்ள கேள்விகளைத் தொடவும்" 
          : "🎤 Tap mic or select quick questions below";
      }
    };

    callRecognition.onend = () => {
      isCallListening = false;
      const micBtn = document.getElementById('btn-call-mic');
      if (micBtn) micBtn.classList.remove('ring-4', 'ring-emerald-400');
    };

    callRecognition.start();
  } catch (err) {
    console.warn("Recognition start failed:", err);
  }
}

function quickCallTopic(topic) {
  const isTa = (currentVoiceLang === 'ta' || currentVoiceLang === 'tamil');
  const k = VOICE_KNOWLEDGE[currentVoiceLang] || VOICE_KNOWLEDGE['ta'];
  let question = "";
  let answer = "";

  if (topic === 'moisture') {
    question = isTa ? "மண் ஈரப்பதம் எப்படி உள்ளது?" : "How is the soil moisture?";
    answer = k.soilMoisture;
  } else if (topic === 'weather') {
    question = isTa ? "இன்று மழை வருமா?" : "Will it rain today?";
    answer = k.weather;
  } else if (topic === 'price') {
    question = isTa ? "தக்காளி மண்டி விலை என்ன?" : "What is current tomato market price?";
    answer = k.price;
  } else if (topic === 'pest') {
    question = isTa ? "பூச்சி மருந்து ஆலோசனை தேவை" : "Need pest management advice";
    answer = k.pests;
  } else if (topic === 'fertilizer') {
    question = isTa ? "என்ன உரம் இடலாம்?" : "What fertilizer should I apply?";
    answer = k.fertilizer;
  }

  const quoteEl = document.getElementById('call-transcript-quote');
  const statusLine = document.getElementById('call-status-line');
  const cleanAnswer = cleanSpeechText(answer);

  if (quoteEl) {
    quoteEl.innerHTML = `<div class="mb-1 text-on-surface-variant text-[11px]">👨‍🌾 "${question}"</div><strong>🤖 உழவன் AI:</strong> "${cleanAnswer}"`;
  }
  if (statusLine) {
    statusLine.innerText = isTa ? "🔊 உழவன் தோழன் பதிலளிக்கிறது..." : "🔊 Ulavan AI is speaking...";
  }

  stopSpeech();
  startVisualizerWaves(true);

  speakText(cleanAnswer, currentVoiceLang, () => {
    startVisualizerWaves(false);
    const modal = document.getElementById('voice-call-modal');
    if (modal && modal.classList.contains('flex') && !isCallMicMuted) {
      setTimeout(startCallListening, 700);
    }
  });
}

function switchCallLanguage(lang) {
  currentVoiceLang = lang;
  if (typeof changeSiteLanguage === 'function') {
    changeSiteLanguage(lang);
  }
  const isTa = (lang === 'ta' || lang === 'tamil');
  const btnTa = document.getElementById('call-lang-ta');
  const btnEn = document.getElementById('call-lang-en');
  if (btnTa && btnEn) {
    if (isTa) {
      btnTa.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white";
      btnEn.className = "px-2.5 py-1 rounded-full text-xs font-medium text-white/70 hover:text-white";
    } else {
      btnEn.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white";
      btnTa.className = "px-2.5 py-1 rounded-full text-xs font-medium text-white/70 hover:text-white";
    }
  }

  const statusLine = document.getElementById('call-status-line');
  if (statusLine) {
    statusLine.innerText = isTa 
      ? "தமிழ் பயன்முறை தேர்ந்தெடுக்கப்பட்டது" 
      : "Switched to English voice mode";
  }

  const welcome = VOICE_KNOWLEDGE[lang]?.callWelcome || VOICE_KNOWLEDGE['ta'].callWelcome;
  const quoteEl = document.getElementById('call-transcript-quote');
  if (quoteEl) {
    quoteEl.innerHTML = `<strong>🤖 Ulavan AI:</strong> "${welcome}"`;
  }
  speakText(welcome, lang, () => {
    startCallListening();
  });
}

function endVoiceCallModal() {
  stopPhoneRingtone();
  stopSpeech();
  stopVisualizerWaves();
  playDisconnectTone();

  const modal = document.getElementById('voice-call-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  clearInterval(callTimerInterval);
  if (callRecognition) {
    try { callRecognition.abort(); } catch (e) {}
    callRecognition = null;
  }
}

function toggleCallMic() {
  isCallMicMuted = !isCallMicMuted;
  const btn = document.getElementById('btn-call-mic');
  const statusLine = document.getElementById('call-status-line');
  const isTa = (currentVoiceLang === 'ta' || currentVoiceLang === 'tamil');

  if (isCallMicMuted) {
    if (callRecognition) {
      try { callRecognition.abort(); } catch (e) {}
    }
    if (btn) {
      btn.classList.add('bg-red-500', 'text-white');
      btn.classList.remove('bg-white/10', 'text-white');
    }
    if (statusLine) statusLine.innerText = isTa ? "🔇 மைக் அணைக்கப்பட்டது (Muted)" : "🔇 Microphone Muted";
  } else {
    if (btn) {
      btn.classList.remove('bg-red-500');
      btn.classList.add('bg-white/10', 'text-white');
    }
    if (statusLine) statusLine.innerText = isTa ? "🎤 பேசத் தயார்... (Listening...)" : "🎤 Ready to listen...";
    startCallListening();
  }
}

function toggleCallSpeaker() {
  isCallSpeakerOn = !isCallSpeakerOn;
  const btn = document.getElementById('btn-call-speaker');
  if (!isCallSpeakerOn) {
    if (btn) btn.classList.add('opacity-40');
    stopSpeech();
  } else {
    if (btn) btn.classList.remove('opacity-40');
    readAloudLast();
  }
}

window.startVoiceCallModal = startVoiceCallModal;
window.endVoiceCallModal = endVoiceCallModal;
window.toggleCallMic = toggleCallMic;
window.toggleCallSpeaker = toggleCallSpeaker;
window.quickCallTopic = quickCallTopic;
window.switchCallLanguage = switchCallLanguage;

