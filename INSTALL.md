# Installing the Extension Locally

## The Problem

Chrome doesn't allow loading extensions with directories starting with `_` (like `__tests__`). This is why you see the error:

```
Cannot load extension with file or directory name __tests__
```

## The Solution

Use the **build script** to create a clean `dist/` folder with only the extension files (no tests, no docs).

---

## 🚀 Quick Start

### 1. Build the Extension

In your project directory, run:

```bash
npm run build
```

**Output:**
```
🏗️  Building extension...
✅ Copied file: manifest.json
✅ Copied file: popup.html
✅ Copied file: popup.js
✅ Copied directory: icons/

🎉 Build complete!
📁 Extension ready in: dist/
```

This creates a `dist/` folder with **only** the extension files:
```
dist/
├── manifest.json
├── popup.html
├── popup.js
└── icons/
```

### 2. Load in Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable **"Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Navigate to your project folder
6. Select the **`dist`** folder (NOT the root folder!)
7. Click "Select Folder"

**Done!** ✅ Extension now loaded in Chrome.

---

## 📁 What Gets Built

**Included in dist/:**
- ✅ `manifest.json` - Extension config
- ✅ `popup.html` - Extension UI
- ✅ `popup.js` - Extension logic
- ✅ `icons/` - Extension icons

**Excluded from dist/:**
- ❌ `__tests__/` - Test files (causes Chrome error)
- ❌ `node_modules/` - Dependencies (not needed)
- ❌ `*.md` - Documentation
- ❌ `package.json` - NPM config
- ❌ Other development files

---

## 🔄 After Making Changes

If you modify the extension code:

```bash
# 1. Make changes to popup.js, popup.html, etc.

# 2. Rebuild
npm run build

# 3. In Chrome, click the reload icon on your extension card
```

No need to re-load the extension, just click the reload ↻ icon!

---

## 🐛 Troubleshooting

### Error: "Cannot load extension with file or directory name __tests__"

**Solution:** You're loading the root folder. Load the `dist/` folder instead!

### Extension not updating after changes

**Solution:** Run `npm run build` again, then click reload in Chrome.

### dist/ folder doesn't exist

**Solution:** Run `npm run build` to create it.

---

## 📦 Building for Distribution

When you want to package the extension for the Chrome Web Store:

```bash
# 1. Build the extension
npm run build

# 2. Zip the dist folder
cd dist
zip -r ../extension.zip *
cd ..

# 3. Upload extension.zip to Chrome Web Store
```

---

## 🎯 Summary

**Remember:**
- ✅ **DO** load the `dist/` folder in Chrome
- ❌ **DON'T** load the root project folder

**Workflow:**
```bash
npm run build              # Build extension
# Load dist/ in Chrome
# Make changes
npm run build              # Rebuild
# Reload in Chrome
```

That's it! 🚀
