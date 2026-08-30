import {
  type AudioListener,
  BufferAttribute,
  BufferGeometry,
  type Color,
  LineBasicMaterial,
  LineSegments,
  type Object3D,
  type PerspectiveCamera,
  type Scene,
} from "three";
import * as Tone from "tone";
import soundPalette from "../docs/sound-palette.json" with { type: "json" };
import { sampleProfile } from "./path.ts";
import { rain, weatherCycle, weatherCycleSeconds } from "./scene-data.ts";
import { color } from "./style.ts";

const RAIN_AUDIO = soundPalette.rain;

/** How much of its dry roughness a surface keeps in a downpour. Wet is smooth and darker. */
const WET_ROUGHNESS = 0.35;
const WET_DARKENING = 0.72;

type DrySurface = {
  material: { roughness: number; color: Color };
  roughness: number;
  color: Color;
};

/**
 * Falling streaks in a column that follows the camera, so you are always inside the rain
 * without ever simulating any of it outside what you can see.
 *
 * ponytail: positions are stepped in JS, which is fine for a few thousand streaks. Move the
 * fall into a vertex shader if the count ever needs to go up by an order of magnitude.
 */
function createRainfall() {
  const positions = new Float32Array(rain.count * 6);
  const attribute = new BufferAttribute(positions, 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", attribute);

  // Where each streak sits in the column. This is the one place in the project that rolls
  // dice: rain is weather, which the spec allows to vary, and it is not part of the layout.
  const drops = Array.from({ length: rain.count }, () => ({
    x: (Math.random() - 0.5) * rain.area,
    y: Math.random() * rain.height,
    z: (Math.random() - 0.5) * rain.area,
    speed: rain.speed * (0.85 + Math.random() * 0.3),
  }));

  const material = new LineBasicMaterial({
    color: color("rain"),
    transparent: true,
    opacity: 0,
    fog: true,
  });
  const mesh = new LineSegments(geometry, material);
  mesh.frustumCulled = false;
  mesh.name = "rainfall";

  return {
    mesh,
    material,
    update(delta: number, intensity: number, camera: Object3D) {
      mesh.position.set(camera.position.x, 0, camera.position.z);
      const streak = rain.streak * (0.6 + intensity * 0.8);

      for (const [i, drop] of drops.entries()) {
        drop.y -= drop.speed * delta * (0.7 + intensity * 0.5);
        if (drop.y < 0) drop.y += rain.height;

        const lean = drop.y * rain.slant;
        const o = i * 6;
        positions[o] = drop.x + lean;
        positions[o + 1] = drop.y + streak;
        positions[o + 2] = drop.z;
        positions[o + 3] = drop.x + lean - streak * rain.slant;
        positions[o + 4] = drop.y;
        positions[o + 5] = drop.z;
      }
      attribute.needsUpdate = true;
    },
  };
}

/** Pink noise through a filter that opens as the rain gets heavier. Never a loop, so never repeats. */
function createRainSound(listener: AudioListener) {
  // Share three's audio context, and route into the listener's own input rather than
  // straight to the destination, so the rain sits under the same master volume as
  // everything else instead of being a second output nobody can turn down.
  Tone.setContext(listener.context);
  const filter = new Tone.Filter(RAIN_AUDIO.filterHzAtCalm, "lowpass");
  filter.connect(listener.getInput());
  filter.Q.value = RAIN_AUDIO.filterQ;
  const noise = new Tone.Noise("pink").connect(filter);
  noise.volume.value = Number.NEGATIVE_INFINITY;
  noise.start();

  return (intensity: number) => {
    if (intensity <= 0) {
      noise.volume.value = Number.NEGATIVE_INFINITY;
      return;
    }
    noise.volume.value = RAIN_AUDIO.quietDb + intensity * (RAIN_AUDIO.loudDb - RAIN_AUDIO.quietDb);
    filter.frequency.value =
      RAIN_AUDIO.filterHzAtCalm +
      intensity * (RAIN_AUDIO.filterHzAtDownpour - RAIN_AUDIO.filterHzAtCalm);
  };
}

/**
 * One weatherIntensity value driving all three responses the spec asks for: the visible
 * rain, the wetness of every surface, and the sound. It follows an authored cycle, which
 * is what makes weather the one thing here that is different each time you look up.
 */
export function createWeather(scene: Scene, camera: PerspectiveCamera, listener: AudioListener) {
  const rainfall = createRainfall();
  scene.add(rainfall.mesh);

  // Every lit surface goes wet together; remember what dry looked like first.
  const dry: DrySurface[] = [];
  scene.traverse((node) => {
    if (!("material" in node)) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (material && "roughness" in material && "color" in material) {
        const surface = material as DrySurface["material"];
        dry.push({ material: surface, roughness: surface.roughness, color: surface.color.clone() });
      }
    }
  });

  const setRainVolume = createRainSound(listener);
  let elapsed = 0;
  let intensity = -1;

  function apply(next: number) {
    if (next === intensity) return;
    intensity = next;

    rainfall.material.opacity = 0.06 + intensity * 0.34;
    rainfall.mesh.visible = intensity > 0.01;

    for (const surface of dry) {
      surface.material.roughness = surface.roughness * (1 - intensity * (1 - WET_ROUGHNESS));
      surface.material.color
        .copy(surface.color)
        .multiplyScalar(1 - intensity * (1 - WET_DARKENING));
    }

    setRainVolume(intensity);
  }

  apply(sampleProfile(weatherCycle, 0));

  return {
    get intensity() {
      return intensity;
    },
    /** Jump the cycle to a given intensity's worth of rain. Used by tests, not by the Place. */
    set intensity(value: number) {
      apply(Math.min(Math.max(value, 0), 1));
    },
    update(delta: number) {
      elapsed = (elapsed + delta) % weatherCycleSeconds;
      apply(sampleProfile(weatherCycle, elapsed));
      if (rainfall.mesh.visible) rainfall.update(delta, intensity, camera);
    },
  };
}
