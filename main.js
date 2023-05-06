import * as THREE from "three";
import * as _T from "./scene.js";

const { scene, renderer, camera, animation, postprocessing } = _T;

// const { bloom } = postprocessing;

// const focus = bokeh.uniforms["focus"].value;
// const aperture = bokeh.uniforms["aperture"].value;
// const maxblur = bokeh.uniforms["maxblur"].value;
// let { strength, threshold, radius } = bloom;

// const initBloom = {
//   strength,
//   threshold,
//   radius,
// };

const ran = () => Math.random();
let mov = () => {};
let t = 0;
const frame = 60;
const timeClip = Array.from({ length: frame }, (_, i) => i);

const imageUrls = [
  "./particle_1.png",
  "./particle_2.png",
  "./particle_3.png",
  "./particle_4.png",
  "./particle_5.png",
  "./particle_6.png",
];
const imageDataArray = [];
const allImageCreated = [];
imageUrls.forEach((_) => {
  allImageCreated.push(false);
});
let aniInit = false;

imageUrls.forEach((url, idx, arr) => {
  const targetAspectRatio = 235 / 408;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.willReadFrequently = true;
  c.width = 280;
  c.height = c.width / targetAspectRatio;
  const image = new Image();
  image.src = url;
  image.crossOrigin = "anonymous";
  image.onload = () => {
    ctx.drawImage(image, 0, 0, c.width, c.height);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    imageDataArray[idx] = createAttrs(imageData.data, c.width, c.height, 200);
    allImageCreated[idx] = true;
  };
  c.remove();
});

const createAttrs = (data, width, height, scaleFactor) => {
  const positions = [];
  const colors = [];
  const positionsColor = [];

  let y = height / 2;
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = 1;
    colors.push(r, g, b, a);
    positionsColor.push(r, g, b);
    if (x === width - 1) y -= 1;
    const px = x / scaleFactor - width / scaleFactor / 2;
    const py = y / scaleFactor;
    positions.push(px, py, 0);
  }

  const positionAttribute = new THREE.BufferAttribute(
    new Float32Array(positions),
    3
  );
  const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 4);
  return {
    positionAttribute,
    colorAttribute,
    positions,
    colors,
    positionsColor,
  };
};
const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({
  size: 0.01,
  vertexColors: true,
  transparent: true,
});
const points = new THREE.Points(geometry, material);
scene.add(points);

let idxCanUpdate = true;
const pi = Math.PI / frame;

const createAnimation = (imageDataArray) => {
  let positionClip = [],
    colorClip = [];
  let imgId = 0;
  imageDataArray.forEach((_, IDX, IDA) => {
    let time = 0;
    positionClip[IDX] = [];
    colorClip[IDX] = [];
    timeClip.forEach((_, TCI, TCA) => {
      if (time >= Math.PI / 2 && idxCanUpdate) {
        imgId += 1;
        idxCanUpdate = false;
      }
      if (imgId === IDA.length) imgId = 0;
      const { positionsColor, positions, colors } = IDA[imgId];
      const pc = positions.map((val, idx) => {
        if ((idx + 1) % 3 === 0) {
          return val + Math.abs(positionsColor[idx] * Math.sin(time) * 3);
        } else {
          return val;
        }
      });
      const cc = colors.map((val, idx) => {
        if (idx % 4 === 3) {
          return Math.abs(Math.cos(time));
        } else {
          return val;
        }
      });
      const positionAttribute = new THREE.BufferAttribute(
        new Float32Array(pc),
        3
      );
      const colorAttribute = new THREE.BufferAttribute(new Float32Array(cc), 4);

      positionClip[IDX].push(positionAttribute);

      colorClip[IDX].push(colorAttribute);
      time += pi;
      if (TCI === TCA.length - 1) {
        time = 0;
        idxCanUpdate = true;
      }
    });
  });
  return { positionClip, colorClip };
};

let mixer;
let canPlay = false;
let timeStamp = 0;
let imageId = 0;
animation(() => {
  if (
    imageDataArray.length === imageUrls.length &&
    !aniInit &&
    !allImageCreated.includes(false)
  ) {
    mixer = createAnimation(imageDataArray);
    const { positionAttribute, colorAttribute } = imageDataArray[0];
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("color", colorAttribute);
    aniInit = true;
  }
  if (aniInit && canPlay) {
    setPlay();
  } else if (aniInit && !canPlay) {
    if (timeStamp > frame - 1 || timeStamp < 0) return;
    if (timeStamp < frame / 5 && timeStamp > 0) {
      timeStamp--;
      imageAnimate();
    } else if (delta && timeStamp >= frame / 5) {
      setPlay();
    }
    if (timeStamp > (frame / 5) * 4 && timeStamp < frame) {
      timeStamp++;
      if (timeStamp === frame) {
        timeStamp = 0;
        imageId += 1;
        if (imageId === imageUrls.length) imageId = 0;
      }
      imageAnimate();
    } else if (!delta && timeStamp <= (frame / 5) * 4) {
      setPlay();
    }
  }
});

let delta = true;
let timer;
window.addEventListener("wheel", (e) => {
  if (canPlay || !aniInit) return;
  clearTimeout(timer);
  canPlay = true;
  e.deltaY > 0 ? (delta = true) : (delta = false);
  timer = setTimeout(() => {
    canPlay = false;
    console.log("wheel end");
  }, 150);
});

const shadowMask = document.getElementById("shadowMask");
const frameBack = document.getElementById("frameBack");
const setPlay = () => {
  if (timeStamp >= frame) {
    timeStamp = 0;
    imageId += 1;
  }
  if (timeStamp < 0) {
    timeStamp = frame - 1;
    imageId -= 1;
  }
  if (imageId === imageUrls.length) imageId = 0;
  if (imageId < 0) imageId = imageUrls.length - 1;

  imageAnimate();
  delta ? timeStamp++ : timeStamp--;
};
const imageAnimate = () => {
  shadowMask.style.opacity = Math.abs(Math.cos(timeStamp * pi));
  frameBack.style.opacity = Math.abs(Math.sin(timeStamp * pi));
  const { positionClip, colorClip } = mixer;
  geometry.setAttribute("position", positionClip[imageId][timeStamp]);
  geometry.setAttribute("color", colorClip[imageId][timeStamp]);
  // console.log({ delta, imageId, timeStamp });
};
