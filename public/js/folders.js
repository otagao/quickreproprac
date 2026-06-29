import { state } from './state.js';
import { folderListEl, statusText } from './dom.js';
import { shuffleArray } from './utils.js';
import { displayCurrentImage, updateImageCounter } from './images.js';

export async function loadFolders() {
  try {
    const response = await fetch('/api/folders');
    state.folders = await response.json();

    if (state.folders.length === 0) {
      folderListEl.innerHTML = '<p class="loading">No folders found. Create folders with images in the application directory.</p>';
    } else {
      folderListEl.innerHTML = '';
      state.folders.forEach(folder => {
        const folderElement = createFolderElement(folder, 0);
        folderListEl.appendChild(folderElement);
      });
    }
  } catch (error) {
    console.error('Error loading folders:', error);
    folderListEl.innerHTML = '<p class="loading">Error loading folders</p>';
  }
}

export function createFolderElement(folderObj, depth) {
  const container = document.createElement('div');
  container.className = 'folder-container';
  container.style.marginLeft = `${depth * 20}px`;

  const folderItem = document.createElement('div');
  folderItem.className = 'folder-item';

  // Add expand/collapse icon if folder has children
  if (folderObj.children && folderObj.children.length > 0) {
    const expandIcon = document.createElement('span');
    expandIcon.className = 'expand-icon';
    expandIcon.textContent = '▶';
    folderItem.appendChild(expandIcon);
  }

  const nameSpan = document.createElement('span');
  nameSpan.textContent = folderObj.name;
  folderItem.appendChild(nameSpan);

  // Click handler for selection
  folderItem.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFolderSelection(folderObj.path, folderItem);
  });

  container.appendChild(folderItem);

  // Add children if they exist
  if (folderObj.children && folderObj.children.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'folder-children';
    childrenContainer.style.display = 'none';

    folderObj.children.forEach(child => {
      const childElement = createFolderElement(child, depth + 1);
      childrenContainer.appendChild(childElement);
    });

    container.appendChild(childrenContainer);

    // Click handler for expand/collapse
    const expandIcon = folderItem.querySelector('.expand-icon');
    if (expandIcon) {
      expandIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = childrenContainer.style.display === 'block';
        childrenContainer.style.display = isExpanded ? 'none' : 'block';
        expandIcon.textContent = isExpanded ? '▶' : '▼';
      });
    }
  }

  return container;
}

export function toggleFolderSelection(folderPath, element) {
  const index = state.selectedFolders.indexOf(folderPath);
  if (index > -1) {
    state.selectedFolders.splice(index, 1);
    element.classList.remove('selected');
  } else {
    state.selectedFolders.push(folderPath);
    element.classList.add('selected');
  }
}

export async function loadImages() {
  if (state.selectedFolders.length === 0) {
    alert('Please select at least one folder');
    return;
  }

  try {
    const queryString = state.selectedFolders.join(',');
    const response = await fetch(`/api/images?folders=${encodeURIComponent(queryString)}`);
    state.images = await response.json();

    if (state.images.length === 0) {
      alert('No images found in selected folders');
      statusText.textContent = 'No images found';
      return;
    }

    // Shuffle state.images
    shuffleArray(state.images);
    state.currentImageIndex = 0;

    statusText.textContent = `Loaded ${state.images.length} images`;
    updateImageCounter();
    displayCurrentImage();
  } catch (error) {
    console.error('Error loading images:', error);
    alert('Error loading images');
  }
}
