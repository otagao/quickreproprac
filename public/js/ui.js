import { state } from './state.js';
import { imageModeBtn, freeModeBtn, langToggleBtn, startTimerBtn, stopTimerBtn, nextImageBtn, penSizeSlider, penSizeValue, gridDivisionsInput, gridToggle, eraserBtn, penBtn, clearBtn, exportBtn } from './dom.js';
import { switchMode, nextImage } from './images.js';
import { startTimer, stopTimer } from './timer.js';
import { getGridDivisions, updateGridOverlays } from './grid.js';
import { clearCanvas, undo, redo, drawPenSizePreview } from './drawing.js';
import { handleExport } from './export.js';
import { updateTransformKey } from './transform.js';
import { getCurrentLang, setLanguage, t } from './i18n.js';
import { setColorPickerValue } from './colorpicker.js';

export function setupEventListeners() {
  // Mode switching
  imageModeBtn.addEventListener('click', () => switchMode('image'));
  freeModeBtn.addEventListener('click', () => switchMode('free'));
  langToggleBtn.addEventListener('click', () => {
    setLanguage(getCurrentLang() === 'ja' ? 'en' : 'ja');
  });

  startTimerBtn.addEventListener('click', startTimer);
  stopTimerBtn.addEventListener('click', stopTimer);
  nextImageBtn.addEventListener('click', nextImage);

  penSizeSlider.addEventListener('input', (e) => {
    state.penSize = parseInt(e.target.value);
    penSizeValue.textContent = state.penSize;
    // Update current preset with new size
    state.penPresets[state.currentPreset].size = state.penSize;
    updatePresetInfo(state.currentPreset);
    state.showPenSizePreview = true;
    drawPenSizePreview();
  });

  penSizeSlider.addEventListener('mouseup', () => {
    state.showPenSizePreview = false;
    drawPenSizePreview();
  });

  penSizeSlider.addEventListener('mouseleave', () => {
    state.showPenSizePreview = false;
    drawPenSizePreview();
  });

  gridDivisionsInput.addEventListener('input', () => {
    gridDivisionsInput.value = getGridDivisions();
    updateGridOverlays();
  });

  gridToggle.addEventListener('change', updateGridOverlays);

  eraserBtn.addEventListener('click', () => {
    state.currentTool = 'eraser';
    updateToolButtons();
  });

  penBtn.addEventListener('click', () => {
    state.currentTool = 'pen';
    updateToolButtons();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm(t('confirmClear'))) {
      clearCanvas();
    }
  });

  exportBtn.addEventListener('click', handleExport);

  // Preset buttons
  document.querySelectorAll('.btn-preset').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      switchPreset(index);
    });
  });

  // Keyboard shortcuts for undo/redo and presets
  document.addEventListener('keydown', (e) => {
    updateTransformKey(e, true);

    // Ctrl+Z or Cmd+Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for Redo
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    // Number keys 1, 2, 3 for presets (only if not in input field)
    else if (e.key === '1' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      switchPreset(0);
    }
    else if (e.key === '2' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      switchPreset(1);
    }
    else if (e.key === '3' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      switchPreset(2);
    }
  });

  document.addEventListener('keyup', (e) => {
    updateTransformKey(e, false);
  });
}

export function handlePenColorChange(hexColor) {
  state.penColor = hexColor;
  // Update current preset with new color
  state.penPresets[state.currentPreset].color = hexColor;
  updatePresetInfo(state.currentPreset);
  state.currentTool = 'pen';
  updateToolButtons();
}

export function updateToolButtons() {
  eraserBtn.classList.remove('active');
  penBtn.classList.remove('active');

  if (state.currentTool === 'eraser') {
    eraserBtn.classList.add('active');
  } else {
    penBtn.classList.add('active');
  }
}

export function switchPreset(presetIndex) {
  if (presetIndex < 0 || presetIndex >= state.penPresets.length) return;

  // Update current preset index
  state.currentPreset = presetIndex;

  // Load preset values
  const preset = state.penPresets[presetIndex];
  state.penColor = preset.color;
  state.penSize = preset.size;

  // Update UI elements
  setColorPickerValue(state.penColor);
  penSizeSlider.value = state.penSize;
  penSizeValue.textContent = state.penSize;

  // Update preset button active states
  document.querySelectorAll('.btn-preset').forEach((btn, idx) => {
    if (idx === presetIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Switch to pen tool
  state.currentTool = 'pen';
  updateToolButtons();
}

export function updatePresetInfo(presetIndex) {
  if (presetIndex < 0 || presetIndex >= state.penPresets.length) return;

  const preset = state.penPresets[presetIndex];
  const infoElement = document.getElementById(`presetInfo${presetIndex}`);

  if (infoElement) {
    infoElement.textContent = `${preset.color} / ${preset.size}px`;
  }
}
