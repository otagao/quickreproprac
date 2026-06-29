import { loadFolders } from './folders.js';
import { setupCanvas } from './drawing.js';
import { handlePenColorChange, setupEventListeners } from './ui.js';
import { updateNextImageButtonState } from './images.js';
import { getCurrentLang, setLanguage } from './i18n.js';
import { colorPickerSwatch } from './dom.js';
import { initColorPicker } from './colorpicker.js';

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(getCurrentLang());
  loadFolders();
  setupCanvas();
  initColorPicker(colorPickerSwatch, handlePenColorChange);
  setupEventListeners();
  // Initialize Next Image button state
  updateNextImageButtonState();
});
