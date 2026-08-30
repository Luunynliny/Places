import type { PerspectiveCamera } from "three";
import { Vector3 } from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { PLAYER_RADIUS, resolveMove } from "./collision.ts";
import type { Collider } from "./scene-data.ts";

/** Deliberately unhurried: this is the "slow walk in a quiet landscape" pace. */
const WALK_SPEED = 1.2;
const EYE_HEIGHT = 1.6;
const FLY_SPEED = 4;
const FLY_SPRINT = 3;

export type CameraMode = "walk" | "fly";

const KEY_AXES: Record<string, [axis: "x" | "y" | "z", sign: number]> = {
  KeyW: ["z", -1],
  KeyS: ["z", 1],
  KeyA: ["x", -1],
  KeyD: ["x", 1],
  KeyE: ["y", 1],
  KeyQ: ["y", -1],
};

type Options = {
  colliders: readonly Collider[];
  /** Ground height at a world position, used to pin the walker to the terrain. */
  groundHeight: (x: number, z: number) => number;
  onModeChange?: (mode: CameraMode) => void;
};

/**
 * Pointer-lock look shared by both modes, with two different movement rules:
 * walk is pinned to the ground and stopped by colliders, fly ignores both.
 */
export function createCameraRig(
  camera: PerspectiveCamera,
  domElement: HTMLElement,
  { colliders, groundHeight, onModeChange }: Options,
) {
  const controls = new PointerLockControls(camera, domElement);
  const pressed = new Set<string>();
  let sprinting = false;
  let mode: CameraMode = "walk";

  const setMode = (next: CameraMode) => {
    mode = next;
    if (mode === "walk") {
      camera.position.y = groundHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;
    }
    onModeChange?.(mode);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyV") setMode(mode === "walk" ? "fly" : "walk");
    pressed.add(event.code);
    sprinting = event.shiftKey;
  };
  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code);
    sprinting = event.shiftKey;
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  const input = new Vector3();
  const forward = new Vector3();
  const right = new Vector3();

  /** Movement keys as a normalised local-space direction, or null if nothing is held. */
  function readInput(includeVertical: boolean) {
    input.set(0, 0, 0);
    for (const code of pressed) {
      const axis = KEY_AXES[code];
      if (axis && (includeVertical || axis[0] !== "y")) input[axis[0]] += axis[1];
    }
    return input.lengthSq() === 0 ? null : input.normalize();
  }

  function updateWalk(delta: number) {
    const move = readInput(false);
    if (move) {
      camera.getWorldDirection(forward);
      // Flatten the look direction so gazing up or down doesn't slow the walk.
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();

      const step = WALK_SPEED * delta;
      const dx = (forward.x * -move.z + right.x * move.x) * step;
      const dz = (forward.z * -move.z + right.z * move.x) * step;
      const [x, z] = resolveMove(camera.position.x, camera.position.z, dx, dz, colliders);
      camera.position.x = x;
      camera.position.z = z;
    }
    // Pinned every frame, not just when moving, so the ground stays right after a mode swap.
    camera.position.y = groundHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;
  }

  function updateFly(delta: number) {
    const move = readInput(true);
    if (!move) return;
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();
    const step = FLY_SPEED * delta * (sprinting ? FLY_SPRINT : 1);
    camera.position
      .addScaledVector(forward, -move.z * step)
      .addScaledVector(right, move.x * step)
      .addScaledVector(camera.up, move.y * step);
  }

  setMode("walk");

  return {
    controls,
    get mode() {
      return mode;
    },
    playerRadius: PLAYER_RADIUS,
    update(delta: number) {
      if (mode === "walk") updateWalk(delta);
      else updateFly(delta);
    },
    dispose() {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      controls.disconnect();
    },
  };
}
