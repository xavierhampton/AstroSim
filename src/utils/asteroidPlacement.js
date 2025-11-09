import * as THREE from 'three';
import { createAsteroid, spawnAsteroid } from '../scene/asteroid.js';

// Scaling constants for realistic input values
// Earth radius = 3 units = 6371 km, so 1 unit ≈ 2124 km
const KM_TO_UNITS = 1 / 2124; // Convert km to simulation units
const MASS_SCALE = 1; // Mass input is in 10^12 kg, simulation uses arbitrary units (keep 1:1 for now)
const VELOCITY_SCALE = 0.01; // Convert km/s to simulation velocity units (tuned for visual effect)

const placementOffset = 1.5;
const earthRadius = 3;

let hologram = null;

/**
 * Update hologram position based on mouse movement
 */
function updateHologram(event, raycaster, mouse, placementPlane, camera, sphere, distanceIndicator) {
  // Store last mouse event for hologram recreation
  window.lastMouseEvent = event;

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
  if (hologram) {
    hologram.position.copy(hologramPos);

    // Update distance indicator
    const distanceFromCenter = hologramPos.distanceTo(earthPos);
    const distanceFromSurface = distanceFromCenter - earthRadius;
    const distanceKm = Math.round(distanceFromSurface / KM_TO_UNITS);
    distanceIndicator.textContent = `[${distanceKm.toLocaleString()} km]`;
  }
}

/**
 * Place asteroid at hologram position when Space is pressed
 */
function placeAsteroid(event, sizeInput, massInput, gui, camera, sphere, world, scene, asteroids) {
  if (event.code !== "Space") {
    return;
  }
  // Prevent space from triggering GUI buttons
  event.preventDefault();
  event.stopPropagation();

  // Get user input values and scale them to simulation units
  const sizeKm = parseFloat(sizeInput.value) || 500;
  const size = sizeKm * KM_TO_UNITS; // Convert km to simulation units

  const massInput12kg = parseFloat(massInput.value) || 1;
  const mass = massInput12kg * MASS_SCALE; // Convert 10^12 kg to simulation units

  const velocityKmPerS = gui.getVelocity();
  const velocityMagnitude = velocityKmPerS * VELOCITY_SCALE; // Convert km/s to simulation velocity
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

/**
 * Create/recreate hologram with current size
 */
function createHologramMesh(sizeInput, scene, meshmap, updateHologramCallback) {
  const sizeKm = parseFloat(sizeInput.value) || 500;
  const size = sizeKm * KM_TO_UNITS;

  // Remove old hologram if it exists
  if (hologram) {
    scene.remove(hologram);
  }

  // Create new hologram
  hologram = createAsteroid(size);
  hologram.material.transparent = true;
  hologram.material.opacity = 0.5;
  hologram.material.color.set("aqua");
  hologram.material.emissive.set(0x222222); // slight glow
  hologram.material.emissiveIntensity = 3;
  hologram.children[0].material.color.set("aqua");
  meshmap['hologram'] = hologram;
  scene.add(hologram);

  // Update hologram position immediately
  if (window.lastMouseEvent && updateHologramCallback) {
    updateHologramCallback(window.lastMouseEvent);
  }
}

/**
 * Clean up hologram and remove event listeners
 */
function cleanupHologram(scene, meshmap, distanceIndicator, updateHologramHandler, placeAsteroidHandler) {
  if (hologram) {
    meshmap['hologram'] = null;
    scene.remove(hologram);
    hologram = null;
    console.log("hologram killed");
  }
  window.removeEventListener("mousemove", updateHologramHandler);
  window.removeEventListener("keydown", placeAsteroidHandler);
  distanceIndicator.classList.remove('visible');
}

/**
 * Get the current hologram mesh
 */
function getHologram() {
  return hologram;
}

export {
  updateHologram,
  placeAsteroid,
  createHologramMesh,
  cleanupHologram,
  getHologram,
  KM_TO_UNITS,
  MASS_SCALE,
  VELOCITY_SCALE,
  placementOffset,
  earthRadius
};
