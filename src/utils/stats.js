import Stats from 'three/examples/jsm/libs/stats.module.js';

function setupStats() {
  const stats = Stats();
  document.body.appendChild(stats.dom);
  return stats;
}

export { setupStats };
