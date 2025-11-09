import * as CANNON from 'cannon-es';
import * as THREE from 'three'
import { applyNBodyGravity, spawnExplosion, deformEarth, explodeAsteroid } from "./animateDestruction.js"

let clouds;
let sphere;

function animate(meshmap, controls, render, stats, world, scene, gui, composer, camera) {
  sphere = meshmap["sphere"];
  clouds = meshmap["clouds"];
  const speed = 0.00001;
  const xspeed = 6;

  // N-body gravity constant
  const G = 5;

  // Queue of bodies to remove safely
  const bodiesToRemove = [];

  // Hologram rotation state 
  let holoTargetAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
  let holoAngularSpeed = 0.001; 
  let holoNextChange = performance.now() + 3000; 

  function loop() {
    let timescale = gui.getTimescale();
    requestAnimationFrame(loop);

    // Rotate clouds map
    if (clouds.material.map) {
      clouds.material.map.offset.x -= 0.3 * xspeed * speed * timescale;
    }

    // Hologram rotation animation
    if (meshmap['hologram']) {
      const holo = meshmap['hologram'];
      const now = performance.now();

      // Occasionally change direction
      if (now > holoNextChange) {
        holoTargetAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        holoNextChange = now + 2000 + Math.random() * 3000; // every 2–5 seconds
      }

      // Smoothly drift rotation toward target
      const deltaQuat = new THREE.Quaternion().setFromAxisAngle(holoTargetAxis, holoAngularSpeed);
      holo.quaternion.multiplyQuaternions(deltaQuat, holo.quaternion);
    }



    // Gather all physics bodies
    const bodies = [];
    Object.values(meshmap).forEach((entry) => {
      if (entry == meshmap['hologram']) {}
      else if (Array.isArray(entry)) {
        entry.forEach(mesh => {
          if (mesh.userData.physicsBody) bodies.push(mesh.userData.physicsBody);
        });
      } else if (entry.userData && entry.userData.physicsBody) {
        bodies.push(entry.userData.physicsBody);
      }
    });

    // Apply N-body gravity
    applyNBodyGravity(bodies, G);

    //Remove queued to remove bodies from physics world
    while (bodiesToRemove.length > 0) {
      const body = bodiesToRemove.pop();
      if (body.world) body.world.removeBody(body);
    }

    // Step the physics world
    world.step((1 / 60) * timescale * 0.1);

    // Sync mesh positions & rotations with physics bodies
    Object.values(meshmap).forEach((entry) => {
      if (entry == meshmap['hologram']) {}
      else if (Array.isArray(entry)) {
        entry.forEach((mesh) => {
          const body = mesh.userData?.physicsBody;
          if (!body) return;

          mesh.position.copy(body.position);
          mesh.quaternion.copy(body.quaternion);

          // Attach collision listener once
          if (!body.hasCollisionListener && sphere.userData.physicsBody) {
            body.addEventListener('collide', (event) => {
              // Only process collision with sphere
              if (!event || !event.body || event.body !== sphere.userData.physicsBody) return;
              if (mesh.userData?.exploded) return;
              if (!event.contact) return;

              mesh.userData = mesh.userData || {};
              mesh.userData.exploded = true;

              // Get the asteroid's position at impact
              const asteroidPos = new THREE.Vector3(
                body.position.x,
                body.position.y,
                body.position.z
              );

              // Get Earth's center
              const earthCenter = sphere.position.clone();
              const earthRadius = 3; // Match the radius from sphere.js

              // Calculate impact point: project asteroid position onto Earth's surface
              // Direction from Earth center to asteroid
              const directionToAsteroid = asteroidPos.clone().sub(earthCenter).normalize();

              // Contact point is on Earth's surface in that direction
              const contactPoint = earthCenter.clone().add(directionToAsteroid.multiplyScalar(earthRadius));

              // Create crater and explosion
              const asteroidRadius = body.shapes[0].radius;
              const asteroidMass = body.mass;

              // Scale crater size and strength for realistic deformation
              // Crater radius is typically 10-20x the projectile radius
              const craterRadius = asteroidRadius * 4;
              // Impact strength scaled by mass and velocity
              const impactStrength = asteroidMass * 1;

              deformEarth(sphere, clouds, contactPoint, craterRadius, impactStrength);
              spawnExplosion(scene, contactPoint, impactStrength, composer, camera);
              explodeAsteroid(scene, mesh, impactStrength, 0.5, composer, camera);

              // Queue the body for removal
              if (mesh.userData.physicsBody) {
                bodiesToRemove.push(mesh.userData.physicsBody);
                mesh.userData.physicsBody = null;
              }

              // Remove mesh from scene and meshmap
              scene.remove(mesh);
              if (Array.isArray(meshmap["asteroids"])) {
                const idx = meshmap["asteroids"].indexOf(mesh);
                if (idx > -1) meshmap["asteroids"].splice(idx, 1);
              }
            });
            body.hasCollisionListener = true;
          }
        });
      } else {
        const body = entry.userData?.physicsBody;
        if (!body) return;
        entry.position.copy(body.position);
        entry.quaternion.copy(body.quaternion);
      }
    });

    clouds.position.copy(sphere.position);
    clouds.quaternion.copy(sphere.quaternion)

    // Update controls, render, stats
    controls.target.copy(sphere.position); 
    controls.update();
    render();
    // stats.update();
    composer.render();

  }
  loop();
}

export {animate};
