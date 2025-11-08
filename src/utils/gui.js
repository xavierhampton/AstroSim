import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
function setupGUI(camera) {
  const gui = new GUI();

  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(camera.position, 'z', 0, 10);
  cameraFolder.open();

  return gui;
}

export { setupGUI };
