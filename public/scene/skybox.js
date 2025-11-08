import * as THREE from "three"


function setupSkybox(scene) {
    createStarfield(scene)
}

//Uses THREE points system to make cool stars that feel real
function createStarfield(scene, count = 1000) {
  const starsGeometry = new THREE.BufferGeometry();
  const positions = [];

  //Random Positions
  const min_distance = 25
  for (let i = 0; i < count; i++) {
    let distance = 0;
    let x,y,z;
    while (distance < min_distance) {
        x = (Math.random() - 0.5) * 200;
        y = (Math.random() - 0.5) * 200;
        z = (Math.random() - 0.5) * 200;
        distance = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
    }

    
    positions.push(x, y, z);
  }

  //Applies positions to the starfield
  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  //Material for stars, opacity to make it non-obtrusive
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.8,
  });
  
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
}


export { setupSkybox };