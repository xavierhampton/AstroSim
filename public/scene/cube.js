import * as THREE from 'three';

function createCube() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  return cube;
}

export { createCube };
