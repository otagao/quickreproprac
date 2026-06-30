import { state } from './state.js';
import { canvas, imageModeBtn, freeModeBtn, folderSection, timerSection, exportSection, workspace, freeModeMaxSwitches, nextImageBtn, intervalInput, statusText, imageCounter, referenceImage, noImageText } from './dom.js';
import { resetViewState, applyViewChange } from './transform.js';
import { stopTimer, updateTimerDisplay, stopStopwatch } from './timer.js';
import { clearCanvas } from './drawing.js';
import { saveCurrentCanvas, updateSavedCount } from './export.js';
import { t } from './i18n.js';

export function displayCurrentImage() {
  // この関数はフリーモードの画像切替では使われない。
  // イメージモードではdropzone.jsのloadImageFile()が直接referenceImageを操作する。
  if (state.images.length === 0) return;
  updateImageCounter();
}

export function switchMode(mode) {
  state.currentMode = mode;
  resetViewState();

  if (mode === 'free') {
    // フリーモード: D&Dエリア非表示、タイマー/エクスポート表示、キャンバスのみ
    folderSection.style.display = 'none';
    timerSection.style.display = 'block';
    if (exportSection) exportSection.style.display = 'block';
    freeModeMaxSwitches.style.display = 'block';
    workspace.classList.add('free-mode');

    // モードボタン更新
    imageModeBtn.classList.remove('active');
    freeModeBtn.classList.add('active');

    // ストップウォッチ停止
    stopStopwatch();

    // カウントダウンタイマー停止
    stopTimer();

    // imageCounterを表示に戻す
    imageCounter.style.display = '';

    // スイッチカウンタとキャンバスリセット
    state.switchCounter = 0;
    state.savedCanvases = [];
    updateSavedCount();

    // キャンバスを正方形固定サイズにリサイズ
    resizeCanvasForFreeMode();

    statusText.textContent = t('freeModeLabel');
    imageCounter.textContent = '-- / --';

    // フリーモードのボタンラベル更新
    nextImageBtn.textContent = t('nextCanvas');

    // 次の画像ボタン状態更新
    updateNextImageButtonState();
  } else {
    // イメージモード: D&Dエリア表示、タイマー/エクスポートセクション非表示
    folderSection.style.display = 'block';
    timerSection.style.display = 'none';
    if (exportSection) exportSection.style.display = 'none';
    freeModeMaxSwitches.style.display = 'none';
    workspace.classList.remove('free-mode');

    // モードボタン更新
    imageModeBtn.classList.add('active');
    freeModeBtn.classList.remove('active');

    // imageCounterを非表示
    imageCounter.style.display = 'none';

    // カウントダウンタイマー停止・ストップウォッチ停止
    stopTimer();
    stopStopwatch();

    // スイッチカウンタとキャンバスリセット
    state.switchCounter = 0;
    state.savedCanvases = [];
    updateSavedCount();

    statusText.textContent = t('dropImagePrompt');

    // イメージモードのボタンラベル更新（ボタン自体は非表示セクション内）
    nextImageBtn.textContent = t('nextImage');

    // 次の画像ボタン状態更新
    updateNextImageButtonState();
  }

  applyViewChange();
}

export function resizeCanvasForFreeMode() {
  // Set internal canvas resolution to fixed 1500x1500px
  // CSS will handle responsive display sizing
  canvas.width = 1500;
  canvas.height = 1500;

  // Redraw canvas with existing state.strokes
  applyViewChange();
}

export function resizeCanvas() {
  const img = referenceImage;
  const container = canvas.parentElement;

  if (!img.naturalWidth || !img.naturalHeight) return;

  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let canvasWidth, canvasHeight;

  if (aspectRatio > containerAspectRatio) {
    // Image is wider than container
    canvasWidth = containerWidth;
    canvasHeight = containerWidth / aspectRatio;
  } else {
    // Image is taller than container
    canvasHeight = containerHeight;
    canvasWidth = containerHeight * aspectRatio;
  }

  // Do not exceed original image dimensions
  if (canvasWidth > img.naturalWidth || canvasHeight > img.naturalHeight) {
    canvasWidth = img.naturalWidth;
    canvasHeight = img.naturalHeight;
  }

  // Set canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Redraw canvas with existing state.strokes
  applyViewChange();
}

export function updateNextImageButtonState() {
  // Disable button if there are no state.strokes (nothing drawn)
  nextImageBtn.disabled = state.strokes.length === 0;
}

export function nextImage() {
  if (state.currentMode === 'free') {
    // In free mode, save canvas before clearing
    saveCurrentCanvas();

    // Increment switch counter
    state.switchCounter++;

    // Check if max switches reached
    if (state.switchCounter >= state.maxSwitches) {
      stopTimer();
      statusText.textContent = t('maxSwitchesReached', { n: state.maxSwitches });
      imageCounter.textContent = `${state.switchCounter} / ${state.maxSwitches}`;
      return;
    }

    // Update counter display
    imageCounter.textContent = `${state.switchCounter} / ${state.maxSwitches}`;

    // Reset timer if running
    if (state.timerInterval) {
      const interval = parseInt(intervalInput.value);
      state.remainingTime = interval;
      updateTimerDisplay();

      // Restart the timer to reset the setInterval cycle
      clearInterval(state.timerInterval);
      state.timerInterval = setInterval(() => {
        state.remainingTime--;
        updateTimerDisplay();

        if (state.remainingTime <= 0) {
          nextImage();
          state.remainingTime = interval;
        }
      }, 1000);
    }

    // Clear the canvas
    clearCanvas();
    return;
  }

  // Image mode: save canvas before switching
  saveCurrentCanvas();

  // Switch to next image
  if (state.images.length === 0) return;

  // Check if we're at the last image
  if (state.currentImageIndex >= state.images.length - 1) {
    // If auto-switch is active, stop it instead of looping
    if (state.timerInterval) {
      stopTimer();
      statusText.textContent = t('allImagesShown');
    }
    return;
  }

  state.currentImageIndex++;
  displayCurrentImage();

  // Reset timer if running
  if (state.timerInterval) {
    const interval = parseInt(intervalInput.value);
    state.remainingTime = interval;
    updateTimerDisplay();

    // Restart the timer to reset the setInterval cycle
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.remainingTime--;
      updateTimerDisplay();

      if (state.remainingTime <= 0) {
        nextImage();
        state.remainingTime = interval;
      }
    }, 1000);
  }

  // Clear canvas when switching state.images
  clearCanvas();
}

export function updateImageCounter() {
  if (state.images.length > 0) {
    imageCounter.textContent = `${state.currentImageIndex + 1} / ${state.images.length}`;
  } else {
    imageCounter.textContent = '0 / 0';
  }
}

export function updateDynamicTexts() {
  if (state.currentMode === 'free') {
    nextImageBtn.textContent = t('nextCanvas');

    if (state.switchCounter >= state.maxSwitches) {
      statusText.textContent = t('maxSwitchesReached', { n: state.maxSwitches });
    } else if (state.timerInterval) {
      statusText.textContent = t('autoClearActive');
    } else {
      statusText.textContent = t('freeModeLabel');
    }

    return;
  }

  nextImageBtn.textContent = t('nextImage');
  statusText.textContent = t('dropImagePrompt');
}
