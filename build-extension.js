/**
 * Build script for Chrome extension
 * Copies only extension files (not tests/docs) to dist/ folder
 */

const fs = require('fs');
const path = require('path');

// Files and directories to include in the extension
const includeFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'icons'
];

const distDir = path.join(__dirname, 'dist');

// Create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

console.log('🏗️  Building extension...');

// Copy files
includeFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Warning: ${file} not found, skipping...`);
    return;
  }

  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    // Copy directory recursively
    copyDirectory(sourcePath, destPath);
    console.log(`✅ Copied directory: ${file}/`);
  } else {
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied file: ${file}`);
  }
});

console.log('');
console.log('🎉 Build complete!');
console.log('📁 Extension ready in: dist/');
console.log('');
console.log('To load in Chrome:');
console.log('1. Go to chrome://extensions');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the "dist" folder');

function copyDirectory(source, destination) {
  // Create destination directory
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read directory contents
  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}
