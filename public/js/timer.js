import { state } from './state.js';
import { intervalInput, maxSwitchesInput, startTimerBtn, statusText, imageCounter, timerDisplay } from './dom.js';
import { nextImage } from './images.js';
import { updateSavedCount } from './export.js';
import { t } from './i18n.js';

export function startTimer() {
  stopTimer(); // Stop any existing timer

  const interval = parseInt(intervalInput.value);
  if (isNaN(interval) || interval < 1) {
    alert(t('invalidInterval'));
    return;
  }

  // In image mode, require state.images to be loaded
  if (state.currentMode === 'image' && state.images.length === 0) {
    alert(t('loadImagesFirst'));
    return;
  }

  // In free mode, read max switches setting and reset counter
  if (state.currentMode === 'free') {
    state.maxSwitches = parseInt(maxSwitchesInput.value);
    if (isNaN(state.maxSwitches) || state.maxSwitches < 1) {
      alert(t('invalidMaxSwitches'));
      return;
    }
    state.switchCounter = 0;
    state.savedCanvases = [];
    updateSavedCount();
    imageCounter.textContent = `${state.switchCounter} / ${state.maxSwitches}`;
  }

  state.remainingTime = interval;
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    state.remainingTime--;
    updateTimerDisplay();

    if (state.remainingTime <= 0) {
      nextImage();
      state.remainingTime = interval;
    }
  }, 1000);

  if (state.currentMode === 'free') {
    statusText.textContent = t('autoClearActive');
  } else {
    statusText.textContent = t('autoSwitchActive');
  }
  startTimerBtn.disabled = true;
}

export function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;

    if (state.currentMode === 'free') {
      statusText.textContent = t('freeModeLabel');
    } else {
      statusText.textContent = t('autoSwitchStopped');
    }
    startTimerBtn.disabled = false;
  }
  timerDisplay.textContent = '--:--';
}

export function updateTimerDisplay() {
  const minutes = Math.floor(state.remainingTime / 60);
  const seconds = state.remainingTime % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
