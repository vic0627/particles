import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer";
import { RenderPass } from "three/addons/postprocessing/RenderPass";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass";
import { BokehPass } from "three/addons/postprocessing/BokehPass";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass";

const ww = window.innerWidth;
const wh = window.innerHeight;
const postprocessing = {};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, ww / wh, 0.1, 1000);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
  // alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(ww, wh);
renderer.autoClear = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.target.set(0, 0, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, 50);
scene.add(directionalLight);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1,
  0.6,
  0.8
);

composer.addPass(renderPass);
composer.addPass(bloomPass);

postprocessing.composer = composer;
postprocessing.bloom = bloomPass;

const effectController = {
  focalLength: 35,
  strength: postprocessing.bloom.strength,
  threshold: postprocessing.bloom.threshold,
  radius: postprocessing.bloom.radius,
};

const matChanger = () => {
  camera.setFocalLength(effectController.focalLength);
  postprocessing.bloom.strength = effectController.strength;
  postprocessing.bloom.threshold = effectController.threshold;
  postprocessing.bloom.radius = effectController.radius;
};

const gui = new GUI();
gui.add(effectController, "focalLength", 16, 80, 0.001).onChange(matChanger);
gui.add(effectController, "strength", 0, 20, 1).onChange(matChanger);
gui.add(effectController, "threshold", 0, 1, 0.1).onChange(matChanger);
gui.add(effectController, "radius", 0, 1, 0.1).onChange(matChanger);
gui.close();

matChanger();

const animation = (animateCallback = function () {}) => {
  // renderer.render(scene, camera);
  postprocessing.composer.render(0.1);
  camera.updateWorldMatrix();
  camera.updateProjectionMatrix();
  animateCallback();
  requestAnimationFrame(() => animation(animateCallback));
};

window.addEventListener("resize", () => {
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  camera.aspect = ww / wh;
  postprocessing.composer.setSize(ww, wh);
  renderer.setSize(ww, wh);
});

export { scene, renderer, camera, animation, postprocessing };
