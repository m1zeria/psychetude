import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function makeBrainMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xb8b0d8,
    roughness: 0.7,
    metalness: 0.05,
    emissive: 0x120d24,
    emissiveIntensity: 0.15,
  });
}

export async function loadBrain(scene) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync('./models/brain.glb');
    const brain = gltf.scene;

    brain.traverse((node) => {
      if (node.isMesh) {
        node.material = makeBrainMaterial();
      }
    });

    const box = new THREE.Box3().setFromObject(brain);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / maxDim;

    brain.scale.setScalar(scale);
    brain.position.y = 0.1;
    brain.rotation.y = -0.8;
    brain.rotation.x = 0.15;
    scene.add(brain);
    return brain;
  } catch (error) {
    console.warn('brain.glb failed to load, using sphere fallback', error);
    const fallback = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 48),
      makeBrainMaterial(),
    );
    fallback.scale.set(1.35, 1.18, 1.0);
    fallback.rotation.z = 0.15;
    fallback.rotation.x = -0.2;
    fallback.rotation.y = -0.7;
    scene.add(fallback);
    return fallback;
  }
}
