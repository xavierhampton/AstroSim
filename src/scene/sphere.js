import * as THREE from 'three';
import { addPhysics, setupPhysics, world } from './physicsSetup.js';


function createSphere() {
  const radius = 3;
  const segments = 128;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('./resources/earth.jpg'); 
    
  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
  });

  //Material for outline effect
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.4,
  });

  //Make sphere slightly larger
  const rimSphere = new THREE.Mesh(geometry.clone(), rimMaterial);
  rimSphere.scale.multiplyScalar(1.02);

  const earth = new THREE.Mesh(geometry, material);
  earth.add(rimSphere);

  earth.castShadow = true;
  earth.receiveShadow = true;

  //Add to physics sim
  addPhysics(earth, world, { shapeType: 'sphere', mass: 5, radius: 3 });
  return earth;
}

export { createSphere };
