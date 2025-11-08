function animate(meshmap, controls, render, stats) {
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
    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
