import * as THREE from 'three';

const TEN_TWENTY = {
  Fp1: [-0.25, 0.55, 0.75], Fp2: [0.25, 0.55, 0.75], F7: [-0.65, 0.25, 0.55],
  F3: [-0.30, 0.35, 0.80], Fz: [0, 0.40, 0.90], F4: [0.30, 0.35, 0.80], F8: [0.65, 0.25, 0.55],
  T3: [-0.90, 0, 0.10], C3: [-0.35, 0.05, 0.90], Cz: [0, 0.10, 1], C4: [0.35, 0.05, 0.90],
  T4: [0.90, 0, 0.10], T5: [-0.70, -0.35, 0.20], P3: [-0.30, -0.25, 0.85],
  Pz: [0, -0.20, 0.95], P4: [0.30, -0.25, 0.85], T6: [0.70, -0.35, 0.20],
  O1: [-0.25, -0.65, 0.60], O2: [0.25, -0.65, 0.60],
};

export function attachElectrodes({ brain, scene, camera, channels, onSelect }) {
   const raycaster = new THREE.Raycaster();
   const pointer = new THREE.Vector2();
   const nodes = [];
   const group = new THREE.Group();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const nodes = [];
  const group = new THREE.Group();
  scene.add(group);

  channels.forEach((name, i) => {
    const pos = TEN_TWENTY[name];
    if (!pos) return;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x7c5cff, emissiveIntensity: 0.6 }),
    );
    node.position.set(...pos);
    node.userData = { channelIndex: i, channelName: name };
    group.add(node);
    nodes.push(node);
  });

  const canvas = document.getElementById('scene');
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(nodes)[0];
    if (hit) {
      const { channelIndex, channelName } = hit.object.userData;
      onSelect(channelIndex, channelName, 0);
    }
  });
}
