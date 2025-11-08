import { scene, camera, renderer } from './scene/sceneSetup.js';
import { createSphere } from './scene/cube.js';
import { createControls } from './scene/controls.js';
import { handleResize } from './utils/resizeHandler.js';
import { setupStats } from './utils/stats.js';
import { setupGUI } from './utils/gui.js';
import { animate } from './animation/animate.js';

const sphere = createSphere();
scene.add(sphere);

const controls = createControls(camera, renderer);
const stats = setupStats();
setupGUI(sphere, camera);

function render() {
  renderer.render(scene, camera);
}

handleResize(camera, renderer, render);
animate(sphere, controls, render, stats);
