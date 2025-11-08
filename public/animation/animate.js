function animate(cube, controls, render, stats) {
  function loop() {
    requestAnimationFrame(loop);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls.update();
    render();
    stats.update();
  }
  loop();
}

export { animate };
