import { GUI } from '../jsm/libs/lil-gui.module.min.js';

function setupGUI(cube, camera) {
  const gui = new GUI();

  const cubeFolder = gui.addFolder('Cube');
  cubeFolder.add(cube.scale, 'x', -5, 5);
  cubeFolder.add(cube.scale, 'y', -5, 5);
  cubeFolder.add(cube.scale, 'z', -5, 5);
  cubeFolder.open();

  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(camera.position, 'z', 0, 10);
  cameraFolder.open();

  return gui;
}

export { setupGUI };
