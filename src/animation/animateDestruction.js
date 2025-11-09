import * as CANNON from 'cannon-es';
import * as THREE from 'three'

import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0?dts";

const simplex = new SimplexNoise();

//N -body gravity function
function applyNBodyGravity(bodies, G = 1) {
  // Filter out null or undefined bodies
  const validBodies = bodies.filter(b => b && b.mass !== 0);

  for (let i = 0; i < validBodies.length; i++) {
    const bi = validBodies[i];
    for (let j = i + 1; j < validBodies.length; j++) {
      const bj = validBodies[j];

      const rVec = new CANNON.Vec3();
      bj.position.vsub(bi.position, rVec);

      const distSq = rVec.lengthSquared() + 0.001; // avoid divide by zero
      const forceMag = (G * bi.mass * bj.mass) / distSq;

      rVec.normalize();
      const force = rVec.scale(forceMag);

      bi.applyForce(force, bi.position);
      bj.applyForce(force.scale(-1), bj.position);
    }
  }
}


function deformEarth(earthMesh, clouds, collisionPoint, radius = 0.5, strength = 1) {
  const localCollision = collisionPoint.clone();
  earthMesh.worldToLocal(localCollision);

  const meshesToDeform = [earthMesh, clouds, ...earthMesh.children];

  const center = new THREE.Vector3(0, 0, 0);
  const tempVec = new THREE.Vector3();

  meshesToDeform.forEach((mesh, idx) => {
    const position = mesh.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      tempVec.fromBufferAttribute(position, i);
      const dist = tempVec.distanceTo(localCollision);
      if (dist < radius) {
        // Mass controls depth, radius controls size but reduces depth
        // Larger radius = wider crater but shallower
        const depthFactor = strength / (radius * 3); // Mass increases depth, larger radius decreases it
        let push = (1 - dist / radius) * depthFactor;

        // Add subtle noise factor to make rock look jagged and tougher
        const noise = simplex.noise3D(tempVec.x * 3, tempVec.y * 3, tempVec.z * 3);
        const noiseFactor = 1.0 + noise * 0.3; // ±20% variance

        // Different toughness based on layer
        if (mesh === earthMesh.children[1]) {
          // Stone layer: harder, less deformation
          push *= 0.5 * noiseFactor;
        } else if (mesh === earthMesh.children[2]) {
          // Core: hardest, minimal deformation
          push *= 0.3;
        } else {
          // Outer crust or clouds: most malleable, deforms more to hide stone layer
          push *= 1.5 * noiseFactor;
        }

        const radialDir = tempVec.clone().sub(center).normalize();

        // Check how far we'd push, and clamp if it would go past center
        const currentDist = tempVec.length();
        const minAllowedDist = 0.2; // Minimum distance from center

        // Only push as much as we can without crossing the minimum
        const maxPush = currentDist - minAllowedDist;
        const actualPush = Math.min(push, maxPush);

        tempVec.addScaledVector(radialDir, -actualPush);
        position.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
      }
    }

    position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  });
}

function spawnExplosion(scene, position, numParticles = 50) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < numParticles; i++) {
    vertices.push(position.x, position.y, position.z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const material = new THREE.PointsMaterial({ color: 0xffaa33, size: 0.2 });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const velocities = [];
  for (let i = 0; i < vertices.length / 3; i++) {
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    ));
  }

  let t = 0;
  function explode() {
    t++;
    const pos = points.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = velocities[i];
      pos.setXYZ(i,
        pos.getX(i) + v.x,
        pos.getY(i) + v.y,
        pos.getZ(i) + v.z
      );
    }
    pos.needsUpdate = true;

    if (t < 30) requestAnimationFrame(explode);
    else scene.remove(points);
  }
  explode();
}


function explodeAsteroid(scene, asteroidMesh, numPieces = 30, force = 0.5) {

  const asteroidWorldPos = new THREE.Vector3();
  asteroidMesh.getWorldPosition(asteroidWorldPos);

  for (let i = 0; i < numPieces; i++) {
    // Create a small shard
    const shardRadius = 0.3 + Math.random() * 0.2;
    const shardGeometry = new THREE.SphereGeometry(shardRadius, 4, 4);

    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 1,
      metalness: 0,
    });

    const shard = new THREE.Mesh(shardGeometry, material);

    // Position shards randomly around the asteroid
    shard.position.copy(asteroidWorldPos);
    shard.position.x += (Math.random() - 0.5) * 0.5;
    shard.position.y += (Math.random() - 0.5) * 0.5;
    shard.position.z += (Math.random() - 0.5) * 0.5;

    shard.castShadow = true;
    shard.receiveShadow = true;

    scene.add(shard);

    // Random velocity
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * force,
      (Math.random() - 0.5) * force,
      (Math.random() - 0.5) * force
    );

    // Animate shard
    let t = 0;
    const lifespan = 100;
    function moveShard() {
      t++;
      shard.position.add(velocity);
      shard.rotation.x += Math.random() * 0.1;
      shard.rotation.y += Math.random() * 0.1;
      shard.rotation.z += Math.random() * 0.1;

      if (t < lifespan) requestAnimationFrame(moveShard);
      else scene.remove(shard);
    }
    moveShard();
  }
}




export { applyNBodyGravity, spawnExplosion, deformEarth, explodeAsteroid };
