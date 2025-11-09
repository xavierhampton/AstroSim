import { createSphere } from '../scene/sphere.js';
import { createClouds } from '../scene/clouds.js';


function restartSimulation(meshmap, scene, world, asteroids) {
  // Remove all asteroids from scene and physics world
  asteroids.forEach(asteroid => {
    if (asteroid.body) {
      world.removeBody(asteroid.body);
    }
    if (asteroid.userData?.physicsBody) {
      world.removeBody(asteroid.userData.physicsBody);
    }
    scene.remove(asteroid);
    if (asteroid.geometry) asteroid.geometry.dispose();
    if (asteroid.material) asteroid.material.dispose();
  });
  asteroids.length = 0; // Clear the array

  // Get current sphere and clouds from meshmap
  const oldSphere = meshmap["sphere"];
  const oldClouds = meshmap["clouds"];

  // Remove old Earth's physics body
  if (oldSphere.userData?.physicsBody) {
    world.removeBody(oldSphere.userData.physicsBody);
  }

  // Remove old Earth and clouds from scene
  scene.remove(oldSphere);
  scene.remove(oldClouds);

  // Dispose of old geometries and materials to prevent memory leaks
  oldSphere.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });
  oldClouds.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });

  // Create new Earth and clouds with fresh geometry
  const newSphere = createSphere();
  const newClouds = createClouds();

  scene.add(newSphere);
  scene.add(newClouds);

  // Update meshmap references - animate.js now reads from meshmap each frame
  meshmap["sphere"] = newSphere;
  meshmap["clouds"] = newClouds;
}

export { restartSimulation };
