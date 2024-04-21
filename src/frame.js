import * as THREE from "three";
import vertexGlsl from "./shader/vertex.glsl.js";
import fragmentGlsl from "./shader/fragment.glsl.js";

const geometry = new THREE.PlaneGeometry(2.85, 2.85 * 1.35);
// export const material = new THREE.MeshStandardMaterial({
//   color: new THREE.Color({
//     // r: 1,
//     g: 0,
//     b: 0,
//   }),
// });
export const material = new THREE.ShaderMaterial({
  vertexShader: vertexGlsl,
  fragmentShader: fragmentGlsl,
  uniforms: {
    vTexture: { value: new THREE.TextureLoader().load("src/assets/frame.png") },
    vFrameTime: { value: 0 },
  },
});

const mesh = new THREE.Mesh(geometry, material);
mesh.lookAt(new THREE.Vector3(0, 0, 3));

export default mesh;
