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
import { Raycaster, Vector2, Plane, Vector3 } from 'three';

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

function placeAsteroid(event) {
  if (event.code !== "Space") {
    return;
  }
  const size = parseFloat(sizeInput.value) || 1;
  const mass = parseFloat(massInput.value) || 1;
  const asteroid = createAsteroid(size);
  spawnAsteroid(asteroid, hologram.position, world, scene, asteroids, mass, size);
  if (asteroid.body) asteroid.body.mass = mass; // example if using Cannon.js or Ammo.js
}

asteroidBtn.addEventListener('click', () => {
  if (gui.getPlacementMode()) {
    hologram = createAsteroid(sizeInput.value) || 1;
    hologram.material.transparent = true;
    hologram.material.opacity = 0.5;
    hologram.material.color.set("aqua");
    hologram.material.emissive.set(0x222222); // slight glow
    hologram.material.emissiveIntensity = 3;
    hologram.children[0].material.color.set("aqua");
    meshmap['hologram'] = hologram;
    scene.add(hologram);
    window.addEventListener("mousemove", updateHologram);
    window.addEventListener("keydown", placeAsteroid);
    console.log("hologram active");
  } else {
    if (hologram) {
      meshmap['hologram'] = null;
      scene.remove(hologram);
      console.log("hologram killed");
    }
    window.removeEventListener("mousemove", updateHologram);
  }
})

function render() {
  renderer.render(scene, camera);
}

handleResize(camera, renderer, render);
animate(meshmap, controls, render, stats, world, scene, gui, composer);
