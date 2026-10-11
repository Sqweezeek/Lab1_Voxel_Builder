/**
 * VoxelCraft 3D Studio - Core Application Logic
 * High-performance 3D Voxel Builder with Variable Color Palette System
 */

(function () {
  'use strict';

  // ============================================================================
  // Preset Palettes & State
  // ============================================================================
  const PALETTES = {
    cyberpunk: [
      '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185',
      '#22d3ee', '#34d399', '#facc15', '#fb923c', '#e11d48',
      '#0284c7', '#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706'
    ],
    nature: [
      '#15803d', '#22c55e', '#86efac', '#166534', '#a16207',
      '#ca8a04', '#fef08a', '#78350f', '#92400e', '#b45309',
      '#0284c7', '#38bdf8', '#bae6fd', '#475569', '#94a3b8', '#f8fafc'
    ],
    pastel: [
      '#fbcfe8', '#f472b6', '#f5d0fe', '#c084fc', '#c7d2fe',
      '#818cf8', '#bae6fd', '#38bdf8', '#a7f3d0', '#34d399',
      '#fef08a', '#fde047', '#fed7aa', '#fb923c', '#fecdd3', '#fda4af'
    ],
    pico8: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236',
      '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300',
      '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],
    magma: [
      '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626',
      '#ef4444', '#f87171', '#ea580c', '#f97316', '#fb923c',
      '#d97706', '#f59e0b', '#fbbf24', '#fef08a', '#1c1917', '#292524'
    ],
    synthwave: [
      '#241734', '#2e2157', '#fd3a69', '#fecd1a', '#00f0ff',
      '#ff007f', '#7928ca', '#9b5de5', '#f15bb5', '#fee440',
      '#00bbf9', '#00f5d4', '#ffffff', '#18002e', '#ff3864', '#2de2e6'
    ],
    monochrome: [
      '#000000', '#111827', '#1f2937', '#374151', '#4b5563',
      '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6',
      '#ffffff', '#eab308', '#ca8a04', '#a16207', '#e2e8f0', '#64748b'
    ],
    custom: []
  };

  // Environment Themes
  const ENVIRONMENTS = {
    cyberpunk: { bg: 0x090b10, ground: 0x121729, grid: 0x223055, gridSub: 0x161d36, light: 0xecfeff, fill: 0x818cf8 },
    minimalist: { bg: 0x040508, ground: 0x0d0f15, grid: 0x242838, gridSub: 0x12151e, light: 0xffffff, fill: 0x64748b },
    sunset: { bg: 0x1a0f1d, ground: 0x2d1728, grid: 0x7c2d58, gridSub: 0x481938, light: 0xfef08a, fill: 0xf43f5e },
    pastel: { bg: 0x181c2b, ground: 0x222a42, grid: 0x6366f1, gridSub: 0x333d60, light: 0xffffff, fill: 0x38bdf8 },
    clean: { bg: 0xdce2ec, ground: 0xedf2f7, grid: 0x94a3b8, gridSub: 0xcbd5e1, light: 0xffffff, fill: 0x94a3b8 }
  };

  // State Container
  const state = {
    tool: 'place',             // 'place', 'paint', 'erase', 'picker'
    brushSize: 1,             // 1, 2, 3
    symmetry: 'none',         // 'none', 'x', 'z', 'xz'
    activePaletteName: 'cyberpunk',
    activeColor: '#38bdf8',
    recentColors: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'],
    customPalettes: {},
    gridSize: 20,
    showGrid: true,
    showShadows: true,
    autoRotate: false,
    audioEnabled: true,
    envTheme: 'cyberpunk',
    undoStack: [],
    redoStack: [],
    maxHistory: 50
  };

  function normalizeHex6(hex) {
    if (!hex) return '#38bdf8';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return '#' + hex.toLowerCase();
  }

  // Sound Synthesizer via Web Audio API
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    play(type) {
      if (!state.audioEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'place') {
        // Crisp wooden/plastic tap
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'erase') {
        // Whoosh pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'paint') {
        // Melodic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'pick') {
        // Double blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    }
  }

  const sfx = new SoundFX();

  // ============================================================================
  // Three.js Scene, Camera, Lights, Grid
  // ============================================================================
  let scene, camera, renderer, controls;
  let groundPlane, gridHelper;
  let dirLight, fillLight, hemiLight, ambientLight;
  let previewGroup, previewMesh;
  const sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const materialCache = new Map(); // colorHex -> THREE.MeshStandardMaterial

  // Voxel storage: key -> { x, y, z, color, mesh }
  const voxels = new Map();

  function getVoxelKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  function getMaterial(colorHex) {
    if (!materialCache.has(colorHex)) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.35,
        metalness: 0.1,
        flatShading: true
      });
      materialCache.set(colorHex, mat);
    }
    return materialCache.get(colorHex);
  }

  function initThree() {
    const container = document.getElementById('canvas-container');
    const canvas = document.getElementById('voxel-canvas');

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(ENVIRONMENTS.cyberpunk.bg);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(22, 20, 26);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep slightly above ground
    controls.minDistance = 3;
    controls.maxDistance = 120;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.8;

    // 5. Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x181a28, 0.45);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(20, 35, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    fillLight = new THREE.DirectionalLight(0x818cf8, 0.4);
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);

    // 6. Ground & Grid
    createGroundAndGrid();

    // 7. Preview Ghost Cursor Mesh
    createPreviewCursor();

    // Window Resize Handler
    window.addEventListener('resize', onWindowResize);

    // Start Render Loop
    animate();
  }

  function createGroundAndGrid() {
    if (groundPlane) scene.remove(groundPlane);
    if (gridHelper) scene.remove(gridHelper);

    const size = state.gridSize;
    const env = ENVIRONMENTS[state.envTheme] || ENVIRONMENTS.cyberpunk;

    // Ground plane for raycasting and shadow catching
    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshStandardMaterial({
      color: env.ground,
      roughness: 0.85,
      metalness: 0.05
    });
    groundPlane = new THREE.Mesh(planeGeo, planeMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.5;
    groundPlane.receiveShadow = true;
    groundPlane.name = 'GroundPlane';
    scene.add(groundPlane);

    // Grid lines
    gridHelper = new THREE.GridHelper(size, size, env.grid, env.gridSub);
    gridHelper.position.y = -0.49;
    gridHelper.visible = state.showGrid;
    scene.add(gridHelper);
  }

  function createPreviewCursor() {
    previewGroup = new THREE.Group();
    previewGroup.visible = false;

    const ghostGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const ghostMat = new THREE.MeshStandardMaterial({
      color: state.activeColor,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2,
      wireframe: false
    });
    previewMesh = new THREE.Mesh(ghostGeo, ghostMat);

    // Add glowing wireframe edges
    const wireGeo = new THREE.EdgesGeometry(ghostGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);

    previewGroup.add(previewMesh);
    previewGroup.add(wireMesh);
    scene.add(previewGroup);
  }

  function updatePreviewCursorColor() {
    if (!previewMesh) return;
    if (state.tool === 'erase') {
      previewMesh.material.color.set(0xf43f5e);
      previewMesh.material.opacity = 0.65;
    } else {
      previewMesh.material.color.set(state.activeColor);
      previewMesh.material.opacity = 0.55;
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // ============================================================================
  // Voxel Manipulation Core (Add, Remove, Paint)
  // ============================================================================
  function addVoxel(x, y, z, colorHex, skipHistory = false) {
    const key = getVoxelKey(x, y, z);
    if (voxels.has(key)) return null;

    const mesh = new THREE.Mesh(sharedBoxGeometry, getMaterial(colorHex));
    mesh.position.set(x, y, z);
    mesh.castShadow = state.showShadows;
    mesh.receiveShadow = state.showShadows;
    mesh.userData = { x, y, z, color: colorHex };

    scene.add(mesh);
    const voxelData = { x, y, z, color: colorHex, mesh };
    voxels.set(key, voxelData);

    return voxelData;
  }

  function removeVoxel(x, y, z) {
    const key = getVoxelKey(x, y, z);
    if (!voxels.has(key)) return null;

    const voxelData = voxels.get(key);
    scene.remove(voxelData.mesh);
    voxels.delete(key);
    return voxelData;
  }

  function setVoxelColor(x, y, z, newColorHex) {
    const key = getVoxelKey(x, y, z);
    if (!voxels.has(key)) return null;

    const voxelData = voxels.get(key);
    const prevColor = voxelData.color;
    voxelData.color = newColorHex;
    voxelData.mesh.material = getMaterial(newColorHex);
    voxelData.mesh.userData.color = newColorHex;
    return { x, y, z, prevColor, newColor: newColorHex };
  }

  function clearAllVoxels(recordHistory = true) {
    if (voxels.size === 0) return;

    if (recordHistory) {
      const removedList = [];
      voxels.forEach(v => removedList.push({ x: v.x, y: v.y, z: v.z, color: v.color }));
      pushHistoryAction({ type: 'batch_clear', removed: removedList });
    }

    voxels.forEach(v => scene.remove(v.mesh));
    voxels.clear();
    updateVoxelCountHUD();
    showToast('Canvas Cleared');
  }

  // Calculate coordinates applying symmetry & brush size
  function getPlacementCoordinates(baseX, baseY, baseZ) {
    const coords = [];
    const bSize = state.brushSize;

    // Brush offsets
    const offsetMin = -Math.floor((bSize - 1) / 2);
    const offsetMax = offsetMin + bSize - 1;

    for (let ox = offsetMin; ox <= offsetMax; ox++) {
      for (let oz = offsetMin; oz <= offsetMax; oz++) {
        const cx = baseX + ox;
        const cy = baseY;
        const cz = baseZ + oz;

        // Apply symmetry
        addSymmetricPoints(cx, cy, cz, coords);
      }
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    coords.forEach(pt => {
      const k = `${pt.x},${pt.y},${pt.z}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(pt);
      }
    });

    return unique;
  }

  function addSymmetricPoints(x, y, z, list) {
    list.push({ x, y, z });

    if (state.symmetry === 'x' || state.symmetry === 'xz') {
      list.push({ x: -x, y, z });
    }
    if (state.symmetry === 'z' || state.symmetry === 'xz') {
      list.push({ x, y, z: -z });
    }
    if (state.symmetry === 'xz') {
      list.push({ x: -x, y, z: -z });
    }
  }

  // ============================================================================
  // History (Undo / Redo) Management
  // ============================================================================
  function pushHistoryAction(action) {
    state.undoStack.push(action);
    if (state.undoStack.length > state.maxHistory) {
      state.undoStack.shift();
    }
    state.redoStack = []; // Reset redo
    updateUndoRedoButtons();
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    const action = state.undoStack.pop();

    if (action.type === 'batch_add') {
      // Remove all added
      action.items.forEach(item => removeVoxel(item.x, item.y, item.z));
      state.redoStack.push(action);
    } else if (action.type === 'batch_remove') {
      // Restore all removed
      action.items.forEach(item => addVoxel(item.x, item.y, item.z, item.color));
      state.redoStack.push(action);
    } else if (action.type === 'batch_paint') {
      // Revert colors
      action.items.forEach(item => setVoxelColor(item.x, item.y, item.z, item.prevColor));
      state.redoStack.push(action);
    } else if (action.type === 'batch_clear') {
      // Restore cleared canvas
      action.removed.forEach(item => addVoxel(item.x, item.y, item.z, item.color));
      state.redoStack.push(action);
    }

    updateUndoRedoButtons();
    updateVoxelCountHUD();
    sfx.play('erase');
    showToast('Undo');
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    const action = state.redoStack.pop();

    if (action.type === 'batch_add') {
      action.items.forEach(item => addVoxel(item.x, item.y, item.z, item.color));
      state.undoStack.push(action);
    } else if (action.type === 'batch_remove') {
      action.items.forEach(item => removeVoxel(item.x, item.y, item.z));
      state.undoStack.push(action);
    } else if (action.type === 'batch_paint') {
      action.items.forEach(item => setVoxelColor(item.x, item.y, item.z, item.newColor));
      state.undoStack.push(action);
    } else if (action.type === 'batch_clear') {
      action.removed.forEach(item => removeVoxel(item.x, item.y, item.z));
      state.undoStack.push(action);
    }

    updateUndoRedoButtons();
    updateVoxelCountHUD();
    sfx.play('place');
    showToast('Redo');
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = state.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = state.redoStack.length === 0;
  }

  // ============================================================================
  // Raycasting & Mouse Interaction
  // ============================================================================
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let pointerDownPos = { x: 0, y: 0 };
  let isPointerDown = false;

  function getIntersectObjects() {
    const list = [groundPlane];
    voxels.forEach(v => list.push(v.mesh));
    return list;
  }

  function onPointerMove(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getIntersectObjects(), false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let targetX, targetY, targetZ;

      if (hit.object === groundPlane) {
        // Point on ground
        targetX = Math.round(hit.point.x);
        targetY = 0;
        targetZ = Math.round(hit.point.z);
      } else {
        // Hit existing voxel
        const hitNormal = hit.face.normal;
        const currentPos = hit.object.position;

        if (state.tool === 'erase' || state.tool === 'paint' || state.tool === 'picker') {
          targetX = currentPos.x;
          targetY = currentPos.y;
          targetZ = currentPos.z;
        } else {
          // Place adjacent
          targetX = Math.round(currentPos.x + hitNormal.x);
          targetY = Math.round(currentPos.y + hitNormal.y);
          targetZ = Math.round(currentPos.z + hitNormal.z);
        }
      }

      // Update Cursor Indicator HUD
      const cursorCoordHUD = document.getElementById('stat-cursor-coord');
      if (cursorCoordHUD) {
        cursorCoordHUD.textContent = `X: ${targetX}, Y: ${targetY}, Z: ${targetZ}`;
      }

      // Position Ghost Mesh
      previewGroup.position.set(targetX, targetY, targetZ);
      previewGroup.visible = true;
      updatePreviewCursorColor();
    } else {
      previewGroup.visible = false;
    }
  }

  function onPointerDown(event) {
    isPointerDown = true;
    pointerDownPos = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    if (!isPointerDown) return;
    isPointerDown = false;

    // Check drag threshold to prevent accidental click when orbiting
    const dx = Math.abs(event.clientX - pointerDownPos.x);
    const dy = Math.abs(event.clientY - pointerDownPos.y);
    if (dx > 5 || dy > 5) {
      return; // Was a camera orbit/drag
    }

    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getIntersectObjects(), false);

    if (intersects.length === 0) return;

    const hit = intersects[0];
    const isRightClick = (event.button === 2) || event.shiftKey;

    if (isRightClick) {
      // Right-click is quick erase
      handleEraseAction(hit);
    } else if (event.button === 0) {
      // Left-click applies active tool
      if (state.tool === 'place') {
        handlePlaceAction(hit);
      } else if (state.tool === 'paint') {
        handlePaintAction(hit);
      } else if (state.tool === 'erase') {
        handleEraseAction(hit);
      } else if (state.tool === 'picker') {
        handlePickerAction(hit);
      }
    }
  }

  function handlePlaceAction(hit) {
    let baseX, baseY, baseZ;

    if (hit.object === groundPlane) {
      baseX = Math.round(hit.point.x);
      baseY = 0;
      baseZ = Math.round(hit.point.z);
    } else {
      const normal = hit.face.normal;
      const currentPos = hit.object.position;
      baseX = Math.round(currentPos.x + normal.x);
      baseY = Math.round(currentPos.y + normal.y);
      baseZ = Math.round(currentPos.z + normal.z);
    }

    // Don't place below ground
    if (baseY < 0) return;

    const targets = getPlacementCoordinates(baseX, baseY, baseZ);
    const addedItems = [];

    targets.forEach(pt => {
      if (pt.y >= 0 && !voxels.has(getVoxelKey(pt.x, pt.y, pt.z))) {
        const v = addVoxel(pt.x, pt.y, pt.z, state.activeColor);
        if (v) addedItems.push({ x: pt.x, y: pt.y, z: pt.z, color: state.activeColor });
      }
    });

    if (addedItems.length > 0) {
      pushHistoryAction({ type: 'batch_add', items: addedItems });
      addRecentColor(state.activeColor);
      sfx.play('place');
      updateVoxelCountHUD();
    }
  }

  function handleEraseAction(hit) {
    if (hit.object === groundPlane) return; // Cannot erase floor

    const hitPos = hit.object.position;
    const targets = getPlacementCoordinates(hitPos.x, hitPos.y, hitPos.z);
    const removedItems = [];

    targets.forEach(pt => {
      const key = getVoxelKey(pt.x, pt.y, pt.z);
      if (voxels.has(key)) {
        const v = voxels.get(key);
        removedItems.push({ x: pt.x, y: pt.y, z: pt.z, color: v.color });
        removeVoxel(pt.x, pt.y, pt.z);
      }
    });

    if (removedItems.length > 0) {
      pushHistoryAction({ type: 'batch_remove', items: removedItems });
      sfx.play('erase');
      updateVoxelCountHUD();
    }
  }

  function handlePaintAction(hit) {
    if (hit.object === groundPlane) return;

    const hitPos = hit.object.position;
    const targets = getPlacementCoordinates(hitPos.x, hitPos.y, hitPos.z);
    const paintedItems = [];

    targets.forEach(pt => {
      const key = getVoxelKey(pt.x, pt.y, pt.z);
      if (voxels.has(key)) {
        const res = setVoxelColor(pt.x, pt.y, pt.z, state.activeColor);
        if (res) paintedItems.push(res);
      }
    });

    if (paintedItems.length > 0) {
      pushHistoryAction({ type: 'batch_paint', items: paintedItems });
      addRecentColor(state.activeColor);
      sfx.play('paint');
    }
  }

  function handlePickerAction(hit) {
    if (hit.object === groundPlane) return;

    const hitColor = hit.object.userData.color;
    if (hitColor) {
      setActiveColor(hitColor);
      sfx.play('pick');
      showToast(`Color picked: ${hitColor}`);
      // Switch back to build or paint tool
      selectTool('place');
    }
  }

  // ============================================================================
  // Color Palette Management (Variable Palettes)
  // ============================================================================
  function loadCustomPalettesFromStorage() {
    try {
      const stored = localStorage.getItem('voxelcraft_custom_palettes');
      if (stored) {
        state.customPalettes = JSON.parse(stored);
        if (state.customPalettes.custom) {
          PALETTES.custom = state.customPalettes.custom;
        }
      } else {
        PALETTES.custom = ['#38bdf8', '#818cf8', '#ec4899', '#10b981', '#f59e0b', '#f43f5e', '#ffffff', '#121624'];
      }
    } catch (e) {
      PALETTES.custom = ['#38bdf8', '#818cf8', '#ec4899', '#10b981', '#f59e0b', '#f43f5e', '#ffffff', '#121624'];
    }
  }

  function saveCustomPalettesToStorage() {
    try {
      state.customPalettes.custom = PALETTES.custom;
      localStorage.setItem('voxelcraft_custom_palettes', JSON.stringify(state.customPalettes));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  function renderPaletteSwatches() {
    const swatchesGrid = document.getElementById('swatches-grid');
    if (!swatchesGrid) return;
    swatchesGrid.innerHTML = '';

    const colors = PALETTES[state.activePaletteName] || PALETTES.cyberpunk;

    colors.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch-item';
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.dataset.index = index;

      if (color.toLowerCase() === state.activeColor.toLowerCase()) {
        swatch.classList.add('active');
      }

      // Quick Delete button
      const deleteBtn = document.createElement('span');
      deleteBtn.className = 'swatch-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Remove color';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeColorFromCurrentPalette(index);
      });
      swatch.appendChild(deleteBtn);

      swatch.addEventListener('click', () => {
        setActiveColor(color);
      });

      swatchesGrid.appendChild(swatch);
    });
  }

  function setActiveColor(colorHex) {
    colorHex = normalizeHex6(colorHex);
    state.activeColor = colorHex;

    // Update active swatch UI badge
    const activeSwatchBox = document.getElementById('active-color-swatch');
    const activeHexText = document.getElementById('active-color-hex');
    const nativeColorPicker = document.getElementById('native-color-picker');

    if (activeSwatchBox) activeSwatchBox.style.backgroundColor = colorHex;
    if (activeHexText) activeHexText.textContent = colorHex.toUpperCase();
    if (nativeColorPicker) nativeColorPicker.value = colorHex;

    // Update ghost preview
    updatePreviewCursorColor();

    // Mark active in swatch grid
    const allSwatches = document.querySelectorAll('.swatch-item');
    allSwatches.forEach(sw => {
      if (sw.dataset.color && sw.dataset.color.toLowerCase() === colorHex.toLowerCase()) {
        sw.classList.add('active');
      } else {
        sw.classList.remove('active');
      }
    });
  }

  function addColorToCurrentPalette(colorHex) {
    const palette = PALETTES[state.activePaletteName];
    if (!palette) return;

    if (!palette.includes(colorHex)) {
      palette.push(colorHex);
      if (state.activePaletteName === 'custom') {
        saveCustomPalettesToStorage();
      }
      renderPaletteSwatches();
      showToast(`Added ${colorHex} to palette`);
    } else {
      showToast('Color already in palette');
    }
  }

  function removeColorFromCurrentPalette(index) {
    const palette = PALETTES[state.activePaletteName];
    if (!palette || palette.length <= 1) {
      showToast('Palette must have at least 1 color');
      return;
    }
    palette.splice(index, 1);
    if (state.activePaletteName === 'custom') {
      saveCustomPalettesToStorage();
    }
    renderPaletteSwatches();
  }

  function addRecentColor(colorHex) {
    if (!state.recentColors.includes(colorHex)) {
      state.recentColors.unshift(colorHex);
      if (state.recentColors.length > 8) {
        state.recentColors.pop();
      }
      renderRecentColors();
    }
  }

  function renderRecentColors() {
    const container = document.getElementById('recent-colors-list');
    if (!container) return;
    container.innerHTML = '';

    state.recentColors.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'recent-swatch';
      sw.style.backgroundColor = color;
      sw.title = color;
      sw.addEventListener('click', () => setActiveColor(color));
      container.appendChild(sw);
    });
  }

  // ============================================================================
  // Tools & UI Controls
  // ============================================================================
  function selectTool(toolName) {
    state.tool = toolName;

    // Update dock button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.dataset.tool === toolName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update HUD
    const hudTool = document.getElementById('stat-current-tool');
    const titles = { place: 'Build (B)', paint: 'Paint (P)', erase: 'Erase (E)', picker: 'Picker (I)' };
    if (hudTool) hudTool.textContent = titles[toolName] || toolName;

    updatePreviewCursorColor();
  }

  function setBrushSize(size) {
    state.brushSize = parseInt(size, 10);
    document.querySelectorAll('.brush-btn').forEach(btn => {
      if (parseInt(btn.dataset.size, 10) === state.brushSize) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    showToast(`Brush: ${state.brushSize}x${state.brushSize}`);
  }

  function setSymmetry(symMode) {
    state.symmetry = symMode;
    document.querySelectorAll('#symmetry-pills .pill').forEach(btn => {
      if (btn.dataset.sym === symMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    showToast(`Symmetry: ${symMode.toUpperCase()}`);
  }

  function setCameraAngle(mode) {
    const dist = 34;
    if (mode === 'iso') {
      camera.position.set(22, 20, 26);
      controls.target.set(0, 3, 0);
    } else if (mode === 'top') {
      camera.position.set(0, dist + 10, 0.1);
      controls.target.set(0, 0, 0);
    } else if (mode === 'front') {
      camera.position.set(0, 5, dist);
      controls.target.set(0, 3, 0);
    } else if (mode === 'side') {
      camera.position.set(dist, 5, 0);
      controls.target.set(0, 3, 0);
    }
    controls.update();
  }

  function setEnvironmentTheme(themeKey) {
    const env = ENVIRONMENTS[themeKey];
    if (!env) return;

    state.envTheme = themeKey;
    scene.background.set(env.bg);
    fillLight.color.set(env.fill);
    dirLight.color.set(env.light);

    if (groundPlane) groundPlane.material.color.set(env.ground);
    createGroundAndGrid();
  }

  function updateVoxelCountHUD() {
    const el = document.getElementById('stat-voxel-count');
    if (el) el.textContent = voxels.size;
  }

  function fillBaseFloor(size = 12) {
    const half = Math.floor(size / 2);
    const addedItems = [];
    const floorColor = state.activeColor;

    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        if (!voxels.has(getVoxelKey(x, 0, z))) {
          const v = addVoxel(x, 0, z, floorColor);
          if (v) addedItems.push({ x, y: 0, z, color: floorColor });
        }
      }
    }

    if (addedItems.length > 0) {
      pushHistoryAction({ type: 'batch_add', items: addedItems });
      sfx.play('place');
      updateVoxelCountHUD();
      showToast(`Generated ${size}x${size} Base Floor`);
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // ============================================================================
  // Sample Demo Models Generator
  // ============================================================================
  function loadDemoModel(name) {
    clearAllVoxels(false);

    if (name === 'robot') {
      buildCyberRobot();
    } else if (name === 'castle') {
      buildFloatingCastle();
    } else if (name === 'sword') {
      buildLegendarySword();
    } else if (name === 'treehouse') {
      buildCozyCottage();
    } else if (name === 'car') {
      buildArcadeRacer();
    }

    updateVoxelCountHUD();
    setCameraAngle('iso');
    sfx.play('place');
    showToast(`Loaded: ${name.toUpperCase()} Model`);
  }

  function buildCyberRobot() {
    const cMetal = '#475569';
    const cArmor = '#38bdf8';
    const cDark = '#1e293b';
    const cVisor = '#f43f5e';
    const cCore = '#facc15';

    // Feet & Legs
    for (let x of [-2, 2]) {
      // Foot
      for (let z = -1; z <= 2; z++) {
        addVoxel(x, 0, z, cDark);
      }
      // Leg column
      for (let y = 1; y <= 4; y++) {
        addVoxel(x, y, 0, cMetal);
        addVoxel(x, y, 1, cMetal);
      }
    }

    // Pelvis & Torso
    for (let x = -3; x <= 3; x++) {
      for (let z = -1; z <= 1; z++) {
        addVoxel(x, 5, z, cDark);
      }
    }
    // Main Body Chest
    for (let y = 6; y <= 9; y++) {
      for (let x = -3; x <= 3; x++) {
        for (let z = -2; z <= 1; z++) {
          let c = cArmor;
          if (z === 1 && x >= -1 && x <= 1 && y >= 7 && y <= 8) {
            c = cCore; // Glowing chest core
          }
          addVoxel(x, y, z, c);
        }
      }
    }

    // Arms & Shoulders
    for (let side of [-1, 1]) {
      const sx = side * 4;
      // Shoulder pad
      for (let y = 8; y <= 10; y++) {
        for (let z = -1; z <= 1; z++) {
          addVoxel(sx, y, z, cArmor);
        }
      }
      // Arm
      for (let y = 4; y <= 7; y++) {
        addVoxel(sx, y, 0, cMetal);
      }
      // Hand / Blaster
      addVoxel(sx, 3, 0, cDark);
      addVoxel(sx, 3, 1, cVisor);
    }

    // Head
    for (let y = 10; y <= 12; y++) {
      for (let x = -2; x <= 2; x++) {
        for (let z = -1; z <= 1; z++) {
          let col = cDark;
          if (z === 1 && y === 11) {
            col = cVisor; // Visor line
          }
          addVoxel(x, y, z, col);
        }
      }
    }
    // Antenna
    addVoxel(0, 13, 0, cMetal);
    addVoxel(0, 14, 0, cArmor);
  }

  function buildFloatingCastle() {
    const cStone = '#64748b';
    const cDarkStone = '#334155';
    const cRoof = '#818cf8';
    const cGold = '#facc15';
    const cDoor = '#78350f';

    // Island Base
    for (let r = 5; r >= 0; r--) {
      const y = 4 - r;
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          if (Math.hypot(x, z) <= r + 0.5) {
            addVoxel(x, y, z, y === 4 ? '#22c55e' : '#92400e');
          }
        }
      }
    }

    // Castle Walls
    for (let y = 5; y <= 9; y++) {
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          if (x === -3 || x === 3 || z === -3 || z === 3) {
            // Door cutout
            if (z === 3 && x >= -1 && x <= 1 && y <= 7) {
              addVoxel(x, y, z, cDoor);
            } else {
              addVoxel(x, y, z, cStone);
            }
          }
        }
      }
    }

    // Turrets on 4 corners
    const corners = [[-4, -4], [-4, 4], [4, -4], [4, 4]];
    corners.forEach(([cx, cz]) => {
      for (let y = 5; y <= 11; y++) {
        addVoxel(cx, y, cz, cDarkStone);
      }
      // Roof Cones
      addVoxel(cx, 12, cz, cRoof);
      addVoxel(cx, 13, cz, cGold);
    });

    // Central Keep Tower
    for (let y = 10; y <= 14; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          addVoxel(x, y, z, cStone);
        }
      }
    }
    // Main Roof
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        addVoxel(x, 15, z, cRoof);
      }
    }
    addVoxel(0, 16, 0, cRoof);
    addVoxel(0, 17, 0, cGold);
  }

  function buildLegendarySword() {
    const cBlade = '#38bdf8';
    const cCore = '#ffffff';
    const cGuard = '#facc15';
    const cGrip = '#78350f';
    const cGem = '#f43f5e';

    // Pommel
    addVoxel(0, 0, 0, cGem);
    addVoxel(0, 1, 0, cGuard);

    // Grip
    for (let y = 2; y <= 5; y++) {
      addVoxel(0, y, 0, cGrip);
    }

    // Crossguard
    for (let x = -4; x <= 4; x++) {
      addVoxel(x, 6, 0, cGuard);
      if (Math.abs(x) === 4) {
        addVoxel(x, 7, 0, cGuard);
      }
    }
    addVoxel(0, 6, 1, cGem);
    addVoxel(0, 6, -1, cGem);

    // Blade
    for (let y = 7; y <= 20; y++) {
      addVoxel(0, y, 0, cCore);
      addVoxel(-1, y, 0, cBlade);
      addVoxel(1, y, 0, cBlade);
    }
    // Tip
    addVoxel(0, 21, 0, cBlade);
    addVoxel(0, 22, 0, cBlade);
  }

  function buildCozyCottage() {
    const cWall = '#e2e8f0';
    const cRoof = '#b91c1c';
    const cWood = '#92400e';
    const cGlass = '#38bdf8';
    const cChimney = '#475569';

    // Floor & Walls
    for (let y = 0; y <= 4; y++) {
      for (let x = -3; x <= 3; x++) {
        for (let z = -4; z <= 4; z++) {
          const isEdge = x === -3 || x === 3 || z === -4 || z === 4;
          if (y === 0) {
            addVoxel(x, y, z, '#15803d'); // grass
          } else if (isEdge) {
            // Door
            if (z === 4 && x >= -1 && x <= 0 && y <= 3) {
              addVoxel(x, y, z, cWood);
            }
            // Window
            else if (x === -3 && z >= -1 && z <= 1 && y === 2) {
              addVoxel(x, y, z, cGlass);
            } else {
              addVoxel(x, y, z, cWall);
            }
          }
        }
      }
    }

    // Pitched Roof
    let width = 4;
    let ry = 5;
    while (width >= 0) {
      for (let x = -width; x <= width; x++) {
        for (let z = -5; z <= 5; z++) {
          if (Math.abs(x) === width) {
            addVoxel(x, ry, z, cRoof);
          }
        }
      }
      width--;
      ry++;
    }

    // Chimney with smoke
    for (let cy = 5; cy <= 10; cy++) {
      addVoxel(2, cy, -2, cChimney);
    }
    addVoxel(2, 11, -2, '#cbd5e1');
    addVoxel(2, 12, -1, '#e2e8f0');
  }

  function buildArcadeRacer() {
    const cBody = '#e11d48';
    const cTire = '#0f172a';
    const cGlass = '#38bdf8';
    const cRims = '#facc15';

    // Wheels
    const wheels = [[-2, -3], [-2, 3], [2, -3], [2, 3]];
    wheels.forEach(([x, z]) => {
      addVoxel(x, 0, z, cTire);
      addVoxel(x, 1, z, cTire);
    });

    // Chassis
    for (let y = 0; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -4; z <= 4; z++) {
          addVoxel(x, y, z, '#1e293b');
        }
      }
    }

    // Body
    for (let z = -4; z <= 4; z++) {
      for (let x = -2; x <= 2; x++) {
        addVoxel(x, 1, z, cBody);
      }
    }

    // Cockpit & Windshield
    for (let z = -1; z <= 2; z++) {
      for (let x = -1; x <= 1; x++) {
        const col = (z === 2 || z === -1) ? cGlass : cBody;
        addVoxel(x, 2, z, col);
      }
    }

    // Spoiler
    addVoxel(-2, 2, -4, cBody);
    addVoxel(2, 2, -4, cBody);
    for (let x = -2; x <= 2; x++) {
      addVoxel(x, 3, -4, cBody);
    }

    // Headlights
    addVoxel(-1, 1, 4, cRims);
    addVoxel(1, 1, 4, cRims);
  }

  // ============================================================================
  // Model Exporting (.OBJ, .JSON, .PNG)
  // ============================================================================
  function exportOBJ() {
    if (voxels.size === 0) {
      showToast('No voxels to export!');
      return;
    }

    let objContent = '# VoxelCraft 3D Model Export\n';
    objContent += '# Generator: VoxelCraft Studio\n\n';

    let vertexOffset = 1;

    // Cube standard vertices around (0,0,0)
    const corners = [
      [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
      [-0.5, -0.5, 0.5],  [0.5, -0.5, 0.5],  [0.5, 0.5, 0.5],  [-0.5, 0.5, 0.5]
    ];

    // 6 faces (1-indexed quad faces)
    const faces = [
      [1, 2, 3, 4], // Back
      [5, 8, 7, 6], // Front
      [1, 5, 6, 2], // Bottom
      [4, 3, 7, 8], // Top
      [1, 4, 8, 5], // Left
      [2, 6, 7, 3]  // Right
    ];

    voxels.forEach(v => {
      const hex = normalizeHex6(v.color).replace('#', '');
      const r = (parseInt(hex.substr(0, 2), 16) / 255).toFixed(3);
      const g = (parseInt(hex.substr(2, 2), 16) / 255).toFixed(3);
      const b = (parseInt(hex.substr(4, 2), 16) / 255).toFixed(3);

      // Write 8 vertices with vertex colors
      corners.forEach(c => {
        const vx = (v.x + c[0]).toFixed(2);
        const vy = (v.y + c[1]).toFixed(2);
        const vz = (v.z + c[2]).toFixed(2);
        objContent += `v ${vx} ${vy} ${vz} ${r} ${g} ${b}\n`;
      });

      // Write 6 faces
      faces.forEach(f => {
        objContent += `f ${f[0] + vertexOffset - 1} ${f[1] + vertexOffset - 1} ${f[2] + vertexOffset - 1} ${f[3] + vertexOffset - 1}\n`;
      });

      vertexOffset += 8;
    });

    downloadBlob(objContent, 'VoxelCraft_Model.obj', 'text/plain');
    showToast('Exported VoxelCraft_Model.obj');
  }

  function exportJSON() {
    if (voxels.size === 0) {
      showToast('No voxels to export!');
      return;
    }

    const voxelList = [];
    voxels.forEach(v => {
      voxelList.push({ x: v.x, y: v.y, z: v.z, color: v.color });
    });

    const projectData = {
      app: 'VoxelCraft 3D',
      version: '1.0',
      timestamp: new Date().toISOString(),
      activePalette: state.activePaletteName,
      paletteColors: PALETTES[state.activePaletteName],
      voxels: voxelList
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    downloadBlob(jsonStr, 'VoxelCraft_Project.json', 'application/json');
    showToast('Saved Project JSON');
  }

  function loadJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.voxels || !Array.isArray(data.voxels)) {
          showToast('Invalid project file format');
          return;
        }

        clearAllVoxels(false);

        if (data.activePalette && PALETTES[data.activePalette]) {
          state.activePaletteName = data.activePalette;
          const select = document.getElementById('palette-select');
          if (select) select.value = data.activePalette;
        }
        if (data.paletteColors && Array.isArray(data.paletteColors)) {
          PALETTES.custom = data.paletteColors;
        }

        data.voxels.forEach(v => {
          addVoxel(v.x, v.y, v.z, v.color || '#38bdf8');
        });

        renderPaletteSwatches();
        updateVoxelCountHUD();
        setCameraAngle('iso');
        closeModals();
        showToast(`Loaded ${data.voxels.length} voxels from JSON`);
      } catch (err) {
        showToast('Error reading JSON file');
      }
    };
    reader.readAsText(file);
  }

  function takeSnapshotPNG() {
    // Hide preview cursor during screenshot
    const wasVisible = previewGroup.visible;
    previewGroup.visible = false;
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL('image/png');
    previewGroup.visible = wasVisible;

    const link = document.createElement('a');
    link.download = `VoxelCraft_Snapshot_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    showToast('Snapshot Downloaded!');
  }

  function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================================
  // Event Listeners & UI Binding
  // ============================================================================
  function setupUIBindings() {
    const canvas = renderer.domElement;

    // Pointer events on canvas
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent default right-click menu

    // Tool dock buttons
    document.getElementById('tool-place').addEventListener('click', () => selectTool('place'));
    document.getElementById('tool-paint').addEventListener('click', () => selectTool('paint'));
    document.getElementById('tool-erase').addEventListener('click', () => selectTool('erase'));
    document.getElementById('tool-picker').addEventListener('click', () => selectTool('picker'));

    // Brush sizes
    document.querySelectorAll('#brush-size-options .brush-btn').forEach(btn => {
      btn.addEventListener('click', () => setBrushSize(btn.dataset.size));
    });

    // Quick Actions
    document.getElementById('btn-fill-floor').addEventListener('click', () => fillBaseFloor(14));
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (confirm('Clear entire canvas?')) clearAllVoxels(true);
    });

    // Undo / Redo
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-redo').addEventListener('click', redo);

    // Symmetry pills
    document.querySelectorAll('#symmetry-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => setSymmetry(pill.dataset.sym));
    });

    // Audio toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    audioBtn.addEventListener('click', () => {
      state.audioEnabled = !state.audioEnabled;
      audioBtn.classList.toggle('active', state.audioEnabled);
      audioBtn.querySelector('.audio-on').style.display = state.audioEnabled ? 'block' : 'none';
      audioBtn.querySelector('.audio-off').style.display = state.audioEnabled ? 'none' : 'block';
      showToast(`Audio: ${state.audioEnabled ? 'ON' : 'OFF'}`);
    });

    // Demos dropdown
    const demoBtn = document.getElementById('btn-sample-models');
    const demoMenu = document.getElementById('demos-dropdown');
    demoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      demoMenu.classList.toggle('show');
    });
    document.querySelectorAll('#demos-dropdown .dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        demoMenu.classList.remove('show');
        loadDemoModel(item.dataset.demo);
      });
    });
    document.addEventListener('click', () => demoMenu.classList.remove('show'));

    // Modals
    const exportModal = document.getElementById('modal-export');
    const shortcutsModal = document.getElementById('modal-shortcuts');

    document.getElementById('btn-export-modal').addEventListener('click', () => exportModal.classList.add('show'));
    document.getElementById('btn-close-export').addEventListener('click', () => exportModal.classList.remove('show'));
    document.getElementById('btn-shortcuts').addEventListener('click', () => shortcutsModal.classList.add('show'));
    document.getElementById('btn-close-shortcuts').addEventListener('click', () => shortcutsModal.classList.remove('show'));

    window.addEventListener('click', (e) => {
      if (e.target === exportModal) exportModal.classList.remove('show');
      if (e.target === shortcutsModal) shortcutsModal.classList.remove('show');
    });

    // Export Buttons
    document.getElementById('btn-download-obj').addEventListener('click', exportOBJ);
    document.getElementById('btn-download-json').addEventListener('click', exportJSON);
    document.getElementById('btn-download-png').addEventListener('click', takeSnapshotPNG);
    document.getElementById('btn-quick-snapshot').addEventListener('click', takeSnapshotPNG);

    document.getElementById('input-load-json').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadJSON(e.target.files[0]);
      }
    });

    // Palette Selector
    const paletteSelect = document.getElementById('palette-select');
    paletteSelect.addEventListener('change', (e) => {
      state.activePaletteName = e.target.value;
      renderPaletteSwatches();
      const currentColors = PALETTES[state.activePaletteName];
      if (currentColors && currentColors.length > 0) {
        setActiveColor(currentColors[0]);
      }
      showToast(`Palette: ${e.target.options[e.target.selectedIndex].text}`);
    });

    // Native Color Picker input
    const colorPickerInput = document.getElementById('native-color-picker');
    colorPickerInput.addEventListener('input', (e) => {
      setActiveColor(e.target.value);
    });

    // Palette Tools
    document.getElementById('btn-add-color').addEventListener('click', () => {
      addColorToCurrentPalette(state.activeColor);
    });

    document.getElementById('btn-edit-palette-name').addEventListener('click', () => {
      PALETTES.custom = [...PALETTES[state.activePaletteName]];
      state.activePaletteName = 'custom';
      paletteSelect.value = 'custom';
      saveCustomPalettesToStorage();
      renderPaletteSwatches();
      showToast('Saved to Custom Palette!');
    });

    document.getElementById('btn-reset-palette').addEventListener('click', () => {
      if (confirm('Reset palette swatches?')) {
        loadCustomPalettesFromStorage();
        renderPaletteSwatches();
        showToast('Palette reset');
      }
    });

    // Viewport & Settings Panel
    const settingsDock = document.getElementById('settings-dock');
    document.getElementById('btn-toggle-settings').addEventListener('click', () => {
      settingsDock.classList.toggle('collapsed');
    });

    // Camera preset buttons
    document.querySelectorAll('.cam-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => setCameraAngle(btn.dataset.cam));
    });

    // Turntable toggle
    document.getElementById('toggle-autorotate').addEventListener('change', (e) => {
      controls.autoRotate = e.target.checked;
    });

    // Grid toggle
    document.getElementById('toggle-grid').addEventListener('change', (e) => {
      state.showGrid = e.target.checked;
      if (gridHelper) gridHelper.visible = state.showGrid;
    });

    // Shadows toggle
    document.getElementById('toggle-shadows').addEventListener('change', (e) => {
      state.showShadows = e.target.checked;
      dirLight.castShadow = state.showShadows;
      voxels.forEach(v => {
        v.mesh.castShadow = state.showShadows;
        v.mesh.receiveShadow = state.showShadows;
      });
    });

    // Environment select
    document.getElementById('select-environment').addEventListener('change', (e) => {
      setEnvironmentTheme(e.target.value);
    });

    // Grid size slider
    const sliderGrid = document.getElementById('slider-grid-size');
    const displayGrid = document.getElementById('grid-size-display');
    sliderGrid.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.gridSize = val;
      displayGrid.textContent = `${val} x ${val}`;
      createGroundAndGrid();
    });

    // Global Keyboard Hotkeys
    window.addEventListener('keydown', handleKeybindings);
  }

  function closeModals() {
    document.getElementById('modal-export').classList.remove('show');
    document.getElementById('modal-shortcuts').classList.remove('show');
  }

  function handleKeybindings(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      redo();
    } else if (e.key === 'b' || e.key === 'B' || e.key === '1') {
      selectTool('place');
    } else if (e.key === 'p' || e.key === 'P' || e.key === '2') {
      selectTool('paint');
    } else if (e.key === 'e' || e.key === 'E' || e.key === '3') {
      selectTool('erase');
    } else if (e.key === 'i' || e.key === 'I' || e.key === '4') {
      selectTool('picker');
    } else if (e.key === 'g' || e.key === 'G') {
      const toggle = document.getElementById('toggle-grid');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    } else if (e.key === ' ') {
      e.preventDefault();
      const toggle = document.getElementById('toggle-autorotate');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    } else if (e.key === '?') {
      document.getElementById('modal-shortcuts').classList.add('show');
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  function init() {
    loadCustomPalettesFromStorage();
    initThree();
    renderPaletteSwatches();
    renderRecentColors();
    setupUIBindings();
    updateUndoRedoButtons();
    updateVoxelCountHUD();

    // Load initial cool sample to delight the user immediately
    loadDemoModel('robot');
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
