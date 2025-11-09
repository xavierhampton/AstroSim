import { scene, camera, renderer, world, asteroids } from './scene/sceneSetup.js';
import { createSphere } from './scene/sphere.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupStats } from './utils/stats.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';
import { createClouds } from './scene/clouds.js';
import { createAsteroid, spawnAsteroid } from './scene/asteroid.js';
import * as THREE from 'three';
import { Raycaster, Vector2, Plane, Vector3 } from 'three';

const raycaster = new Raycaster();
const mouse = new Vector2();
const placementPlane = new Plane(); // camera normal plane



const meshmap = {};
meshmap['asteroids'] = asteroids

const launchButton = document.getElementById('launchAsteroid');
const asteroidBtn = document.getElementById('asteroidBtn');
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

let hologram = null;

function updateHologram(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Plane normal = camera direction, passes through Earth
  placementPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), sphere.position);

  const intersectPoint = new Vector3();
  raycaster.ray.intersectPlane(placementPlane, intersectPoint);

  if (hologram) {
    hologram.position.copy(intersectPoint);
  }

  // Optional: draw line from Earth center to hologram
}

asteroidBtn.addEventListener('click', () => {
  if (gui.getPlacementMode()) {
    hologram = createAsteroid(sizeInput.value) || 1;
    hologram.material.transparent = true;
    hologram.material.opacity = 0.5;
    hologram.material.color.set("aqua");
    hologram.material.emissive.set(0x222222); // slight glow
    hologram.material.emissiveIntensity = 0.3;
    hologram.children[0].material.color.set("aqua");
    scene.add(hologram);
    window.addEventListener("mousemove", updateHologram);
    console.log("hologram active")
  } else {
    if (hologram) {
      scene.remove(hologram);
      console.log("hologram killed")
    }
    window.removeEventListener("mousemove", updateHologram);
  }
})

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
