import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { createCameraRig } from "./camera-modes.ts";
import { boundaryColliders } from "./collision.ts";
import { colliders, sceneBounds } from "./scene-data.ts";
import { createFarShell, createNearTerrain, sampleHeight } from "./terrain.ts";

const width = sceneBounds.maxX - sceneBounds.minX;
const depth = sceneBounds.maxZ - sceneBounds.minZ;
const SKY = 0x9aabb5;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color(SKY);
// Fog starts just past the clearing edge and closes before the far shell's horizon, so
// the enclosure reads as haze over rising ground rather than a wall.
scene.fog = new Fog(SKY, width * 0.85, 110);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, sampleHeight(0, 10) + 1.6, 10);

scene.add(new HemisphereLight(0xbcd4e6, 0x40332a, 1.2));

const sun = new DirectionalLight(0xfff1de, 2);
sun.position.set(width * 0.6, width, depth * 0.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -width;
sun.shadow.camera.right = width;
sun.shadow.camera.top = depth;
sun.shadow.camera.bottom = -depth;
sun.shadow.camera.far = width * 4;
scene.add(sun);

scene.add(createNearTerrain());
scene.add(createFarShell());

// Scale reference, standing on the path. Goes away once real objects arrive in phase 3.
const marker = new Mesh(
  new BoxGeometry(1, 1.8, 1),
  new MeshStandardMaterial({ color: 0xb4643c, roughness: 0.8 }),
);
marker.position.set(0, sampleHeight(0, -2) + 0.9, -2);
marker.castShadow = true;
scene.add(marker);

const rig = createCameraRig(camera, renderer.domElement, {
  colliders: [...boundaryColliders(), ...colliders],
  groundHeight: sampleHeight,
});

const hint = document.getElementById("hint");
hint?.addEventListener("click", () => rig.controls.lock());
rig.controls.addEventListener("lock", () => hint?.setAttribute("hidden", ""));
rig.controls.addEventListener("unlock", () => hint?.removeAttribute("hidden"));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new Timer();
// A backgrounded tab returns with a delta of many seconds; capping it keeps that first
// frame from teleporting the camera across the Place.
const MAX_DELTA = 0.1;

renderer.setAnimationLoop((time) => {
  timer.update(time);
  rig.update(Math.min(timer.getDelta(), MAX_DELTA));
  renderer.render(scene, camera);
});
