import * as THREE from 'three';
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0?dts";
import { addPhysics } from './physicsSetup';

const noise = new SimplexNoise();
function createAsteroid(baseRadius = 1) {
  // Base sphere randomized asteroid effect
  const geometry = new THREE.SphereGeometry(baseRadius, 32, 32);
  const pos = geometry.attributes.position;
  const vec = new THREE.Vector3();

  // Smooth noise displacement for bumps/craters
  for (let i = 0; i < pos.count; i++) {
    vec.fromBufferAttribute(pos, i);
    const n = noise.noise3D(vec.x * 1, vec.y * 1, vec.z * 1);
    const displacement = n * 0.3; 
    vec.addScaledVector(vec.clone().normalize(), displacement);
    pos.setXYZ(i, vec.x, vec.y, vec.z);
  }

  geometry.computeVertexNormals();

  // Load texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('./resources/asteroid_texture.jpg');

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

  // Random scaling
    const scaleX = (Math.random() * 0.5) + 0.75;
    const scaleY = (Math.random() * 0.5) + 0.75;
    const scaleZ = (Math.random() * 0.5) + 0.75;

    asteroid.scale.set(scaleX, scaleY, scaleZ);


    asteroid.castShadow = true;
    asteroid.receiveShadow = true;

  return asteroid;
}


function spawnAsteroid(asteroid, position, world, scene, asteroids, mass, size, velocity = null) {
  // --- Position asteroid ---
  asteroid.position.copy(position);
  scene.add(asteroid);
  // --- Add physics ---
  const body = addPhysics(asteroid, world, { shapeType: 'sphere', mass: mass, radius: size });
  body.objectType = 'asteroid'; // Mark as asteroid for gravity calculations

  // Heavily reduce spinning by adding high angular damping
  body.angularDamping = 0.999; // Higher = less spinning (0-1 range)

  // Limit angular velocity to prevent super-fast spinning
  body.angularVelocity.set(0, 0, 0);

  // Apply initial velocity if provided
  if (velocity) {
    body.velocity.set(velocity.x, velocity.y, velocity.z);
  }

  // --- Track asteroid ---
  asteroids.push(asteroid);
}


export { createAsteroid, spawnAsteroid };
