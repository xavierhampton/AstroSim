function animate(meshmap, controls, render, stats, world) {
  const sphere = meshmap["sphere"];
  const clouds = meshmap["clouds"];
  const speed = 0.00001;
  const xspeed = 6;
  function loop() {
    requestAnimationFrame(loop);
    sphere.rotation.x += xspeed * speed;
    sphere.rotation.y += 20 * speed;
    clouds.rotation.x += xspeed * speed;
    clouds.rotation.y += 20 * speed;

    if (clouds.material.map) {
      clouds.material.map.offset.x -= 0.2 * xspeed * speed; // horizontal cloud movement
    }



    world.step(1 / 60);

Object.values(meshmap).forEach((entry) => {
  if (Array.isArray(entry)) {
    // If it's an array (like asteroids), sync each one
    entry.forEach((mesh) => {
      const body = mesh.userData?.physicsBody;
      if (body) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      }
    });
  } else {
    // Normal single mesh (sphere, clouds, etc.)
    const body = entry.userData?.physicsBody;
    if (body) {
      entry.position.copy(body.position);
      entry.quaternion.copy(body.quaternion);
    }
  }
  });

    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
