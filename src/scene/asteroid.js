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


function spawnAsteroid(asteroid, event, camera, world, scene, asteroids) {
  // --- Convert mouse click to normalized device coordinates ---
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  // --- Create ray from camera through mouse ---
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // --- Define spawn point some units in front of camera ---
  const planeDistance = 10; // adjust as needed
  const spawnPoint = new THREE.Vector3();
  spawnPoint.copy(raycaster.ray.origin).add(raycaster.ray.direction.multiplyScalar(planeDistance));

  // --- Position asteroid ---
  asteroid.position.copy(spawnPoint);
  scene.add(asteroid);

  // --- Add initial velocity in camera forward direction ---
  const speed = 10; // adjust as needed
  const velocity = new THREE.Vector3();
  camera.getWorldDirection(velocity).multiplyScalar(speed);
  asteroid.userData.velocity = velocity; // optional if you want to track manually

  // --- Add physics ---
  // Use sphere shape for stability - complex shapes cause crashes on asteroid-asteroid collisions
  const avgScale = (asteroid.scale.x + asteroid.scale.y + asteroid.scale.z) / 3;
  const body = addPhysics(asteroid, world, { shapeType: 'sphere', mass: 1, radius: avgScale });

  // Reduce spinning by adding angular damping
  body.angularDamping = 0.8; // Higher = less spinning (0-1 range)

  asteroids.push(asteroid);
}


export { createAsteroid, spawnAsteroid };
