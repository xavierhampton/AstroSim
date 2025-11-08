import * as CANNON from 'cannon-es';
import * as THREE from 'three'

//N -body gravity function
function applyNBodyGravity(bodies, G = 1) {
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    if (bi.mass === 0) continue;

    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      if (bj.mass === 0) continue;

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

function deformEarth(earthMesh, clouds, collisionPoint, radius = 1, strength = 0.5) {
  // Convert collision point to local space of the sphere
  const localCollision = collisionPoint.clone();
  earthMesh.worldToLocal(localCollision);

  const meshesToDeform = [earthMesh, clouds];
  // Add rim sphere if it exists
  if (earthMesh.children.length > 0) {
    meshesToDeform.push(earthMesh.children[0]);
  }

  const center = new THREE.Vector3(0, 0, 0);
  const tempVec = new THREE.Vector3();

  meshesToDeform.forEach((mesh) => {
    const position = mesh.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      tempVec.fromBufferAttribute(position, i);

      const dist = tempVec.distanceTo(localCollision);
      if (dist < radius) {
        const push = (1 - dist / radius) * strength;

        // Radial direction from center to vertex
        const radialDir = tempVec.clone().sub(center).normalize();

        // Move vertex inward to form crater
        tempVec.addScaledVector(radialDir, -push);

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

export { applyNBodyGravity, spawnExplosion, deformEarth };
