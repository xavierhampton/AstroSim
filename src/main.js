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
// const stats = setupStats();
const gui = setupGUI();

let hologram = null;

const placementOffset = 1.5;
const earthRadius = 3;

function updateHologram(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const earthPos = sphere.position.clone();
  const minDistance = earthRadius + placementOffset;
  const hologramPos = new THREE.Vector3();

  // Vector from ray origin to sphere center
  const originToCenter = new THREE.Vector3().subVectors(camera.position, earthPos);
  const dir = raycaster.ray.direction.clone().normalize();

  // Ray-sphere intersection formula
  const a = dir.dot(dir); // should be 1 since normalized
  const b = 2 * originToCenter.dot(dir);
  const c = originToCenter.dot(originToCenter) - minDistance * minDistance;
  const discriminant = b * b - 4 * a * c;

  if (discriminant >= 0) {
    // Ray intersects the sphere: pick the nearest positive t
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t = t1 > 0 ? t1 : t2; // nearest positive intersection
    if (t > 0) {
      hologramPos.copy(camera.position).addScaledVector(dir, t);
    }
  }

  // If no intersection, fall back to plane intersection
  if (!hologramPos.length()) {
    placementPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      sphere.position
    );
    raycaster.ray.intersectPlane(placementPlane, hologramPos);
  }

  // Update hologram
  if (hologram) hologram.position.copy(hologramPos);
}





function placeAsteroid(event) {
  if (event.code !== "Space") {
    return;
  }
  const size = parseFloat(sizeInput.value) || 1;
  const mass = parseFloat(massInput.value) || 1;
  const velocityMagnitude = gui.getVelocity();
  const velocityDir = gui.getVelocityDirection();

  // Calculate velocity in world space based on camera orientation
  let velocity = null;
  if (velocityMagnitude > 0) {
    // Get camera's right and up vectors (screen-space X and Y)
    const cameraRight = new THREE.Vector3();
    const cameraUp = new THREE.Vector3();
    camera.getWorldDirection(new THREE.Vector3()); // updates camera matrix
    camera.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());

    // Combine arrow key input with camera vectors
    const screenVelocity = new THREE.Vector3();
    screenVelocity.addScaledVector(cameraRight, velocityDir.x);
    screenVelocity.addScaledVector(cameraUp, velocityDir.y);

    // Project onto tangent plane at hologram position (perpendicular to radial direction from Earth)
    const earthCenter = sphere.position.clone();
    const radialDir = hologram.position.clone().sub(earthCenter).normalize();

    // Remove radial component to make velocity tangent to sphere (orbital)
    const radialComponent = screenVelocity.dot(radialDir);
    screenVelocity.addScaledVector(radialDir, -radialComponent);

    // Normalize and scale by velocity magnitude
    if (screenVelocity.length() > 0) {
      screenVelocity.normalize().multiplyScalar(velocityMagnitude);
      velocity = screenVelocity;
    }
  }

  const asteroid = createAsteroid(size);
  spawnAsteroid(asteroid, hologram.position, world, scene, asteroids, mass, size, velocity);
  if (asteroid.body) asteroid.body.mass = mass; 
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
animate(meshmap, controls, render, null, world, scene, gui, composer, camera);
