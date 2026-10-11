# VoxelCraft 3D Studio - Variable Color Palette Voxel Engine

A modern, high-performance 3D Voxel Builder built with Three.js, Vanilla CSS Glassmorphism, and dynamic variable color palettes.

---

## 🚀 Live Local Server
The server is currently running in the background at:
**[http://localhost:8089/](http://localhost:8089/)**

You can also launch it manually anytime via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\start_server.ps1 -Port 8089
```

---

## 🎨 Key Features

### 1. Variable Color Palette System
- **Predefined Curated Palettes**:
  - 🌈 **Cyber Neon**: Electric cyan, magenta, violet, neon green, and amber.
  - 🌿 **Earth & Nature**: Organic moss, oak, stone, water, and foliage.
  - 🍬 **Pastel Dream**: Soft marshmallow pastel tones.
  - 🕹️ **Retro Pico-8**: Nostalgic 16-color retro game palette.
  - 🌋 **Magma & Ember**: Volcanic reds, oranges, and obsidian charcoals.
  - 🌆 **Synthwave 80s**: Deep purple, bright turquoise, hot pink.
  - 🪙 **Monochrome & Gold**: High-contrast minimal blacks, greys, and metallic gold.
- **Dynamic Swatch Editing**:
  - Click any color swatch to set as active.
  - Hover over a swatch to remove it with the `×` button.
  - Click **Add Swatch** to add the current custom color into the active palette.
  - Double-click or click the Active Color Badge to open the native color picker.
  - Click **Save As...** to preserve your custom palette in `localStorage`.
  - **Recent Colors Bar**: Tracks the last 8 colors used in the scene.

### 2. 3D Voxel Construction & Tooling
- **Build / Place (`B` / `1`)**: Click surface or ground plane to add voxels.
- **Paint / Recolor (`P` / `2`)**: Click an existing voxel to recolor to the active swatch.
- **Erase (`E` / `3` or Right-Click / Shift-Click)**: Remove clicked voxel.
- **Eyedropper / Picker (`I` / `4`)**: Sample color directly from any voxel in the scene.
- **Brush Sizing**: 1x1, 2x2, or 3x3 multi-voxel brush strokes.
- **Symmetry Modeling**:
  - `Off` (standard placement)
  - `X` axis mirror
  - `Z` axis mirror
  - `X+Z` dual quadrant symmetry (ideal for spaceships, mechs, towers, and characters)
- **Base Fill**: One-click generation of a 12x12 foundation floor.
- **Ghost Cursor Preview**: Real-time translucent voxel showing placement position and active color before clicking.

### 3. Viewport & Environment Controls
- **Camera Presets**: Isometric 3D, Top-Down, Front, and Side views.
- **OrbitControls**: Right-drag or middle-drag to rotate; mouse wheel to zoom; Shift+Right-drag to pan.
- **Auto-Rotate Turntable (`Space`)**: Smooth 360° showcase rotation.
- **5 Environment Backdrops**: Cyberpunk Studio, Obsidian Void, Warm Sunset Glow, Pastel Sky, and Minimal White.
- **Grid Plane Customization**: Toggle grid lines on/off (`G`), adjust plane dimensions from 10x10 to 40x40.
- **Soft Directional Shadows**: Real-time PCF soft shadow maps with toggle control.

### 4. Interactive Demos
One-click demo builds accessible from the top bar:
- 🤖 **Cyber Mech Robot**
- 🏰 **Floating Sky Castle**
- ⚔️ **Legendary Pixel Sword**
- 🏡 **Cozy Voxel Cottage**
- 🏎️ **Retro Arcade Racer**

### 5. Exporting & Project Storage
- **Wavefront .OBJ Export**: Universal 3D format with vertex colors, ready for Blender, Maya, Unity, or 3D printing.
- **Project .JSON Save & Load**: Preserves all voxel coordinates, colors, and active custom palettes.
- **PNG Snapshot**: High-resolution rendered screenshot with anti-aliasing and clean backdrop.

### 6. Interactive Sound Synthesis
- Built-in Web Audio API synthesizer for crisp tactile audio feedback on block placement, erasing, and painting. Mute/unmute anytime from the top bar.

---

## ⌨️ Hotkeys Reference
| Key | Action |
| --- | --- |
| `Left Click` | Place Voxel / Use Active Tool |
| `Right Click` / `Shift + Left Click` | Quick Erase Voxel |
| `Right Drag` / `Middle Drag` | Orbit / Rotate Camera |
| `Shift + Right Drag` | Pan Camera |
| `Mouse Scroll` | Zoom In / Out |
| `B` or `1` | Build / Place Tool |
| `P` or `2` | Paint / Recolor Tool |
| `E` or `3` | Erase Tool |
| `I` or `4` | Eyedropper Color Picker |
| `Ctrl + Z` | Undo Last Action |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo Action |
| `G` | Toggle Ground Grid Lines |
| `Space` | Toggle Turntable Auto-Rotate |
| `?` | Show Shortcuts Guide |
