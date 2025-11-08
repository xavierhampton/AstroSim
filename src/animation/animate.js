import * as CANNON from 'cannon-es';
import * as THREE from 'three'
import { applyNBodyGravity, spawnExplosion, deformEarth, explodeAsteroid } from "./animateDestruction.js"

let clouds;
let sphere;

function animate(meshmap, controls, render, stats, world, scene, gui) {
  sphere = meshmap["sphere"];
  clouds = meshmap["clouds"];
  const speed = 0.00001;
  const xspeed = 6;
  
  // N-body gravity constant
  const G = 5;

  // Queue of bodies to remove safely
  const bodiesToRemove = [];

  function loop() {
    let timescale = gui.getTimescale();
    requestAnimationFrame(loop);

    // Rotate clouds map
    if (clouds.material.map) {
      clouds.material.map.offset.x -= 0.3 * xspeed * speed * timescale;
    }

    // Gather all physics bodies
    const bodies = [];
    Object.values(meshmap).forEach((entry) => {
      if (Array.isArray(entry)) {
        entry.forEach(mesh => {
          if (mesh.userData.physicsBody) bodies.push(mesh.userData.physicsBody);
        });
      } else if (entry.userData.physicsBody) {
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
    world.step((1 / 60) * timescale);

    // Sync mesh positions & rotations with physics bodies
    Object.values(meshmap).forEach((entry) => {
      if (Array.isArray(entry)) {
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

              const cp = new CANNON.Vec3();
              event.contact.rj.vadd(event.body.position, cp);
              let contactPoint = new THREE.Vector3(cp.x, cp.y, cp.z);
              contactPoint = contactPoint.clone().sub(sphere.position).multiplyScalar(-1).add(sphere.position);

              // Create crater and explosion
              deformEarth(sphere, clouds, contactPoint, 1, 1.5);
              spawnExplosion(scene, contactPoint, 100);
              explodeAsteroid(scene, mesh);

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
    stats.update();
  }

  loop();
}

export {animate};
