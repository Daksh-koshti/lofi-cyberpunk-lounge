/**
 * Cyberpunk Lo-Fi Lounge - Main Controller
 * Ties together clock greetings, Pomodoro focus timer, theme switches, and audio controls.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Clock & Dynamic Greeting (Daksh's signature logic!) ---
  const greetingEl = document.getElementById('greeting-text');
  const clockEl = document.getElementById('clock-display');
  const quoteEl = document.getElementById('vibe-quote');

  const vibeQuotes = [
    '"The best time to vibe code is right now."',
    '"Flow state is just one keystroke away."',
    '"Coding is modern spellcraft. Cast your vibes."',
    '"Keep calm, hydrate, and let the code breathe."',
    '"Small steady steps build cyber cities."'
  ];

  function updateClockAndGreeting() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;

    let greeting = 'Good Day, Daksh';
    if (hours < 12) {
      greeting = 'Good Morning, Daksh 🌅';
    } else if (hours < 17) {
      greeting = 'Good Afternoon, Daksh ⚡';
    } else if (hours < 21) {
      greeting = 'Good Evening, Daksh 🌆';
    } else {
      greeting = 'Good Night, Daksh 🌙';
    }

    greetingEl.textContent = greeting;
  }

  setInterval(updateClockAndGreeting, 1000);
  updateClockAndGreeting();

  // Quote rotation
  let quoteIndex = 0;
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % vibeQuotes.length;
    quoteEl.style.opacity = '0';
    setTimeout(() => {
      quoteEl.textContent = vibeQuotes[quoteIndex];
      quoteEl.style.opacity = '1';
    }, 400);
  }, 15000);

  // --- 2. Focus Timer / Pomodoro Logic ---
  let totalTime = 25 * 60;
  let timeRemaining = totalTime;
  let timerInterval = null;
  let isTimerRunning = false;

  const timerDisplay = document.getElementById('timer-time');
  const timerToggleBtn = document.getElementById('btn-timer-toggle');
  const timerToggleLabel = document.getElementById('btn-timer-label');
  const timerResetBtn = document.getElementById('btn-timer-reset');
  const progressBar = document.getElementById('timer-progress-bar');
  const timerModeLabel = document.getElementById('timer-mode-label');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const circumference = 2 * Math.PI * 95; // r=95
  progressBar.style.strokeDasharray = `${circumference}`;
  progressBar.style.strokeDashoffset = `0`;

  function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Progress circle
    const fraction = timeRemaining / totalTime;
    const offset = circumference * (1 - fraction);
    progressBar.style.strokeDashoffset = `${offset}`;
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerToggleLabel.textContent = 'PAUSE';
    timerToggleBtn.querySelector('.btn-icon').textContent = '⏸';

    timerInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        updateTimerDisplay();
        if (window.soundEngine && timeRemaining <= 3 && timeRemaining > 0) {
          window.soundEngine.playTick();
        }
      } else {
        // Finished!
        pauseTimer();
        if (window.soundEngine) {
          window.soundEngine.playSuccess();
        }
        alert('🎉 Focus Session Complete! Time for a breath of fresh air.');
        resetTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerToggleLabel.textContent = 'RESUME';
    timerToggleBtn.querySelector('.btn-icon').textContent = '▶';
  }

  function resetTimer() {
    pauseTimer();
    timeRemaining = totalTime;
    timerToggleLabel.textContent = 'START FOCUS';
    updateTimerDisplay();
  }

  timerToggleBtn.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', resetTimer);

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mins = parseInt(btn.dataset.mins, 10);
      totalTime = mins * 60;
      timeRemaining = totalTime;

      timerModeLabel.textContent = mins <= 5 ? 'CHILL BREAK' : (mins === 50 ? 'DEEP DIVE' : 'FOCUS SESSION');
      resetTimer();
    });
  });

  // Spacebar hotkey
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      timerToggleBtn.click();
    }
  });

  // --- 3. Master Audio & Ambient Controls ---
  const masterAudioBtn = document.getElementById('btn-master-audio');
  const masterAudioText = document.getElementById('master-audio-text');
  const statusAudioState = document.getElementById('status-audio-state');

  masterAudioBtn.addEventListener('click', () => {
    const active = window.soundEngine.toggleMaster();
    if (active) {
      masterAudioBtn.classList.add('active');
      masterAudioText.textContent = 'SOUND: ON';
      statusAudioState.textContent = 'SYNTHESIZER ACTIVE (ALL LAYERS)';
    } else {
      masterAudioBtn.classList.remove('active');
      masterAudioText.textContent = 'SOUND: OFF';
      statusAudioState.textContent = 'MUTED';
    }
  });

  // Slider Hookups
  const channelSlid = ['rain', 'drone', 'vinyl', 'binaural'];
  channelSlid.forEach(ch => {
    const slider = document.getElementById(`vol-${ch}`);
    const valDisplay = document.getElementById(`val-${ch}`);

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      valDisplay.textContent = `${val}%`;
      window.soundEngine.setVolume(ch, val / 100);

      // Auto-activate audio if moved while off
      if (!window.soundEngine.isPlaying && val > 0) {
        masterAudioBtn.click();
      }
    });
  });

  // --- 4. Soundboard Buttons ---
  document.getElementById('sfx-chime').addEventListener('click', () => window.soundEngine.playChime());
  document.getElementById('sfx-laser').addEventListener('click', () => window.soundEngine.playZap());
  document.getElementById('sfx-drop').addEventListener('click', () => window.soundEngine.playDroplet());
  document.getElementById('sfx-success').addEventListener('click', () => window.soundEngine.playSuccess());

  // --- 5. Theme Switcher ---
  const themeChips = document.querySelectorAll('.theme-chip');
  const statusThemeName = document.getElementById('status-theme-name');

  themeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      themeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const vibe = chip.dataset.vibe;
      document.body.setAttribute('data-theme', vibe);
      statusThemeName.textContent = chip.textContent.toUpperCase();

      if (window.particleEngine) {
        window.particleEngine.setTheme(vibe);
      }
    });
  });

  // --- 6. Focus Mission Persistence ---
  const focusInput = document.getElementById('focus-input');
  const savedMission = localStorage.getItem('vibe_mission');
  if (savedMission) {
    focusInput.value = savedMission;
  }
  focusInput.addEventListener('input', (e) => {
    localStorage.setItem('vibe_mission', e.target.value);
  });
});
