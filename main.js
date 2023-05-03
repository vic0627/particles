import * as THREE from "three";
import * as _T from "./scene.js";

const { scene, renderer, camera, animation, postprocessing } = _T;

const { bloom } = postprocessing;

// const focus = bokeh.uniforms["focus"].value;
// const aperture = bokeh.uniforms["aperture"].value;
// const maxblur = bokeh.uniforms["maxblur"].value;
let { strength, threshold, radius } = bloom;

const initBloom = {
  strength,
  threshold,
  radius,
};

const ran = () => Math.random();
let mov = () => {};
let t = 0;
const frame = 120;

const imageUrls = ["./shiba.jpg", "./fake.png", "./cartoon.jpg"];
const images = [];
const imageDataArray = [];

imageUrls.forEach((url, idx) => {
  const targetAspectRatio = 16 / 9;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.willReadFrequently = true;
  c.width = 600;
  c.height = c.width / targetAspectRatio;
  const image = new Image();
  image.src = url;
  image.crossOrigin = "anonymous";
  image.onload = () => {
    ctx.drawImage(image, 0, 0, c.width, c.height);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    imageDataArray[idx] = createAttrs(imageData.data, c.width, c.height, 300);
  };
  c.remove();
});

const createAttrs = (data, width, height, scaleFactor) => {
  const positions = [];
  const colors = [];
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
  return { positionAttribute, colorAttribute, positions, colors };
};
const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({
  size: 0.01,
  vertexColors: true,
});
const points = new THREE.Points(geometry, material);
scene.add(points);

let idx = 0;
setInterval(() => {
  idx++;
}, 8000);

let newP = [];
const pi = Math.PI / frame;
animation(() => {
  if (imageDataArray.length > 0) {
    if (idx === imageDataArray.length) idx = 0;
    const { colorAttribute, colors, positions } = imageDataArray[idx];
    newP = positions.map((val, idx) => {
      if ((idx + 1) % 3 === 0) {
        return val + Math.abs(colors[idx] * Math.sin(t) * 2);
      } else {
        return val;
      }
    });
    const positionAttribute = new THREE.BufferAttribute(
      new Float32Array(newP),
      3
    );
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("color", colorAttribute);
    t += pi;
  }
});


// image.src = "./shiba.jpg";
// image.onload = () => {
//   const { width, height } = image;
//   c.width = width;
//   c.height = height;
//   ctx.drawImage(image, 0, 0);
//   const imageData = ctx.getImageData(0, 0, width, height);
//   const { data } = imageData;

//   const positions = [];
//   const colors = [];
//   const curves = [];

//   const scaleFactor = 500;

//   let y = height / 2;
//   for (let i = 0; i < data.length; i += 4) {
//     const x = (i / 4) % width;
//     const r = data[i] / 255;
//     const g = data[i + 1] / 255;
//     const b = data[i + 2] / 255;
//     colors.push(r, g, b);
//     if (x === width - 1) y -= 1;
//     const px = x / scaleFactor - width / scaleFactor / 2;
//     const py = y / scaleFactor;
//     positions.push(px, py, 0);
//     // curves.push(curve({ x: px, y: py, z: 0 }));
//   }

//   const positionAttribute = new THREE.BufferAttribute(
//     new Float32Array(positions),
//     3
//   );
//   const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 3);

//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute("position", positionAttribute);
//   geometry.setAttribute("color", colorAttribute);

//   const material = new THREE.PointsMaterial({
//     size: 0.005,
//     vertexColors: true,
//   });
//   const points = new THREE.Points(geometry, material);
//   scene.add(points);

//   let newP = [];
//   // let newC = colors.map((val) => val);
//   // const pathC = colors.map((val) => 1 - val);
//   const pi = Math.PI / frame;
//   mov = () => {
//     // const curvePoints = curves.map((val) =>
//     //   val.getPointAt(Math.abs(Math.sin(t)))
//     // );
//     // newP.length = positions.length;
//     // positions.map((_, idx) => {
//     //   if (idx % 3 === 0) {
//     //     const { x, y, z } = curvePoints[idx / 3];
//     //     newP[idx] = x;
//     //     newP[idx + 1] = y;
//     //     newP[idx + 2] = z;
//     //   }
//     // });
//     // if (t > 0.5 && t < 1) console.log(newP);
//     newP = positions.map((val, idx) => {
//       if ((idx + 1) % 3 === 0) {
//         return val + Math.abs(colors[idx] * Math.sin(t) * 2);
//       } else {
//         return val;
//       }
//     });
//     // newC = colors.map((val, idx) => val + pathC[idx] * Math.sin(t * 2));
//     t += pi;
//     // frameCount--;
//     const positionAttribute = new THREE.BufferAttribute(
//       new Float32Array(newP),
//       3
//     );
//     // const colorAttribute = new THREE.BufferAttribute(new Float32Array(newC), 3);
//     geometry.setAttribute("position", positionAttribute);
//     // geometry.setAttribute("color", colorAttribute);
//     // camera.setFocalLength(60 + 20 * Math.cos(t * 2));
//     // strength = initBloom.strength + Math.cos(t * 2);
//     // if (frameCount)
//     // requestAnimationFrame(mov);
//   };
//   animation(mov);
// };

// const curve = (target) => {
//   const { x, y, z } = target;
//   let startPoint, controlPoint;
//   const sp = 0.5 * ran()
//   const cp = 0.5 * ran()
//   if (x < 0 && y > 0) {
//     startPoint = new THREE.Vector3(-sp, sp, 1);
//     controlPoint = new THREE.Vector3(-cp, cp, 1);
//   } else if (x > 0 && y < 0) {
//     startPoint = new THREE.Vector3(sp, -sp, 1);
//     controlPoint = new THREE.Vector3(cp, -cp, 1);
//   } else if (x < 0 && y < 0) {
//     startPoint = new THREE.Vector3(-sp, -sp, 1);
//     controlPoint = new THREE.Vector3(-cp, -cp, 1);
//   } else {
//     startPoint = new THREE.Vector3(sp, sp, 1);
//     controlPoint = new THREE.Vector3(cp, cp, 1);
//   }
//   return new THREE.CatmullRomCurve3([
//     startPoint,
//     controlPoint,
//     new THREE.Vector3(x, y, z),
//   ]);
// };
