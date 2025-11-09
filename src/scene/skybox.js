import * as THREE from "three";

function setupSkybox(scene) {
    createStarfield(scene);
}

// Creates stars as small meshes so bloom can affect them
function createStarfield(scene, count = 500) {
    const minDistance = 25;
    const stars = new THREE.Group();

    for (let i = 0; i < count; i++) {
        let distance = 0;
        let x, y, z;

        while (distance < minDistance) {
            x = (Math.random() - 0.5) * 200;
            y = (Math.random() - 0.5) * 200;
            z = (Math.random() - 0.5) * 200;
            distance = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        }

        const geometry = new THREE.SphereGeometry(0.3, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            blending: THREE.AdditiveBlending, // Glow effect
            transparent: true,
        });

        const star = new THREE.Mesh(geometry, material);
        star.position.set(x, y, z);
        stars.add(star);
    }

    scene.add(stars);
    return stars;
}

export { setupSkybox };
