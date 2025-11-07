// Global state
let folders = [];
let selectedFolders = [];
let images = [];
let currentImageIndex = 0;
let timerInterval = null;
let remainingTime = 0;

// Canvas setup
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'pen';
let penColor = '#000000';
let penSize = 3;

// Undo/Redo state
let strokes = []; // All drawing strokes
let redoStack = []; // Undone strokes for redo
let currentStroke = null; // Current stroke being drawn

// DOM elements
const folderListEl = document.getElementById('folderList');
const loadImagesBtn = document.getElementById('loadImagesBtn');
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const nextImageBtn = document.getElementById('nextImageBtn');
const intervalInput = document.getElementById('intervalInput');
const colorPicker = document.getElementById('colorPicker');
const penSizeSlider = document.getElementById('penSizeSlider');
const penSizeValue = document.getElementById('penSizeValue');
const eraserBtn = document.getElementById('eraserBtn');
const penBtn = document.getElementById('penBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const imageCounter = document.getElementById('imageCounter');
const timerDisplay = document.getElementById('timerDisplay');
const referenceImage = document.getElementById('referenceImage');
const noImageText = document.getElementById('noImageText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFolders();
  setupCanvas();
  setupEventListeners();
});

// Load folders from server
async function loadFolders() {
  try {
    const response = await fetch('/api/folders');
    folders = await response.json();

    if (folders.length === 0) {
      folderListEl.innerHTML = '<p class="loading">No folders found. Create folders with images in the application directory.</p>';
    } else {
      folderListEl.innerHTML = '';
      folders.forEach(folder => {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.textContent = folder;
        folderItem.addEventListener('click', () => toggleFolderSelection(folder, folderItem));
        folderListEl.appendChild(folderItem);
      });
    }
  } catch (error) {
    console.error('Error loading folders:', error);
    folderListEl.innerHTML = '<p class="loading">Error loading folders</p>';
  }
}

// Toggle folder selection
function toggleFolderSelection(folder, element) {
  const index = selectedFolders.indexOf(folder);
  if (index > -1) {
    selectedFolders.splice(index, 1);
    element.classList.remove('selected');
  } else {
    selectedFolders.push(folder);
    element.classList.add('selected');
  }
}

// Load images from selected folders
async function loadImages() {
  if (selectedFolders.length === 0) {
    alert('Please select at least one folder');
    return;
  }

  try {
    const queryString = selectedFolders.join(',');
    const response = await fetch(`/api/images?folders=${encodeURIComponent(queryString)}`);
    images = await response.json();

    if (images.length === 0) {
      alert('No images found in selected folders');
      statusText.textContent = 'No images found';
      return;
    }

    // Shuffle images
    shuffleArray(images);
    currentImageIndex = 0;

    statusText.textContent = `Loaded ${images.length} images`;
    updateImageCounter();
    displayCurrentImage();
  } catch (error) {
    console.error('Error loading images:', error);
    alert('Error loading images');
  }
}

// Display current image
function displayCurrentImage() {
  if (images.length === 0) return;

  const imagePath = `/images/${images[currentImageIndex]}`;
  referenceImage.src = imagePath;
  referenceImage.style.display = 'block';
  noImageText.style.display = 'none';

  // Wait for image to load to get its aspect ratio
  referenceImage.onload = () => {
    resizeCanvas();
  };

  updateImageCounter();
}

// Resize canvas to match reference image aspect ratio
function resizeCanvas() {
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

  // Set canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Redraw canvas with existing strokes
  redrawCanvas();
}

// Next image
function nextImage() {
  if (images.length === 0) return;

  currentImageIndex = (currentImageIndex + 1) % images.length;
  displayCurrentImage();

  // Clear canvas when switching images
  clearCanvas();
}

// Start auto timer
function startTimer() {
  stopTimer(); // Stop any existing timer

  const interval = parseInt(intervalInput.value);
  if (isNaN(interval) || interval < 1) {
    alert('Please enter a valid interval (minimum 1 second)');
    return;
  }

  if (images.length === 0) {
    alert('Please load images first');
    return;
  }

  remainingTime = interval;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
      nextImage();
      remainingTime = interval;
    }
  }, 1000);

  statusText.textContent = 'Auto-switch active';
  startTimerBtn.disabled = true;
}

// Stop timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    statusText.textContent = 'Auto-switch stopped';
    startTimerBtn.disabled = false;
  }
  timerDisplay.textContent = '--:--';
}

// Update timer display
function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update image counter
function updateImageCounter() {
  if (images.length > 0) {
    imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
  } else {
    imageCounter.textContent = '0 / 0';
  }
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Setup canvas
function setupCanvas() {
  resizeCanvas();

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Drawing events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch events for tablets
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  });
}

// Start drawing
function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Start a new stroke
  currentStroke = {
    points: [{x, y}],
    color: penColor,
    size: penSize,
    tool: currentTool
  };

  ctx.beginPath();
  ctx.moveTo(x, y);
}

// Draw
function draw(e) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Add point to current stroke
  if (currentStroke) {
    currentStroke.points.push({x, y});
  }

  ctx.lineTo(x, y);
  ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : penColor;
  ctx.lineWidth = penSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Stop drawing
function stopDrawing() {
  if (isDrawing && currentStroke && currentStroke.points.length > 0) {
    // Save the stroke to history
    strokes.push(currentStroke);
    // Clear redo stack when new stroke is added
    redoStack = [];
    currentStroke = null;
  }
  isDrawing = false;
  ctx.beginPath();
}

// Clear canvas
function clearCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Clear stroke history
  strokes = [];
  redoStack = [];
  currentStroke = null;
}

// Undo last stroke
function undo() {
  if (strokes.length === 0) return;

  // Move last stroke to redo stack
  const lastStroke = strokes.pop();
  redoStack.push(lastStroke);

  // Redraw canvas
  redrawCanvas();
}

// Redo last undone stroke
function redo() {
  if (redoStack.length === 0) return;

  // Move stroke from redo stack back to strokes
  const stroke = redoStack.pop();
  strokes.push(stroke);

  // Redraw canvas
  redrawCanvas();
}

// Redraw all strokes on canvas
function redrawCanvas() {
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Redraw all strokes
  strokes.forEach(stroke => {
    if (stroke.points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  });
}

// Setup event listeners
function setupEventListeners() {
  loadImagesBtn.addEventListener('click', loadImages);
  startTimerBtn.addEventListener('click', startTimer);
  stopTimerBtn.addEventListener('click', stopTimer);
  nextImageBtn.addEventListener('click', nextImage);

  colorPicker.addEventListener('change', (e) => {
    penColor = e.target.value;
    currentTool = 'pen';
    updateToolButtons();
  });

  penSizeSlider.addEventListener('input', (e) => {
    penSize = parseInt(e.target.value);
    penSizeValue.textContent = penSize;
  });

  eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    updateToolButtons();
  });

  penBtn.addEventListener('click', () => {
    currentTool = 'pen';
    updateToolButtons();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      clearCanvas();
    }
  });

  // Keyboard shortcuts for undo/redo
  document.addEventListener('keydown', (e) => {
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
  });
}

// Update tool buttons
function updateToolButtons() {
  eraserBtn.classList.remove('active');
  penBtn.classList.remove('active');

  if (currentTool === 'eraser') {
    eraserBtn.classList.add('active');
  } else {
    penBtn.classList.add('active');
  }
}
