export const state = {
  folders: [], selectedFolders: [], images: [], currentImageIndex: 0,
  timerInterval: null, remainingTime: 0, currentMode: 'image',
  savedCanvases: [], switchCounter: 0, maxSwitches: 10,
  isDrawing: false, currentTool: 'pen', penColor: '#000000', penSize: 3,
  showPenSizePreview: false,
  penPresets: [ {color:'#000000',size:3}, {color:'#808080',size:5}, {color:'#000000',size:2} ],
  currentPreset: 0,
  strokes: [], historyStack: [], redoStack: [], currentStroke: null,
  viewState: { scale:1, rotation:0, offsetX:0, offsetY:0, cropRect:null },
  keyState: { r:false, s:false, c:false, space:false },
  transformGesture: null
};
export const PMIN = 0.3;
