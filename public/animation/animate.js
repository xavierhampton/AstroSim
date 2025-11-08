function animate(meshmap, controls, render, stats) {
  const sphere = meshmap["sphere"];
  const clouds = meshmap["clouds"];
  const speed = 0.0001;
  const xspeed = 1;
  function loop() {
    requestAnimationFrame(loop);
    sphere.rotation.x += xspeed * speed;
    sphere.rotation.y += 2 * speed;
    clouds.rotation.x += xspeed * speed;
    clouds.rotation.y += 1 * speed;
    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
