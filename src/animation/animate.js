import * as CANNON from 'cannon-es';

function animate(meshmap, controls, render, stats, world, camera) {
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
          if (body) {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
          }
        });
      } else {
        const body = entry.userData?.physicsBody;
        if (body) {
          entry.position.copy(body.position);
          entry.quaternion.copy(body.quaternion);
        }
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

export { animate };
