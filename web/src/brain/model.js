import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function loadBrain(scene) {
  const loader = new GLTFLoader();
  const modelUrl = `${import.meta.env.BASE_URL}models/brain.glb`;

  try {
    const gltf = await loader.loadAsync(modelUrl);
    const brain = gltf.scene;

    brain.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({
          color: 0xb8b0d8,
          roughness: 0.7,
          metalness: 0.05,
        });
      }
    });
    
    const box = new THREE.Box3().setFromObject(brain);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = size.length() / 2;
    const targetRadius = 1;
    const scale = targetRadius / radius;

    brain.position.sub(center.multiplyScalar(scale));
    brain.scale.setScalar(scale);

    scene.add(brain);
    return brain;
  } catch (e) {
    console.warn(`brain model could not be loaded from ${modelUrl} — using sphere placeholder`, e);

    const geo = new THREE.SphereGeometry(1, 64, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb8b0d8,
      roughness: 0.7,
    });

    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);
    return sphere;
  }
}
