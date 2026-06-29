const PRESET_COLORS = [
  '#000000', '#ffffff', '#202020', '#404040',
  '#808080', '#b0b0b0', '#ef4444', '#f97316',
  '#facc15', '#22c55e', '#14b8a6', '#3b82f6',
  '#6366f1', '#a855f7', '#ec4899', '#7f1d1d',
];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

let swatchEl = null;
let popoverEl = null;
let svCanvas = null;
let svCtx = null;
let svPointer = null;
let hueTrack = null;
let huePointer = null;
let hexInput = null;
let onChange = null;
let hsv = { h: 0, s: 0, v: 0 };
let currentHex = '#000000';

export function initColorPicker(triggerEl, onColorChange) {
  swatchEl = triggerEl;
  onChange = onColorChange;

  if (!swatchEl) return;

  createPopover();
  setColorPickerValue(currentHex);

  swatchEl.addEventListener('click', () => {
    if (popoverEl.classList.contains('is-open')) {
      closePopover();
    } else {
      openPopover();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!popoverEl.classList.contains('is-open')) return;
    if (popoverEl.contains(event.target) || swatchEl.contains(event.target)) return;
    closePopover();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopover();
  });
}

export function setColorPickerValue(hexColor) {
  const normalizedHex = normalizeHex(hexColor);
  if (!normalizedHex) return;

  currentHex = normalizedHex;
  hsv = hexToHsv(normalizedHex);
  syncControls(false);
}

function createPopover() {
  popoverEl = document.createElement('div');
  popoverEl.className = 'color-picker-popover';
  popoverEl.setAttribute('role', 'dialog');
  popoverEl.setAttribute('aria-label', 'Pen color picker');

  svCanvas = document.createElement('canvas');
  svCanvas.className = 'color-picker-sv';
  svCanvas.width = 220;
  svCanvas.height = 150;

  svPointer = document.createElement('div');
  svPointer.className = 'color-picker-sv-pointer';

  const svWrap = document.createElement('div');
  svWrap.className = 'color-picker-sv-wrap';
  svWrap.append(svCanvas, svPointer);

  hueTrack = document.createElement('div');
  hueTrack.className = 'color-picker-hue';
  huePointer = document.createElement('div');
  huePointer.className = 'color-picker-hue-pointer';
  hueTrack.append(huePointer);

  hexInput = document.createElement('input');
  hexInput.className = 'color-picker-hex';
  hexInput.type = 'text';
  hexInput.inputMode = 'text';
  hexInput.maxLength = 7;
  hexInput.spellcheck = false;
  hexInput.setAttribute('aria-label', 'HEX color');

  const presets = document.createElement('div');
  presets.className = 'color-picker-presets';
  PRESET_COLORS.forEach((hex) => {
    const button = document.createElement('button');
    button.className = 'color-picker-preset';
    button.type = 'button';
    button.style.setProperty('--preset-color', hex);
    button.setAttribute('aria-label', hex);
    button.addEventListener('click', () => commitHex(hex));
    presets.append(button);
  });

  popoverEl.append(svWrap, hueTrack, hexInput, presets);
  document.body.append(popoverEl);

  svCtx = svCanvas.getContext('2d');
  bindPointerDrag(svCanvas, updateSvFromPointer);
  bindPointerDrag(hueTrack, updateHueFromPointer);

  hexInput.addEventListener('input', () => {
    const normalizedHex = normalizeHex(hexInput.value);
    if (!normalizedHex) return;
    commitHex(normalizedHex);
  });
}

function openPopover() {
  positionPopover();
  popoverEl.classList.add('is-open');
  drawSvPlane();
}

function closePopover() {
  if (popoverEl) popoverEl.classList.remove('is-open');
}

function positionPopover() {
  const rect = swatchEl.getBoundingClientRect();
  const gap = 8;
  const width = 244;
  const left = Math.min(
    Math.max(8, rect.left),
    window.innerWidth - width - 8
  );
  const top = rect.bottom + gap;

  popoverEl.style.left = `${left + window.scrollX}px`;
  popoverEl.style.top = `${top + window.scrollY}px`;
}

function bindPointerDrag(target, handler) {
  target.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    target.setPointerCapture(event.pointerId);
    handler(event);
  });

  target.addEventListener('pointermove', (event) => {
    if (!target.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    handler(event);
  });

  target.addEventListener('pointerup', (event) => {
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  });
}

function updateSvFromPointer(event) {
  const rect = svCanvas.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width);
  const y = clamp(event.clientY - rect.top, 0, rect.height);

  hsv.s = rect.width === 0 ? 0 : x / rect.width;
  hsv.v = rect.height === 0 ? 0 : 1 - y / rect.height;
  commitHsv();
}

function updateHueFromPointer(event) {
  const rect = hueTrack.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width);

  hsv.h = rect.width === 0 ? 0 : (x / rect.width) * 360;
  commitHsv();
}

function commitHex(hexColor) {
  currentHex = normalizeHex(hexColor);
  hsv = hexToHsv(currentHex);
  syncControls(true);
}

function commitHsv() {
  currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  syncControls(true);
}

function syncControls(emitChange) {
  if (!swatchEl) return;

  swatchEl.style.setProperty('--selected-color', currentHex);
  swatchEl.setAttribute('aria-label', `ペンの色 ${currentHex}`);

  if (hexInput && document.activeElement !== hexInput) {
    hexInput.value = currentHex;
  }

  drawSvPlane();
  updatePointers();
  updatePresetSelection();

  if (emitChange && onChange) {
    onChange(currentHex);
  }
}

function drawSvPlane() {
  if (!svCtx) return;

  const { width, height } = svCanvas;
  svCtx.clearRect(0, 0, width, height);
  svCtx.fillStyle = hsvToHex(hsv.h, 1, 1);
  svCtx.fillRect(0, 0, width, height);

  const whiteGradient = svCtx.createLinearGradient(0, 0, width, 0);
  whiteGradient.addColorStop(0, '#ffffff');
  whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  svCtx.fillStyle = whiteGradient;
  svCtx.fillRect(0, 0, width, height);

  const blackGradient = svCtx.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  blackGradient.addColorStop(1, '#000000');
  svCtx.fillStyle = blackGradient;
  svCtx.fillRect(0, 0, width, height);
}

function updatePointers() {
  if (svPointer) {
    svPointer.style.left = `${hsv.s * 100}%`;
    svPointer.style.top = `${(1 - hsv.v) * 100}%`;
  }

  if (huePointer) {
    huePointer.style.left = `${(hsv.h / 360) * 100}%`;
  }
}

function updatePresetSelection() {
  if (!popoverEl) return;

  popoverEl.querySelectorAll('.color-picker-preset').forEach((button) => {
    button.classList.toggle(
      'is-selected',
      normalizeHex(button.style.getPropertyValue('--preset-color')) === currentHex
    );
  });
}

function normalizeHex(hexColor) {
  if (typeof hexColor !== 'string') return null;
  const trimmed = hexColor.trim();
  if (!HEX_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function hsvToHex(h, s, v) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs((normalizedHue / 60) % 2 - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (normalizedHue < 60) {
    r = c; g = x; b = 0;
  } else if (normalizedHue < 120) {
    r = x; g = c; b = 0;
  } else if (normalizedHue < 180) {
    r = 0; g = c; b = x;
  } else if (normalizedHue < 240) {
    r = 0; g = x; b = c;
  } else if (normalizedHue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

function hexToHsv(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: (h + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function rgbToHex(r, g, b) {
  return `#${toHexPair(r)}${toHexPair(g)}${toHexPair(b)}`;
}

function toHexPair(value) {
  return clamp(value, 0, 255).toString(16).padStart(2, '0');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
