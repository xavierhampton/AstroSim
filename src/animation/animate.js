import * as CANNON from 'cannon-es';
import * as THREE from 'three'
import { applyNBodyGravity, spawnExplosion, deformEarth, explodeAsteroid } from "./animateDestruction.js"

function animate(meshmap, controls, render, stats, world, scene, gui, composer, camera) {
  const speed = 0.00001;
  const xspeed = 6;

  // N-body gravity constant
  const G = 5;

  // Queue of bodies to remove safely
  const bodiesToRemove = [];

  // Audio system for explosion sounds
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  const audioLoader = new THREE.AudioLoader();

  // Load explosion sound buffer (can be reused for multiple sounds)
  let explosionSoundBuffer = null;
  audioLoader.load('resources/boom.mp3', function(buffer) {
    explosionSoundBuffer = buffer;
  }, undefined, function(error) {
    console.warn('Explosion sound not loaded. Place explosion.mp3 in resources/');
  });

  // Volume control - exposed globally via window for UI control
  if (!window.audioSettings) {
    window.audioSettings = { volume: 0.05 };
  }

  // Function to play explosion sound (creates new instance each time for stacking)
  function playExplosionSound() {
    if (!explosionSoundBuffer) return;
    const sound = new THREE.Audio(audioListener);
    sound.setBuffer(explosionSoundBuffer);
    sound.setVolume(window.audioSettings.volume);
    sound.play();
  }

  // Hologram rotation state
  let holoTargetAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
  let holoAngularSpeed = 0.001;
  let holoNextChange = performance.now() + 3000;

  function loop() {
    let timescale = gui.getTimescale();
    requestAnimationFrame(loop);

    // Always get latest references from meshmap
    const sphere = meshmap["sphere"];
    const clouds = meshmap["clouds"];

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
    world.step((1 / 60) * timescale * 0.05);

    // Sync mesh positions & rotations with physics bodies
    Object.values(meshmap).forEach((entry) => {
      if (entry == meshmap['hologram']) {}
      else if (Array.isArray(entry)) {
        entry.forEach((mesh) => {
          const body = mesh.userData?.physicsBody;
          if (!body) return;

          // Limit angular velocity to prevent super-fast spinning
          const maxAngularSpeed = 2; // radians per second
          const angVel = body.angularVelocity;
          const angSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2);
          if (angSpeed > maxAngularSpeed) {
            const scale = maxAngularSpeed / angSpeed;
            angVel.x *= scale;
            angVel.y *= scale;
            angVel.z *= scale;
          }

          mesh.position.copy(body.position);
          mesh.quaternion.copy(body.quaternion);

          // Attach collision listener once
          if (!body.hasCollisionListener && sphere.userData.physicsBody) {
            body.addEventListener('collide', (event) => {
              if (!event || !event.body) return;
              if (mesh.userData?.exploded) return;
              if (!event.contact) return;

              // Handle collision with Earth
              if (event.body === sphere.userData.physicsBody) {
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

                // Play explosion sound (stacks multiple sounds)
                playExplosionSound();

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
                return;
              }

              // Handle asteroid-to-asteroid collision
              if (event.body.objectType === 'asteroid') {
                // Find the other asteroid mesh
                let otherMesh = null;
                if (Array.isArray(meshmap["asteroids"])) {
                  otherMesh = meshmap["asteroids"].find(m => m.userData.physicsBody === event.body);
                }

                if (!otherMesh || otherMesh.userData?.exploded) return;

                // Get both asteroid properties
                const radius1 = body.shapes[0].radius;
                const radius2 = event.body.shapes[0].radius;
                const mass1 = body.mass;
                const mass2 = event.body.mass;

                // Determine which is smaller
                let smallerMesh, smallerBody, largerMesh, largerBody;
                let smallerRadius, largerRadius, smallerMass, largerMass;

                if (radius1 < radius2) {
                  smallerMesh = mesh;
                  smallerBody = body;
                  largerMesh = otherMesh;
                  largerBody = event.body;
                  smallerRadius = radius1;
                  largerRadius = radius2;
                  smallerMass = mass1;
                  largerMass = mass2;
                } else {
                  smallerMesh = otherMesh;
                  smallerBody = event.body;
                  largerMesh = mesh;
                  largerBody = body;
                  smallerRadius = radius2;
                  largerRadius = radius1;
                  smallerMass = mass2;
                  largerMass = mass1;
                }

                // Prevent double-processing
                if (smallerMesh.userData?.exploded) return;
                smallerMesh.userData = smallerMesh.userData || {};
                smallerMesh.userData.exploded = true;

                // Get collision point
                const collisionPos = new THREE.Vector3(
                  smallerBody.position.x,
                  smallerBody.position.y,
                  smallerBody.position.z
                );

                // Calculate impact strength for particles
                const impactStrength = smallerMass * 0.5;

                // Spawn explosion at collision point
                spawnExplosion(scene, collisionPos, impactStrength, composer, camera);
                explodeAsteroid(scene, smallerMesh, impactStrength, 0.3, composer, camera);

                // Play explosion sound
                playExplosionSound();

                // Remove smaller asteroid
                if (smallerMesh.userData.physicsBody) {
                  bodiesToRemove.push(smallerMesh.userData.physicsBody);
                  smallerMesh.userData.physicsBody = null;
                }
                scene.remove(smallerMesh);
                if (Array.isArray(meshmap["asteroids"])) {
                  const idx = meshmap["asteroids"].indexOf(smallerMesh);
                  if (idx > -1) meshmap["asteroids"].splice(idx, 1);
                }

                // Shrink larger asteroid
                const shrinkFactor = 0.85; // Shrink to 85% of original size
                const newRadius = largerRadius * shrinkFactor;
                const newMass = largerMass * (shrinkFactor ** 3); // Volume scales with r^3

                // Update physics body
                largerBody.shapes[0].radius = newRadius;
                largerBody.mass = newMass;
                largerBody.updateMassProperties();

                // Update mesh scale
                largerMesh.scale.multiplyScalar(shrinkFactor);
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
