import { scene, camera, renderer } from './scene/sceneSetup.js';
import { createCube } from './scene/cube.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupStats } from './utils/stats.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';

const cube = createCube();
scene.add(cube);

const controls = createControls(camera, renderer);
const stats = setupStats();
setupGUI(cube, camera);

function render() {
  renderer.render(scene, camera);
}

handleResize(camera, renderer, render);
animate(cube, controls, render, stats);
