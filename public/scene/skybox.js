import * as THREE from "three"


  function setupSkybox(scene) {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    '../resources/skybox/sky_right1.png',
    '../resources/skybox/sky_left2.png',
    '../resources/skybox/sky_top3.png',
    '../resources/skybox/sky_bottom4.png',
    '../resources/skybox/sky_front5.png',
    '../resources/skybox/sky_back6.png',
  ]);
  scene.background = texture;
}

export { setupSkybox };