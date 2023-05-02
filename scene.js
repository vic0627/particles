import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const ww = window.innerWidth;
const wh = window.innerHeight;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
  // alpha: true,
});
renderer.setSize(ww, wh);

const camera = new THREE.PerspectiveCamera(75, ww / wh, 0.001, 1000);
camera.position.set(0, 0, 1);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.enablePan = false;
controls.maxDistance = 5;
controls.minDistance = 1;
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, 50);
scene.add(directionalLight);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const depthTexture = new THREE.DepthTexture();
depthTexture.type = THREE.UnsignedShortType;
composer.renderTarget1.depthTexture = depthTexture;

const bokehPass = new BokehPass(scene, camera, {
  focus: 1,
  aperture: 0.01,
  maxblur: 0.01,
  width: ww,
  height: wh,
});
composer.addPass(bokehPass);

const postprocessing = {};
const effectController = {
  focus: 500.0,
  aperture: 5,
  maxblur: 1.0,
};
postprocessing.composer = composer;
postprocessing.bokeh = bokehPass;
postprocessing.bokeh.uniforms["focus"].value = effectController.focus;
postprocessing.bokeh.uniforms["aperture"].value =
  effectController.aperture * 0.00001;
postprocessing.bokeh.uniforms["maxblur"].value = effectController.maxblur;

let number = 0;

const animation = (animateCallback = function () {}) => {
  postprocessing.composer.render(0.1);

  effectController.aperture = effectController.aperture - 0.01;
  if (effectController.aperture < 0) {
    effectController.aperture = 5;
  }
  postprocessing.bokeh.uniforms["focus"].value = effectController.focus;
  postprocessing.bokeh.uniforms["aperture"].value =
    effectController.aperture * 0.00001;
  postprocessing.bokeh.uniforms["maxblur"].value = effectController.maxblur;
  camera.updateWorldMatrix();
  camera.updateProjectionMatrix();
  animateCallback();
  requestAnimationFrame(() => animation(animateCallback));
};

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export { scene, renderer, camera, animation };
