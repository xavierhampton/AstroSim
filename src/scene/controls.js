import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  return controls;
}

export { createControls };
