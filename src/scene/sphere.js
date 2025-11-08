import * as THREE from 'three';
import { addPhysics, setupPhysics, world } from './physicsSetup.js';


function createSphere() {
  const radius = 3;
  const segments = 128;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('./resources/earth.jpg'); 
  const stoneTexture = textureLoader.load('./resources/stone.jpg')
    
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



  const coreMaterial = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color(0xff6600), // orange glow
    emissiveIntensity: 2,
    color: 0x552200,
    roughness: 0.3,
    metalness: 0.8,
  });

  const core = new THREE.Mesh(geometry.clone(), coreMaterial);
  core.scale.multiplyScalar(0.4);

  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0x777777,
    roughness: 1.0,
    metalness: 0.0,
  });
  const stoneLayer = new THREE.Mesh(geometry.clone(), stoneMaterial);
  stoneLayer.scale.multiplyScalar(0.97);


  //Make sphere slightly larger
  const rimSphere = new THREE.Mesh(geometry.clone(), rimMaterial);
  rimSphere.scale.multiplyScalar(1.02);

  const earth = new THREE.Mesh(geometry, material);
  earth.add(rimSphere);
  earth.add(stoneLayer);
  earth.add(core);

  earth.castShadow = true;
  earth.receiveShadow = true;

  //Add to physics sim
  const body = addPhysics(earth, world, { shapeType: 'sphere', mass: 200, radius: 3 });
  body.angularDamping = 0.8;

  return earth;
}

export { createSphere };
