import { scene, camera, renderer, world, asteroids } from './scene/sceneSetup.js';
import { createSphere } from './scene/sphere.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';
import { createClouds } from './scene/clouds.js';
import { restartSimulation } from './utils/restart.js';
import {
  updateHologram,
  placeAsteroid,
  createHologramMesh,
  cleanupHologram
} from './utils/asteroidPlacement.js';
import * as THREE from "three"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Raycaster, Vector2, Plane } from 'three';

const raycaster = new Raycaster();
const mouse = new Vector2();
const placementPlane = new Plane(); // camera normal plane

//ADD POST PROCESSING
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1, // strength
    0.2, // radius
    0.85 // threshold
);
composer.addPass(bloomPass);


const meshmap = {};
meshmap['asteroids'] = asteroids

// Start Screen Functionality
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const uiContainer = document.querySelector('.ui-container');

startButton.addEventListener('click', () => {
  startScreen.classList.add('fade-out');
  uiContainer.classList.add('visible');

  // Remove start screen from DOM after fade completes
  setTimeout(() => {
    startScreen.style.display = 'none';
  }, 800);
});

// Distance Indicator
const distanceIndicator = document.getElementById('distanceIndicator');

// Info Panel
const infoPanel = document.getElementById('infoPanel');
const infoBtn = document.getElementById('infoBtn');
const closeInfoXBtn = document.getElementById('closeInfoX');

// Volume Control
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// Initialize audio settings if not already set
if (!window.audioSettings) {
  window.audioSettings = { volume: 0.05 };
}

// Set initial volume from slider value on load
window.audioSettings.volume = volumeSlider.value / 1000;
volumeValue.textContent = `${volumeSlider.value}%`;

// Update volume when slider changes
volumeSlider.addEventListener('input', (e) => {
  const volume = e.target.value / 1000;
  window.audioSettings.volume = volume;
  volumeValue.textContent = `${e.target.value}%`;
});

const launchButton = document.getElementById('launchAsteroid');
const asteroidBtn = document.getElementById('asteroidBtn');
const timerBtn = document.getElementById('timerBtn');
const sizeInput = document.getElementById('asteroidSize');
const massInput = document.getElementById('asteroidMass');


const sphere = createSphere();
meshmap["sphere"] = sphere;
const clouds = createClouds();
meshmap["clouds"] = clouds;

Object.values(meshmap).forEach((mesh) => {
  if (!Array.isArray(mesh)) {
    scene.add(mesh);
  }
});

const controls = createControls(camera, renderer);
// const stats = setupStats();
const gui = setupGUI();

// Set the restart callback in GUI
gui.setRestartCallback(() => restartSimulation(meshmap, scene, world, asteroids));

// Wrapper functions for event handlers with proper scope
const updateHologramHandler = (event) => updateHologram(event, raycaster, mouse, placementPlane, camera, sphere, distanceIndicator);
const placeAsteroidHandler = (event) => placeAsteroid(event, sizeInput, massInput, gui, camera, sphere, world, scene, asteroids);

// Update hologram when size input changes
sizeInput.addEventListener('input', () => {
  if (gui.getPlacementMode()) {
    createHologramMesh(sizeInput, scene, meshmap, updateHologramHandler);
  }
});

// Info button click handler
infoBtn.addEventListener('click', () => {
  infoPanel.classList.add('visible');
});

closeInfoXBtn.addEventListener('click', () => {
  infoPanel.classList.remove('visible');
});

// Close info panel when clicking outside the content
infoPanel.addEventListener('click', (e) => {
  if (e.target === infoPanel) {
    infoPanel.classList.remove('visible');
  }
});

// Asteroid button click handler
asteroidBtn.addEventListener('click', () => {
  // Wait a brief moment for gui.js to update placementMode state
  setTimeout(() => {
    if (gui.getPlacementMode()) {
      createHologramMesh(sizeInput, scene, meshmap, updateHologramHandler);
      window.addEventListener("mousemove", updateHologramHandler);
      window.addEventListener("keydown", placeAsteroidHandler);
      distanceIndicator.classList.add('visible');
      console.log("hologram active");
    } else {
      cleanupHologram(scene, meshmap, distanceIndicator, updateHologramHandler, placeAsteroidHandler);
    }
  }, 0);
});

// Timer button click handler
timerBtn.addEventListener('click', () => {
  // Clean up hologram when timer is clicked
  setTimeout(() => {
    if (!gui.getPlacementMode()) {
      cleanupHologram(scene, meshmap, distanceIndicator, updateHologramHandler, placeAsteroidHandler);
    }
  }, 0);
});

function render() {
  renderer.render(scene, camera);
}

handleResize(camera, renderer, render);
animate(meshmap, controls, render, null, world, scene, gui, composer, camera);
