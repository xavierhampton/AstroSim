import { scene, camera, renderer, world, asteroids } from './scene/sceneSetup.js';
import { createSphere } from './scene/sphere.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupStats } from './utils/stats.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';
import { createClouds } from './scene/clouds.js';
import { createAsteroid, spawnAsteroid } from './scene/asteroid.js';
import * as THREE from "three"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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
animate(meshmap, controls, render, stats, world, scene, gui, composer);
