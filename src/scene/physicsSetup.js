import * as CANNON from 'cannon-es';

let world;

function setupPhysics() {
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0), 
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;

  return world;
}

function addPhysics(mesh, world, { shapeType = 'sphere', mass = 0, radius = 1 } = {}) {
  let shape;

  if (shapeType === 'sphere') {
    shape = new CANNON.Sphere(radius);
  } else {
    const box = new CANNON.Box(
      new CANNON.Vec3(mesh.scale.x / 2, mesh.scale.y / 2, mesh.scale.z / 2)
    );
    shape = box;
  } 

  const body = new CANNON.Body({ mass, shape });
  body.position.copy(mesh.position);
  body.quaternion.copy(mesh.quaternion);

  world.addBody(body);
  mesh.userData.physicsBody = body;

  return body;
}



export { setupPhysics, addPhysics, world };
