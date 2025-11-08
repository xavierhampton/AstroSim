import { scene, camera, renderer, world, asteroids } from './scene/sceneSetup.js';
import { createSphere } from './scene/sphere.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupStats } from './utils/stats.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';
import { createClouds } from './scene/clouds.js';
import { createAsteroid, spawnAsteroid } from './scene/asteroid.js';



const meshmap = {};
meshmap['asteroids'] = asteroids

const launchButton = document.getElementById('launchAsteroid');
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
const stats = setupStats();
const gui = setupGUI();

// Launch asteroid button
launchButton.addEventListener('click', () => {
    const size = parseFloat(sizeInput.value) || 1;
    const mass = parseFloat(massInput.value) || 1;

    // Create asteroid with chosen size
    const asteroid = createAsteroid(size);

    // Spawn asteroid in front of camera and add to scene
    spawnAsteroid(asteroid, camera, world, scene, asteroids, mass, size);

    // Update physics mass after spawn if your physics library allows
    if (asteroid.body) asteroid.body.mass = mass; // example if using Cannon.js or Ammo.js
});

function render() {
  renderer.render(scene, camera);
}

handleResize(camera, renderer, render);
animate(meshmap, controls, render, stats, world, scene, gui);
