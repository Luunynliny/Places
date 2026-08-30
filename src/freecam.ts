import type { PerspectiveCamera } from "three";
import { Vector3 } from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const SPEED = 4;
const SPRINT_MULTIPLIER = 3;

const KEY_AXES: Record<string, [axis: "x" | "y" | "z", sign: number]> = {
  KeyW: ["z", -1],
  KeyS: ["z", 1],
  KeyA: ["x", -1],
  KeyD: ["x", 1],
  KeyE: ["y", 1],
  KeyQ: ["y", -1],
};

/**
 * Free-cam: pointer-lock look plus WASD/QE fly. No gravity, no collision — it goes
 * straight through geometry on purpose. Walk mode (gravity + colliders) lands in phase 2.
 */
export function createFreeCam(camera: PerspectiveCamera, domElement: HTMLElement) {
  const controls = new PointerLockControls(camera, domElement);
  const pressed = new Set<string>();
  let sprinting = false;

  const onKeyDown = (event: KeyboardEvent) => {
    pressed.add(event.code);
    sprinting = event.shiftKey;
  };
  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code);
    sprinting = event.shiftKey;
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  const move = new Vector3();
  const forward = new Vector3();
  const right = new Vector3();

  return {
    controls,
    update(delta: number) {
      move.set(0, 0, 0);
      for (const code of pressed) {
        const axis = KEY_AXES[code];
        if (axis) move[axis[0]] += axis[1];
      }
      if (move.lengthSq() === 0) return;

      move.normalize().multiplyScalar(SPEED * delta * (sprinting ? SPRINT_MULTIPLIER : 1));

      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up).normalize();

      camera.position
        .addScaledVector(forward, -move.z)
        .addScaledVector(right, move.x)
        .addScaledVector(camera.up, move.y);
    },
    dispose() {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      controls.disconnect();
    },
  };
}
