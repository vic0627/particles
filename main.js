import * as THREE from "three";
import * as _T from "./scene.js";

const { scene, renderer, camera, animation } = _T;

const c = document.createElement("canvas");
const ctx = c.getContext("2d");

const ran = (f = 1) => {
  const rangeFactor = f;
  return Math.random() * rangeFactor - f / 2;
};
let mov = () => {};
let t = 0;
const frame = 120;
let frameCount = frame;
const image = new Image();
image.src = "./shiba.jpg";
image.onload = () => {
  const { width, height } = image;
  c.width = width;
  c.height = height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const positions = [];
  const colors = [];

  const scaleFactor = 500;

  let y = height / 2;
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    colors.push(r, g, b);
    if (x === width - 1) y -= 1;
    const px = x / scaleFactor - width / scaleFactor / 2;
    const py = y / scaleFactor;

    positions.push(px, py, 0);
  }

  const positionAttribute = new THREE.BufferAttribute(
    new Float32Array(positions),
    3
  );
  const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", colorAttribute);

  const material = new THREE.PointsMaterial({
    size: 0.001,
    vertexColors: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let newP = positions.map((val) => val);
  const pi = Math.PI / frame;
  mov = () => {
    newP = positions.map((val, idx) => {
      if ((idx + 1) % 3 === 0) {
        return val + Math.abs(colors[idx] * Math.sin(t) * 2);
      } else {
        return val;
      }
    });
    t += pi;
    frameCount--;
    const positionAttribute = new THREE.BufferAttribute(
      new Float32Array(newP),
      3
    );
    geometry.setAttribute("position", positionAttribute);
    if (frameCount) requestAnimationFrame(mov);
  };
};

animation();

window.addEventListener("click", () => {
  frameCount = frame;
  t = 0;
  mov();
});
