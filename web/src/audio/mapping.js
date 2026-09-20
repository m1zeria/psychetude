/**
 * phase 3 — sonification mapping.
 *
 * for a single electrode, produce a five-voice chord. each band
 * contributes one voice, in a fixed register:
 *
 *     delta  -> c2 (midi 36)
 *     theta  -> c3 (midi 48)
 *     alpha  -> c4 (midi 60)
 *     beta   -> c5 (midi 72)
 *     gamma  -> c6 (midi 84)
 *
 * band power modulates the voice within ±MODULATION_SEMITONES of its
 * register center. gain follows band power with a floor so every
 * voice is faintly audible.
 *
 * modes:
 *   aesthetic - pitches quantized to nearest scale note.
 *   raw       - pitches used directly, unquantized.
 *
 * see docs/mapping.md for the full design.
 */

import {
  midiToFreq,
  quantizeMidi,
  SCALE_MAJOR_PENTATONIC,
} from './quantise.js';

// canonical register assignments. mirrored in pipeline/config.yaml.
export const REGISTERS = {
  delta: 36,
  theta: 48,
  alpha: 60,
  beta:  72,
  gamma: 84,
};

// max semitone offset from register center. ±3 leaves 6 semitones
// of clear space between adjacent registers.
export const MODULATION_SEMITONES = 3;

// expected range of log10(mean psd) from the pipeline. mirrored in
// pipeline/config.yaml. tune per dataset; see docs/limitations.md.
export const NORM_LO = -12;
export const NORM_HI = -7;

// gain floor. every band always audible, so absence is distinguishable
// from weakness.
export const GAIN_FLOOR = 0.1;

// per-mode duration (seconds).
const DURATION = {
  aesthetic: 1.2,
  raw: 0.25,
};

export const MODES = ['aesthetic', 'raw'];

function norm(value, lo, hi) {
  if (!Number.isFinite(value)) return 0;
  if (hi === lo) return 0.5;
  const t = (value - lo) / (hi - lo);
  return Math.max(0, Math.min(1, t)); // clamp, don't wrap
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * convert a band power value to a single voice.
 *
 * @param {number} power   log10(mean psd) for this band and channel
 * @param {number} register midi note number of the register center
 * @param {number} gainFloor
 * @param {string} mode     'aesthetic' | 'raw'
 * @returns {{freq: number, gain: number, duration: number, midi: number}}
 */
function bandToVoice(power, register, gainFloor, mode) {
  const t = norm(power, NORM_LO, NORM_HI); // 0..1

  // modulation: t in [0,1] -> offset in [-MOD, +MOD]
  const offset = (t - 0.5) * 2 * MODULATION_SEMITONES;
  const rawMidi = register + offset;

  const quantized =
    mode === 'raw'
      ? rawMidi
      : quantizeMidi(rawMidi, SCALE_MAJOR_PENTATONIC);

  const freq = midiToFreq(quantized);

  // gain follows power, floored so every voice is faintly present
  const gain = gainFloor + t * (1 - gainFloor);

  return {
    freq,
    gain: clamp01(gain),
    duration: DURATION[mode] ?? DURATION.aesthetic,
    midi: quantized,
  };
}

/**
 * produce the five-voice chord for one electrode at one moment.
 *
 * @param {object} bands   { delta: [...], theta: [...], ..., gamma: [...] }
 * @param {number} channelIndex
 * @param {string} mode    'aesthetic' | 'raw'
 * @returns {Array<{band: string, freq: number, gain: number, duration: number, midi: number}>}
 */
export function bandPowerToChord(bands, channelIndex = 0, mode = 'aesthetic') {
  if (!MODES.includes(mode)) mode = 'aesthetic';

  return Object.keys(REGISTERS).map((band) => {
    const arr = bands?.[band];
    const power = Array.isArray(arr) ? arr[channelIndex] : 0;
    const voice = bandToVoice(
      Number.isFinite(power) ? power : 0,
      REGISTERS[band],
      GAIN_FLOOR,
      mode,
    );
    return { band, ...voice };
  });
}
