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
  PlaneGeometry,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { createFreeCam } from "./freecam";
import { sceneBounds } from "./scene-data";

const width = sceneBounds.maxX - sceneBounds.minX;
const depth = sceneBounds.maxZ - sceneBounds.minZ;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color(0x8fa3b0);
scene.fog = new Fog(0x8fa3b0, width * 0.6, width * 2.5);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, width / 2);

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

// Placeholder shell: a flat ground the size of the bounds, and one box for scale.
// Phase 1 replaces both with the authored near/far terrain grids.
const ground = new Mesh(
  new PlaneGeometry(width, depth),
  new MeshStandardMaterial({ color: 0x6d7f6a, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const marker = new Mesh(
  new BoxGeometry(1, 1.8, 1),
  new MeshStandardMaterial({ color: 0xb4643c, roughness: 0.8 }),
);
marker.position.set(0, 0.9, -2);
marker.castShadow = true;
scene.add(marker);

const freeCam = createFreeCam(camera, renderer.domElement);

const hint = document.getElementById("hint");
hint?.addEventListener("click", () => freeCam.controls.lock());
freeCam.controls.addEventListener("lock", () => hint?.setAttribute("hidden", ""));
freeCam.controls.addEventListener("unlock", () => hint?.removeAttribute("hidden"));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  freeCam.update(timer.getDelta());
  renderer.render(scene, camera);
});
