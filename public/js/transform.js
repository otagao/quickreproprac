import { state } from './state.js';
import { canvas, ctx, referenceImage, imageContainer } from './dom.js';
import { clamp } from './utils.js';
import { redrawCanvas } from './drawing.js';
import { updateGridOverlays } from './grid.js';
import { updateNextImageButtonState } from './images.js';

let cropOverlay = null;

export function cloneViewState(src = state.viewState) {
  return structuredClone(src);
}

export function resetViewState() {
  state.viewState = {
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    cropRect: null
  };
}

export function applyCanvasViewTransform() {
  // The visible view transform is applied to the canvas element itself so the
  // white canvas frame, grid and strokes share exactly one transform.
}

export function getActiveCanvasCropRect() {
  if (state.transformGesture?.mode === 'crop') {
    return state.transformGesture.startViewState.cropRect;
  }

  return state.viewState.cropRect;
}

export function isPointInActiveCrop(x, y) {
  const cr = state.viewState.cropRect;
  if (!cr) return true;

  const left = cr.x * canvas.width;
  const top = cr.y * canvas.height;
  const right = (cr.x + cr.w) * canvas.width;
  const bottom = (cr.y + cr.h) * canvas.height;

  return x >= left && x <= right && y >= top && y <= bottom;
}

export function applyCropClip() {
  const cr = getActiveCanvasCropRect();
  if (!cr) return;

  ctx.beginPath();
  ctx.rect(cr.x * canvas.width, cr.y * canvas.height, cr.w * canvas.width, cr.h * canvas.height);
  ctx.clip();
}

export function inverseViewTransform(xd, yd) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const offPxX = state.viewState.offsetX * w;
  const offPxY = state.viewState.offsetY * h;
  const scale = state.viewState.scale || 1;
  const r = state.viewState.rotation;
  const ux = (xd - cx - offPxX) / scale;
  const uy = (yd - cy - offPxY) / scale;
  const cos = Math.cos(r);
  const sin = Math.sin(r);

  return {
    x: cx + ux * cos + uy * sin,
    y: cy - ux * sin + uy * cos
  };
}

export function getBaseCoordinates(e) {
  return getCanvasPointFromClient(e.clientX, e.clientY);
}

export function getViewTransformCss() {
  return `translate(${state.viewState.offsetX * 100}%, ${state.viewState.offsetY * 100}%) rotate(${state.viewState.rotation}rad) scale(${state.viewState.scale})`;
}

export function getCropClipPath(cropRect = state.viewState.cropRect) {
  const cr = cropRect;
  return cr
    ? `inset(${cr.y * 100}% ${(1 - (cr.x + cr.w)) * 100}% ${(1 - (cr.y + cr.h)) * 100}% ${cr.x * 100}%)`
    : 'none';
}

export function applyViewTransformToElement(el, { clip = true } = {}) {
  if (!el) return;
  el.style.transformOrigin = 'center center';
  el.style.transform = getViewTransformCss();
  if (clip) {
    const cropRect = el === canvas ? getActiveCanvasCropRect() : state.viewState.cropRect;
    el.style.clipPath = getCropClipPath(cropRect);
  }
}

export function applyReferenceTransform() {
  applyViewTransformToElement(referenceImage);
  applyViewTransformToElement(canvas);
  updateCropOverlay();
}

export function isTransformKeyActive() {
  return state.keyState.r || state.keyState.s || state.keyState.c || state.keyState.space;
}

export function getTransformMode() {
  if (state.keyState.c) return 'crop';
  if (state.keyState.space) return 'move';
  if (state.keyState.r) return 'rotate';
  if (state.keyState.s) return 'scale';
  return null;
}

export function updateTransformKey(e, isDown) {
  if (e.target.matches('input, textarea')) return false;

  const key = e.key.toLowerCase();
  let handled = true;

  if (key === 'r') {
    state.keyState.r = isDown;
  } else if (key === 's') {
    state.keyState.s = isDown;
  } else if (key === 'c') {
    state.keyState.c = isDown;
    updateCropOverlay();
  } else if (e.key === ' ') {
    state.keyState.space = isDown;
    e.preventDefault();
  } else {
    handled = false;
  }

  return handled;
}

export function getCropSurfaceRect(surface) {
  if (surface === imageContainer && referenceImage.style.display !== 'none') {
    return referenceImage.getBoundingClientRect();
  }

  return surface.getBoundingClientRect();
}

export function getUntransformedElementRect(el) {
  const previousTransform = el.style.transform;
  const previousClipPath = el.style.clipPath;
  el.style.transform = 'none';
  el.style.clipPath = 'none';
  const rect = el.getBoundingClientRect();
  el.style.transform = previousTransform;
  el.style.clipPath = previousClipPath;
  return rect;
}

export function getViewTargetForSurface(surface) {
  if (surface === imageContainer && referenceImage.style.display !== 'none') {
    return referenceImage;
  }
  if (surface === imageContainer) return null;
  return surface;
}

export function clientPointToElementLocal(el, clientX, clientY) {
  if (!el) return null;
  const rect = getUntransformedElementRect(el);
  if (rect.width === 0 || rect.height === 0) return null;

  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const offPxX = state.viewState.offsetX * rect.width;
  const offPxY = state.viewState.offsetY * rect.height;
  const scale = state.viewState.scale || 1;
  const r = state.viewState.rotation;
  const dx = clientX - rect.left - cx - offPxX;
  const dy = clientY - rect.top - cy - offPxY;
  const ux = dx / scale;
  const uy = dy / scale;
  const cos = Math.cos(r);
  const sin = Math.sin(r);

  return {
    x: cx + ux * cos + uy * sin,
    y: cy - ux * sin + uy * cos,
    rect
  };
}

export function getCanvasPointFromClient(clientX, clientY) {
  const local = clientPointToElementLocal(canvas, clientX, clientY);
  if (!local) return {x: 0, y: 0};

  return {
    x: local.x * canvas.width / local.rect.width,
    y: local.y * canvas.height / local.rect.height
  };
}

export function clientPointToNormalizedView(el, clientX, clientY) {
  const local = clientPointToElementLocal(el, clientX, clientY);
  if (!local) return null;

  return {
    x: clamp(local.x / local.rect.width, 0, 1),
    y: clamp(local.y / local.rect.height, 0, 1)
  };
}

export function getNormalizedCropRect(surface, startClientX, startClientY, endClientX, endClientY) {
  const target = getViewTargetForSurface(surface);
  const start = clientPointToNormalizedView(target, startClientX, startClientY);
  const end = clientPointToNormalizedView(target, endClientX, endClientY);
  if (!start || !end) return null;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);

  if (w === 0 || h === 0) return null;
  return {x, y, w, h};
}

function ensureCropOverlay() {
  if (cropOverlay || !imageContainer) return cropOverlay;

  cropOverlay = document.createElement('div');
  cropOverlay.className = 'crop-dim-overlay';
  for (let i = 0; i < 4; i++) {
    const part = document.createElement('div');
    part.className = 'crop-dim-part';
    cropOverlay.appendChild(part);
  }
  imageContainer.appendChild(cropOverlay);
  return cropOverlay;
}

export function updateCropOverlay() {
  if (!imageContainer) return;
  const overlay = ensureCropOverlay();
  const cr = state.viewState.cropRect;
  const shouldShow = Boolean(cr && referenceImage.style.display !== 'none');

  if (!shouldShow) {
    overlay.style.display = 'none';
    return;
  }

  const rect = getUntransformedElementRect(referenceImage);
  const containerRect = imageContainer.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.left = `${rect.left - containerRect.left}px`;
  overlay.style.top = `${rect.top - containerRect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  applyViewTransformToElement(overlay, { clip: false });

  const [top, left, right, bottom] = overlay.children;
  top.style.left = '0';
  top.style.top = '0';
  top.style.width = '100%';
  top.style.height = `${cr.y * 100}%`;

  left.style.left = '0';
  left.style.top = `${cr.y * 100}%`;
  left.style.width = `${cr.x * 100}%`;
  left.style.height = `${cr.h * 100}%`;

  right.style.left = `${(cr.x + cr.w) * 100}%`;
  right.style.top = `${cr.y * 100}%`;
  right.style.width = `${(1 - cr.x - cr.w) * 100}%`;
  right.style.height = `${cr.h * 100}%`;

  bottom.style.left = '0';
  bottom.style.top = `${(cr.y + cr.h) * 100}%`;
  bottom.style.width = '100%';
  bottom.style.height = `${(1 - cr.y - cr.h) * 100}%`;
}

export function recenterViewOnCrop(cropRect) {
  if (!cropRect) return;
  const dx = (cropRect.x + cropRect.w / 2 - 0.5) * canvas.width;
  const dy = (cropRect.y + cropRect.h / 2 - 0.5) * canvas.height;
  const scale = state.viewState.scale || 1;
  const cos = Math.cos(state.viewState.rotation);
  const sin = Math.sin(state.viewState.rotation);
  const transformedDx = scale * (dx * cos - dy * sin);
  const transformedDy = scale * (dx * sin + dy * cos);

  state.viewState.offsetX -= transformedDx / Math.max(canvas.width, 1);
  state.viewState.offsetY -= transformedDy / Math.max(canvas.height, 1);
}

export function beginTransformGesture(e, surface, forcedMode = null) {
  const mode = forcedMode || getTransformMode();
  if (!mode || state.transformGesture) return false;

  e.preventDefault();
  surface.setPointerCapture(e.pointerId);
  state.transformGesture = {
    pointerId: e.pointerId,
    mode,
    surface,
    startClientX: e.clientX,
    startClientY: e.clientY,
    startViewState: cloneViewState(),
    before: cloneViewState()
  };

  if (mode === 'crop') {
    state.viewState.cropRect = null;
    applyViewChange();
  }

  return true;
}

export function updateTransformGesture(e) {
  if (!state.transformGesture || e.pointerId !== state.transformGesture.pointerId) return;

  e.preventDefault();
  const gesture = state.transformGesture;
  const dx = e.clientX - gesture.startClientX;
  const dy = e.clientY - gesture.startClientY;
  const start = gesture.startViewState;

  if (gesture.mode === 'rotate') {
    state.viewState.rotation = start.rotation + dx * 0.005;
  } else if (gesture.mode === 'scale') {
    state.viewState.scale = clamp(start.scale * (1 - dy * 0.003), 0.1, 10);
  } else if (gesture.mode === 'move') {
    state.viewState.offsetX = start.offsetX + dx / Math.max(canvas.width, 1);
    state.viewState.offsetY = start.offsetY + dy / Math.max(canvas.height, 1);
  } else if (gesture.mode === 'crop') {
    state.viewState.cropRect = getNormalizedCropRect(
      gesture.surface,
      gesture.startClientX,
      gesture.startClientY,
      e.clientX,
      e.clientY
    );
  }

  applyViewChange();
}

export function endTransformGesture(e) {
  if (!state.transformGesture || e.pointerId !== state.transformGesture.pointerId) return;

  e.preventDefault();
  const gesture = state.transformGesture;
  const dx = e.clientX - gesture.startClientX;
  const dy = e.clientY - gesture.startClientY;

  if (gesture.mode === 'crop' && Math.hypot(dx, dy) < 3) {
    state.viewState.cropRect = null;
    applyViewChange();
  } else if (gesture.mode === 'crop' && state.viewState.cropRect) {
    recenterViewOnCrop(state.viewState.cropRect);
    applyViewChange();
  }

  const after = cloneViewState();
  if (JSON.stringify(gesture.before) !== JSON.stringify(after)) {
    state.historyStack.push({type: 'view', before: gesture.before, after});
    state.redoStack = [];
    updateNextImageButtonState();
  }

  if (gesture.surface.hasPointerCapture(e.pointerId)) {
    gesture.surface.releasePointerCapture(e.pointerId);
  }
  state.transformGesture = null;
  if (gesture.mode === 'crop') {
    applyViewChange();
  } else {
    updateCropOverlay();
  }
}

export function applyViewChange() {
  applyReferenceTransform();
  redrawCanvas();
  updateGridOverlays();
}
