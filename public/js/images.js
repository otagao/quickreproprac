import { state } from './state.js';
import { canvas, imageModeBtn, freeModeBtn, folderSection, timerSection, workspace, freeModeMaxSwitches, nextImageBtn, intervalInput, statusText, imageCounter, referenceImage, noImageText } from './dom.js';
import { resetViewState, applyViewChange } from './transform.js';
import { stopTimer, updateTimerDisplay } from './timer.js';
import { clearCanvas } from './drawing.js';
import { saveCurrentCanvas, updateSavedCount } from './export.js';

export function displayCurrentImage() {
  if (state.images.length === 0) return;

  const imagePath = `/images/${state.images[state.currentImageIndex]}`;
  referenceImage.src = imagePath;
  referenceImage.style.display = 'block';
  noImageText.style.display = 'none';

  // Wait for image to load to get its aspect ratio
  referenceImage.onload = () => {
    resetViewState();
    resizeCanvas();
  };

  updateImageCounter();
}

export function switchMode(mode) {
  state.currentMode = mode;
  resetViewState();

  if (mode === 'free') {
    // Free mode: hide folder section, show timer, canvas only
    folderSection.style.display = 'none';
    timerSection.style.display = 'block';
    freeModeMaxSwitches.style.display = 'block';
    workspace.classList.add('free-mode');

    // Update mode buttons
    imageModeBtn.classList.remove('active');
    freeModeBtn.classList.add('active');

    // Stop timer if running
    stopTimer();

    // Reset switch counter and saved canvases
    state.switchCounter = 0;
    state.savedCanvases = [];
    updateSavedCount();

    // Resize canvas to fixed square size
    resizeCanvasForFreeMode();

    statusText.textContent = 'Free Mode: 外部ウィンドウを模写';
    imageCounter.textContent = '-- / --';

    // Update button label for Free Mode
    nextImageBtn.textContent = 'Next Canvas';

    // Update Next Image button state
    updateNextImageButtonState();
  } else {
    // Image mode: show folder/timer sections, show both panels
    folderSection.style.display = 'block';
    timerSection.style.display = 'block';
    freeModeMaxSwitches.style.display = 'none';
    workspace.classList.remove('free-mode');

    // Update mode buttons
    imageModeBtn.classList.add('active');
    freeModeBtn.classList.remove('active');

    // Reset switch counter and saved canvases
    state.switchCounter = 0;
    state.savedCanvases = [];
    updateSavedCount();

    // Resize canvas to match reference image
    if (state.images.length > 0) {
      resizeCanvas();
      statusText.textContent = `Loaded ${state.images.length} images`;
    } else {
      statusText.textContent = 'Select folders and load images to start';
    }

    // Update button label for Image Mode
    nextImageBtn.textContent = 'Next Image';

    // Update Next Image button state
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
      statusText.textContent = `最大切り替え数（${state.maxSwitches}）に到達しました`;
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
      statusText.textContent = '全ての画像を表示しました';
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
