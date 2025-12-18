const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Serve images from the application directory
app.use('/images', express.static('.'));

// Recursively get folder structure
function getFolderStructure(dir, basePath = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const folders = [];

  items.forEach(item => {
    if (!item.isDirectory() || item.name.startsWith('.')) return;

    const fullPath = path.join(basePath, item.name);
    const itemPath = path.join(dir, item.name);

    const folderObj = {
      name: item.name,
      path: fullPath,
      children: getFolderStructure(itemPath, fullPath)
    };

    folders.push(folderObj);
  });

  return folders.sort((a, b) => a.name.localeCompare(b.name));
}

// Get hierarchical folder structure
app.get('/api/folders', (req, res) => {
  const currentDir = process.cwd();

  try {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    const rootFolders = [];

    items.forEach(item => {
      if (!item.isDirectory() || item.name.startsWith('.') ||
          item.name === 'node_modules' || item.name === 'public') {
        return;
      }

      const itemPath = path.join(currentDir, item.name);
      const folderObj = {
        name: item.name,
        path: item.name,
        children: getFolderStructure(itemPath, item.name)
      };

      rootFolders.push(folderObj);
    });

    res.json(rootFolders.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('Error reading folders:', error);
    res.status(500).json({ error: 'Failed to read folders' });
  }
});

// Get list of images from selected folders
app.get('/api/images', (req, res) => {
  const folders = req.query.folders ? req.query.folders.split(',') : [];
  const currentDir = process.cwd();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

  let allImages = [];

  try {
    folders.forEach(folder => {
      const folderPath = path.join(currentDir, folder);

      if (!fs.existsSync(folderPath)) {
        return;
      }

      // Recursively get all image files
      const getImagesRecursive = (dir, basePath = '') => {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        items.forEach(item => {
          const itemPath = path.join(dir, item.name);
          const relativePath = path.join(basePath, item.name);

          if (item.isDirectory() && !item.name.startsWith('.')) {
            getImagesRecursive(itemPath, relativePath);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (imageExtensions.includes(ext)) {
              allImages.push(path.join(folder, relativePath).replace(/\\/g, '/'));
            }
          }
        });
      };

      getImagesRecursive(folderPath);
    });

    // Remove duplicates using Set
    const uniqueImages = [...new Set(allImages)];

    res.json(uniqueImages);
  } catch (error) {
    console.error('Error reading images:', error);
    res.status(500).json({ error: 'Failed to read images' });
  }
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Sketch Practice Tool Server`);
  console.log(`========================================`);
  console.log(`Server is running at: http://localhost:${PORT}`);
  console.log(`Open your browser and navigate to the URL above.`);
  console.log(`\nPlace your reference images in folders within this directory.`);
  console.log(`Press Ctrl+C to stop the server.`);
  console.log(`========================================\n`);
});
