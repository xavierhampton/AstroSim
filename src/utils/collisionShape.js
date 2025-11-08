import * as CANNON from 'cannon-es';
import * as THREE from 'three';

function createCannonShapeFromMesh(mesh) {
  const geometry = mesh.geometry.clone();
  const position = geometry.attributes.position;

  // Collect vertices
  const vertices = [];
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    // apply mesh scale if needed
    vertex.multiply(mesh.scale);
    vertices.push(new CANNON.Vec3(vertex.x, vertex.y, vertex.z));
  }

  // Collect faces
  const faces = [];
  if (geometry.index) {
    for (let i = 0; i < geometry.index.count; i += 3) {
      faces.push([
        geometry.index.getX(i),
        geometry.index.getX(i + 1),
        geometry.index.getX(i + 2),
      ]);
    }
  } else {
    for (let i = 0; i < vertices.length; i += 3) {
      faces.push([i, i + 1, i + 2]);
    }
  }

  // Create ConvexPolyhedron
  try {
    const shape = new CANNON.ConvexPolyhedron({ vertices, faces });
    return shape;
  } catch (e) {
    console.warn('Failed to create ConvexPolyhedron, falling back to sphere:', e);
    const radius = mesh.scale.length() / 2;
    return new CANNON.Sphere(radius);
  }
}

export { createCannonShapeFromMesh };
