import * as THREE from 'three';
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0?dts";

const noise = new SimplexNoise();
function createAsteroid(baseRadius = 1) {
  // Base low-poly icosahedron for randomized asteroid effect
  const geometry = new THREE.IcosahedronGeometry(baseRadius, 2);
  const pos = geometry.attributes.position;
  const vec = new THREE.Vector3();

  // Smooth noise displacement for bumps/craters
  for (let i = 0; i < pos.count; i++) {
    vec.fromBufferAttribute(pos, i);
    const n = noise.noise3D(vec.x * 3, vec.y * 3, vec.z * 3);
    const displacement = n * 0.3; 
    vec.addScaledVector(vec.clone().normalize(), displacement);
    pos.setXYZ(i, vec.x, vec.y, vec.z);
  }

  geometry.computeVertexNormals();

  // Load texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('../resources/asteroid_texture.jpg');

  // Base asteroid mesh
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.2,
    roughness: 1,
    metalness: 0,
  });

  const asteroid = new THREE.Mesh(geometry, material);

  //Outline glow effect like earth
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,          
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2,
  });

  const rimSphere = new THREE.Mesh(geometry.clone(), rimMaterial);
  rimSphere.scale.multiplyScalar(1.05); 
  asteroid.add(rimSphere);

  // Random rotation
  asteroid.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

    asteroid.castShadow = true;
    asteroid.receiveShadow = true;

  return asteroid;
}

export { createAsteroid };
