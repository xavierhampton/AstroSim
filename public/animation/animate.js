function animate(sphere, controls, render, stats) {
  function loop() {
    requestAnimationFrame(loop);
    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.001;
    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
