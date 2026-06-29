import { state } from './state.js';
import { canvas, ctx, referenceImage, imageContainer } from './dom.js';
import { clamp } from './utils.js';
import { getCanvasCoordinates, redrawCanvas } from './drawing.js';
import { updateGridOverlays } from './grid.js';
import { updateNextImageButtonState } from './images.js';

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
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const offPxX = state.viewState.offsetX * w;
  const offPxY = state.viewState.offsetY * h;

  ctx.translate(cx + offPxX, cy + offPxY);
  ctx.rotate(state.viewState.rotation);
  ctx.scale(state.viewState.scale, state.viewState.scale);
  ctx.translate(-cx, -cy);
}

export function applyCropClip() {
  const cr = state.viewState.cropRect;
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
  const {x, y} = getCanvasCoordinates(e);
  return inverseViewTransform(x, y);
}

export function applyViewTransformToElement(el) {
  if (!el) return;
  const cr = state.viewState.cropRect;
  el.style.transformOrigin = 'center center';
  el.style.transform =
    `translate(${state.viewState.offsetX * 100}%, ${state.viewState.offsetY * 100}%) rotate(${state.viewState.rotation}rad) scale(${state.viewState.scale})`;
  el.style.clipPath = cr
    ? `inset(${cr.y * 100}% ${(1 - (cr.x + cr.w)) * 100}% ${(1 - (cr.y + cr.h)) * 100}% ${cr.x * 100}%)`
    : 'none';
}

export function applyReferenceTransform() {
  applyViewTransformToElement(referenceImage);
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

export function getNormalizedCropRect(surface, startClientX, startClientY, endClientX, endClientY) {
  const rect = getCropSurfaceRect(surface);
  if (rect.width === 0 || rect.height === 0) return null;

  const left = clamp(Math.min(startClientX, endClientX), rect.left, rect.right);
  const right = clamp(Math.max(startClientX, endClientX), rect.left, rect.right);
  const top = clamp(Math.min(startClientY, endClientY), rect.top, rect.bottom);
  const bottom = clamp(Math.max(startClientY, endClientY), rect.top, rect.bottom);
  const x = (left - rect.left) / rect.width;
  const y = (top - rect.top) / rect.height;
  const w = (right - left) / rect.width;
  const h = (bottom - top) / rect.height;

  if (w === 0 || h === 0) return null;
  return {x, y, w, h};
}

export function beginTransformGesture(e, surface) {
  const mode = getTransformMode();
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
}

export function applyViewChange() {
  applyReferenceTransform();
  redrawCanvas();
  updateGridOverlays();
}
