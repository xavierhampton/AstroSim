import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  // Prevent weird rotation behavior when earth spins
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 5;
  controls.maxDistance = 50;

  return controls;
}

export { createControls };
