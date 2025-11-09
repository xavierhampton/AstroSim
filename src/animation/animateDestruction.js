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
  const originalVec = new THREE.Vector3();
 
  meshesToDeform.forEach((mesh, idx) => {
    const position = mesh.geometry.attributes.position;

    // Initialize original positions and deformation tracking if not already done
    if (!mesh.userData.originalPositions) {
      mesh.userData.originalPositions = new Float32Array(position.count * 3);
      mesh.userData.cumulativeDeformation = new Float32Array(position.count);

      for (let i = 0; i < position.count; i++) {
        mesh.userData.originalPositions[i * 3] = position.getX(i);
        mesh.userData.originalPositions[i * 3 + 1] = position.getY(i);
        mesh.userData.originalPositions[i * 3 + 2] = position.getZ(i);
        mesh.userData.cumulativeDeformation[i] = 0;
      }
    }

    // Maximum allowed deformation as a percentage of the original distance from center
    const MAX_DEFORMATION_PERCENT = 0.95; // 15% max deformation

    for (let i = 0; i < position.count; i++) {
      // Use original positions for distance calculation
      originalVec.set(
        mesh.userData.originalPositions[i * 3],
        mesh.userData.originalPositions[i * 3 + 1],
        mesh.userData.originalPositions[i * 3 + 2]
      );

      const dist = originalVec.distanceTo(localCollision);
      if (dist < radius) {
        // Mass controls depth, radius controls size but reduces depth
        // Larger radius = wider crater but shallower
        const depthFactor = strength / (radius * 3); // Mass increases depth, larger radius decreases it
        let push = (1 - dist / radius) * depthFactor;

        // Add subtle noise factor to make rock look jagged and tougher
        const noise = simplex.noise3D(originalVec.x * 3, originalVec.y * 3, originalVec.z * 3);
        const noiseFactor = 1.0 + noise * 0.3; // ±30% variance

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

        const radialDir = originalVec.clone().sub(center).normalize();

        // Check cumulative deformation limit
        const originalDist = originalVec.length();
        const maxAllowedDeformation = originalDist * MAX_DEFORMATION_PERCENT;
        const remainingDeformation = maxAllowedDeformation - mesh.userData.cumulativeDeformation[i];

        // Clamp push to remaining allowed deformation
        const actualPush = Math.max(0, Math.min(push, remainingDeformation));

        // Check how far we'd push, and clamp if it would go past center
        const minAllowedDist = 0.5; // Minimum distance from center (increased from 0.2)
        const currentDist = originalVec.length() - mesh.userData.cumulativeDeformation[i];
        const maxPushFromCenter = currentDist - minAllowedDist;
        const finalPush = Math.min(actualPush, maxPushFromCenter);

        // Update cumulative deformation
        mesh.userData.cumulativeDeformation[i] += finalPush;

        // Apply deformation from original position
        tempVec.copy(originalVec).addScaledVector(radialDir, -mesh.userData.cumulativeDeformation[i]);
        position.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
      }
    }

    position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  });
}


// Camera shake - scales with strength (density)
function shakeCamera(camera, strength = 1) {
  const orig = camera.position.clone();
  let t = 0;
  function shake() {
    const decay = 1 - t++ / 30;
    camera.position.set(
      orig.x + (Math.random() - 0.5) * strength * decay * 0.1,
      orig.y + (Math.random() - 0.5) * strength * decay * 0.1,
      orig.z + (Math.random() - 0.5) * strength * decay * 0.1
    );
    if (t < 30) requestAnimationFrame(shake);
    else camera.position.copy(orig);
  }
  shake();
}

function spawnExplosion(scene, position, strength = 1, composer = null, camera = null) {
  if (camera) shakeCamera(camera, strength);

  const fireballs = [];
  const n = Math.floor(15 + strength * 5);

  // Create explosive fireballs shooting outward
  for (let i = 0; i < n; i++) {
    const size = (0.2 + Math.random() * 0.3) * strength * 0.25; // 75% smaller
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3), // Orange to yellow
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    const ball = new THREE.Mesh(geo, mat);
    ball.position.copy(position);
    scene.add(ball);

    // Random outward velocity - spherical distribution (slower)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = (0.05 + Math.random() * 0.05) * strength; // Much slower
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    fireballs.push({ mesh: ball, vel, geo, mat, life: 0, maxLife: 40 + Math.random() * 30 }); // Longer life
  }

  // Dust/smoke ring
  const dustGeo = new THREE.TorusGeometry(0.1 * strength * 0.25, 0.3 * strength * 0.25, 8, 16); // 75% smaller
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.4,
    blending: THREE.NormalBlending
  });
  const dust = new THREE.Mesh(dustGeo, dustMat);
  dust.position.copy(position);
  dust.lookAt(position.clone().add(new THREE.Vector3(0, 1, 0)));
  scene.add(dust);

  let t = 0;
  function anim() {
    t++;
    const globalProgress = t / 50;

    // Animate fireballs
    fireballs.forEach((fb, idx) => {
      fb.life++;
      const p = fb.life / fb.maxLife;

      // Move
      fb.mesh.position.add(fb.vel);
      fb.vel.multiplyScalar(0.98); // Less deceleration

      // Scale and fade - much slower scaling
      fb.mesh.scale.setScalar(1 + p * 0.2);
      fb.mat.opacity = Math.max(0, 1 - p);

      // Color shift from white-yellow to red-orange
      fb.mat.color.setHSL(Math.min(0.1, p * 0.1), 1, Math.max(0.2, 0.7 - p * 0.5));

      if (fb.life >= fb.maxLife) {
        scene.remove(fb.mesh);
        fb.geo.dispose();
        fb.mat.dispose();
        fireballs.splice(idx, 1);
      }
    });

    // Expand and fade dust
    dust.scale.setScalar(1 + globalProgress * 4);
    dustMat.opacity = Math.max(0, 0.4 - globalProgress * 0.6);

    if (t < 50 && fireballs.length === 0) {
      scene.remove(dust);
      dustGeo.dispose();
      dustMat.dispose();
      return;
    }

    if (t < 50 || fireballs.length > 0) {
      requestAnimationFrame(anim);
    } else {
      scene.remove(dust);
      dustGeo.dispose();
      dustMat.dispose();
    }
  }
  anim();
}


function explodeAsteroid(scene, mesh, strength = 1, force = 0.5, composer = null, camera = null) {
  const pos = new THREE.Vector3();
  mesh.getWorldPosition(pos);

  spawnExplosion(scene, pos, strength, composer, camera);

  for (let i = 0; i < 10; i++) { // Minimal debris
    const geo = new THREE.SphereGeometry(0.2, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xff6600 : 0x888888,
      transparent: true
    });
    const shard = new THREE.Mesh(geo, mat);
    shard.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y + (Math.random() - 0.5) * 0.5, pos.z + (Math.random() - 0.5) * 0.5);
    scene.add(shard);

    const vel = new THREE.Vector3((Math.random() - 0.5) * force, (Math.random() - 0.5) * force, (Math.random() - 0.5) * force);
    let t = 0;
    function move() {
      shard.position.add(vel);
      shard.rotation.x += 0.05;
      shard.rotation.y += 0.05;
      mat.opacity = 1 - t++ / 80;
      if (t < 80) requestAnimationFrame(move);
      else {
        scene.remove(shard);
        geo.dispose();
        mat.dispose();
      }
    }
    move();
  }
}




export { applyNBodyGravity, spawnExplosion, deformEarth, explodeAsteroid};
