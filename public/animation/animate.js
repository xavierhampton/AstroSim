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
    clouds.rotation.y += 10 * speed;
    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
