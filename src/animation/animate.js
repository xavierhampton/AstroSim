import * as CANNON from 'cannon-es';
import * as THREE from 'three'

function animate(meshmap, controls, render, stats, world, scene) {
  const sphere = meshmap["sphere"];
  const clouds = meshmap["clouds"];
  const speed = 0.00001;
  const xspeed = 6;

  // N-body gravity constant
  const G = 5;

  function loop() {
    requestAnimationFrame(loop);


    // Rotate sphere & clouds
    sphere.rotation.x += xspeed * speed;
    sphere.rotation.y += 20 * speed;
    clouds.rotation.x += xspeed * speed;
    clouds.rotation.y += 20 * speed;

    if (clouds.material.map) {
      clouds.material.map.offset.x -= 0.2 * xspeed * speed;
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
    world.step(1 / 60);

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
      const contactPoint = new THREE.Vector3(cp.x, cp.y, cp.z);

      // Create one big crater
      deformEarth(sphere, contactPoint, 2, 1.5); // increase radius & strength for bigger crater
      spawnExplosion(scene, contactPoint, 100);


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
    // Update controls, render, stats
    controls.target.copy(sphere.position); 
    controls.update();
    render();
    stats.update();
  }

  loop();
}

//N -body gravity function
function applyNBodyGravity(bodies, G = 1) {
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    if (bi.mass === 0) continue;

    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      if (bj.mass === 0) continue;

      const rVec = new CANNON.Vec3();
      bj.position.vsub(bi.position, rVec);

      const distSq = rVec.lengthSquared() + 0.001; // avoid divide by zero
      const forceMag = (G * bi.mass * bj.mass) / distSq;

      rVec.normalize();
      const force = rVec.scale(forceMag);

      bi.applyForce(force, bi.position);
      bj.applyForce(force.scale(-1), bj.position);
    }
  }
}

