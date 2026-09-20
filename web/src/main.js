import { initScene } from './brain/scene.js';
import { loadBrain } from './brain/model.js';
import { attachElectrodes } from './brain/electrodes.js';
import { loadData } from './data/loader.js';
import { createEngine } from './audio/engine.js';
import { updateHUD } from './ui/hud.js';

async function boot() {
  const canvas = document.getElementById('scene');
  const { scene, camera, renderer, controls } = initScene(canvas);
  const brain = await loadBrain(scene);
  const data = await loadData();
  const engine = createEngine();
  const statusEl = document.getElementById('status');
  const setStatus = (s) => { if (statusEl) statusEl.textContent = s; };
  setStatus(data.meta._fallback ? 'using fallback data — fetch failed' : 'click the brain to begin');

  attachElectrodes({ brain, scene, camera, channels: data.meta.channels,
    onSelect: (channelIndex, channelName, frame) => {
      const frameData = data.frames[frame] ?? data.frames[0];
      if (!frameData) { setStatus('no data'); return; }
      engine.play(channelIndex, channelName, frameData.bands)
        .then((chord) => {
          updateHUD(channelName, channelIndex, chord, engine.getMode());
          if (!engine.isAvailable()) setStatus('audio unavailable — visual only');
        })
        .catch((e) => { console.error(e); setStatus('playback error — see console'); });
    },
  });

  document.querySelectorAll('input[name="mode"]').forEach((el) => {
    el.addEventListener('change', (e) => { engine.setMode(e.target.value); setStatus(`mode: ${e.target.value}`); });
  });
  window.addEventListener('beforeunload', () => engine.dispose(), { once: true });

  const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
  animate();
}

boot().catch((e) => {
  console.error(e);
  const s = document.getElementById('status');
  if (s) s.textContent = 'failed to load — see console';
});
