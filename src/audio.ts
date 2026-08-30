import { Audio, AudioListener, AudioLoader, type Object3D, PositionalAudio } from "three";
import palette from "../docs/sound-palette.json" with { type: "json" };

const { ambientBed, planeEngine } = palette;

/**
 * A prop engine as a handful of detuned partials under a low-pass, with a slow amplitude
 * wobble for blade passing. Built as live nodes rather than a rendered buffer so there is
 * no loop seam to click at, and fed through PositionalAudio so it still pans and attenuates
 * with the aircraft's position.
 */
function createEngineSource(context: AudioContext): AudioNode {
  const out = context.createGain();
  out.gain.value = 1;

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = planeEngine.lowpassHz;
  lowpass.connect(out);

  for (const [i, ratio] of planeEngine.partials.entries()) {
    const oscillator = context.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = planeEngine.fundamentalHz * ratio;
    oscillator.detune.value = planeEngine.detuneCents[i] ?? 0;

    const level = context.createGain();
    level.gain.value = (planeEngine.partialGains[i] ?? 0.2) * 0.12;
    oscillator.connect(level).connect(lowpass);
    oscillator.start();
  }

  // Blade passing: a steady tremolo on the whole engine.
  const blade = context.createOscillator();
  blade.frequency.value = planeEngine.bladePassHz;
  const bladeDepth = context.createGain();
  bladeDepth.gain.value = planeEngine.bladeDepth;
  blade.connect(bladeDepth).connect(out.gain);
  blade.start();

  return out;
}

/**
 * The Place's audio, in the layers the build spec describes: a non-positional ambient bed
 * for the whole clearing, and positional sources attached to the things that make them.
 * Live weather synthesis is the third layer and arrives with the weather itself.
 */
export function createAudio(camera: Object3D) {
  const listener = new AudioListener();
  camera.add(listener);

  const bed = new Audio(listener);
  if (ambientBed.present) {
    new AudioLoader().load(ambientBed.file, (buffer) => {
      bed.setBuffer(buffer);
      bed.setLoop(true);
      bed.setVolume(ambientBed.volume);
      bed.play();
    });
  }

  return {
    listener,
    /** Whether the ambient bed WAV has been generated and switched on in the sound palette. */
    hasBed: ambientBed.present,

    /** Attach the engine to an aircraft, so it moves with it automatically. */
    attachEngine(aircraft: Object3D) {
      const engine = new PositionalAudio(listener);
      engine.setNodeSource(createEngineSource(listener.context));
      engine.setRefDistance(planeEngine.refDistance);
      engine.setRolloffFactor(planeEngine.rolloffFactor);
      engine.setVolume(planeEngine.volume);
      aircraft.add(engine);
      return engine;
    },

    /** Browsers hold the audio context suspended until a gesture; the pointer-lock click is it. */
    resume() {
      if (listener.context.state === "suspended") void listener.context.resume();
    },
  };
}
