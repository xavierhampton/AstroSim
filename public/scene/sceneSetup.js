import * as THREE from 'three';
import { setupSkybox } from './skybox.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
setupSkybox(scene);

document.body.appendChild(renderer.domElement);

export { scene, camera, renderer };
