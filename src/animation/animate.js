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
  
  function loop() {
    let timescale = gui.getTimescale();
    requestAnimationFrame(loop);
    // // Rotate sphere & clouds
    // sphere.rotation.x += xspeed * speed;
    // sphere.rotation.y += 20 * speed;
    // clouds.rotation.x += xspeed * speed;
    // clouds.rotation.y += 20 * speed;

    if (clouds.material.map) {
      // console.log("cloud pos" + clouds.material.map.offset.x);
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
              if (event.body === sphere.userData.physicsBody) {
                // Compute collision point in world coordinates
                const cp = new CANNON.Vec3();
                event.contact.rj.vadd(event.body.position, cp);
                let contactPoint = new THREE.Vector3(cp.x, cp.y, cp.z);

                // Mirror the collision point through the center of the sphere
                const spherePos = sphere.position.clone();
                contactPoint = contactPoint.clone().sub(spherePos).multiplyScalar(-1).add(spherePos);

                // Create one big crater on the opposite side
                deformEarth(sphere, clouds, contactPoint, 2, 1.5);
                spawnExplosion(scene, contactPoint, 100);
                explodeAsteroid(scene, mesh); // 'mesh' is the colliding asteroid



                //Remove from world
                scene.remove(mesh);

                //Remove From MeshMap 
                if (Array.isArray(meshmap["asteroids"])) {
                    const idx = meshmap["asteroids"].indexOf(mesh);
                    if (idx > -1) meshmap["asteroids"].splice(idx, 1);
                  }
              }
                
                world.removeBody(event.body);
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

export {animate}
