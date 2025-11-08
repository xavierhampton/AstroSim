import * as THREE from 'three';

function createClouds() {
    const radius = 3;
    const segments = 128;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
  
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('../resources/cloud_texture.png');
  
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
    });
    
    const clouds = new THREE.Mesh(geometry.clone(), material);
    clouds.scale.multiplyScalar(1.02);

    clouds.castShadow = true;
    clouds.receiveShadow = true;

    return clouds;
}

export { createClouds };
