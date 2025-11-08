import * as THREE from 'three';
import { setupSkybox } from './skybox.js';
import { createAsteroid } from './asteroid.js';
import { addPhysics, world } from './physicsSetup.js';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
setupSkybox(scene);

//Cool Sunlight looking effect
const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(5, 2, 5);
scene.add(sunLight);

//Ambient Lighting so it isnt black 
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);


//SPAWNS N ASTEROIDS, TEMPORARY
// const asteroids = []
// for (let i = 0; i < 1; i++) {
//   const asteroid = createAsteroid(
//     0.5 + Math.random() * 3 // radius
//   );
//   asteroid.position.set(
//     (Math.random() - 0.5) * 30,
//     (Math.random() - 0.5) * 30,
//     (Math.random() - 0.5) * 30
//   );
//   scene.add(asteroid);
//   addPhysics(asteroid, world, { shapeType: 'sphere', mass: 1, radius: 1 });
//   asteroids.push(asteroid);
// }


document.body.appendChild(renderer.domElement);

export { scene, camera, renderer};
