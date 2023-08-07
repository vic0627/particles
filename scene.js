import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer";
import { TexturePass } from "three/addons/postprocessing/TexturePass";
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
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(ww, wh);
renderer.debug.checkShaderErrors = false
renderer.autoClear = false
renderer.autoClearDepth = false
renderer.setClearColor(0xffffff, 0)

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);

composer.addPass(renderPass);

postprocessing.composer = composer;

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
