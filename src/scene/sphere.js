import * as THREE from 'three';
import { addPhysics, setupPhysics, world } from './physicsSetup.js';


function createSphere() {
  // Earth scale: radius = 3 units (represents ~6371 km actual Earth radius)
  // For asteroids: 1 unit ≈ 2124 km, so asteroid inputs are roughly in thousands of km
  const radius = 3;
  const segments = 128;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('./resources/earth.jpg'); 
  const stoneTexture = textureLoader.load('./resources/stone.jpg')
    
  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    side: THREE.FrontSide, // Only render front-facing polygons
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
    emissive: new THREE.Color(0xffaa33), 
    emissiveIntensity: 10,               
    color: 0x552200,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.FrontSide,
  });

  const core = new THREE.Mesh(geometry.clone(), coreMaterial);
  core.scale.multiplyScalar(0.8);

  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0x777777,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.FrontSide, // Only render front-facing polygons
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
  // Earth mass: 2000 units (arbitrary scale - asteroids use same scale)
  const body = addPhysics(earth, world, { shapeType: 'sphere', mass: 2000, radius: 3 });
  body.angularDamping = 0.8;
  body.objectType = 'earth'; // Mark as Earth for gravity calculations

  return earth;
}

export { createSphere };
