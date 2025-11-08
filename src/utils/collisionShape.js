import * as CANNON from 'cannon-es';
import * as THREE from 'three';

function createCannonShapeFromMesh(mesh) {
  let geometry = mesh.geometry.clone();
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  geometry = new THREE.BufferGeometry().fromGeometry(geometry); // ensure it's a BufferGeometry

  const position = geometry.attributes.position;
  const vertices = [];
  for (let i = 0; i < position.count; i++) {
    vertices.push(new CANNON.Vec3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    ));
  }

  // Faces
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
    for (let i = 0; i < position.count; i += 3) {
      faces.push([i, i + 1, i + 2]);
    }
  }

  const shape = new CANNON.ConvexPolyhedron({ vertices, faces });
  return shape;
}

export {createCannonShapeFromMesh}
