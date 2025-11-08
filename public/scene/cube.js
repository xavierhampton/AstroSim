import * as THREE from 'three';

function createSphere() {
  const radius = 3;
  const segments = 128;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

export { createSphere };
