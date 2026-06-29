import { loadFolders } from './folders.js';
import { setupCanvas } from './drawing.js';
import { setupEventListeners } from './ui.js';
import { updateNextImageButtonState } from './images.js';

document.addEventListener('DOMContentLoaded', () => {
  loadFolders();
  setupCanvas();
  setupEventListeners();
  // Initialize Next Image button state
  updateNextImageButtonState();
});
