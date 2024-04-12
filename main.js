import * as THREE from "three";
import * as _T from "./src/scene.js";
import {
    frameBack,
    shadowMask,
    backImage,
    backImageBlock,
} from "./src/const-dom.js";

const { scene, animation } = _T;

const init = true;

const imageUrls = [
    "./src/assets/particle_1.png",
    "./src/assets/particle_2.png",
    "./src/assets/particle_3.png",
    // "./src/assets/particle_4.png",
    // "./src/assets/particle_5.png",
    // "./src/assets/particle_6.png",
];
/**
 * 3D 粒子動畫庫
 */
const mixer = {
    /** @type {THREE.BufferAttribute[] | number[]} */
    positionClip: [],
    /** @type {THREE.BufferAttribute[] | number[]} */
    colorClip: [],
};
const frame = 60;
const halfFrame = frame / 2;
const pi = Math.PI / frame;
const targetAspectRatio = 235 / 408;
let timeStamp = 0;
let imageId = 0;
let tmpImgId = null;
let canPlay = false;
/**
 * @type {0 | 1}
 */
let delta = 1;
let timer;
let geometry;
let aniInit = false;
let workerDoneCount = 0;

const newWorker = (message) => {
    const wt = new Worker("./src/worker/animation-creator.js");
    wt.postMessage(message);
    wt.addEventListener("message", (e) => {
        updateMixer(e);
        animationTrigger();
    });
};

const updateMixer = (e) => {
    if (!e.data) return workerDoneCount++;
    const { index, positionClip, colorClip } = e.data;
    if (!mixer.positionClip[index]) mixer.positionClip[index] = [];
    mixer.positionClip[index].push(positionClip);
    if (!mixer.colorClip[index]) mixer.colorClip[index] = [];
    mixer.colorClip[index].push(colorClip);
};

const initGeo = () => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true,
        transparent: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    return geometry;
};

const updateBackImage = () => {
    if (tmpImgId === imageId) return;

    backImage.src = imageUrls[imageId];
    tmpImgId = imageId;
};

const updateGeo = () => {
    if (!geometry) return;
    selectImg();
    updateBackImage();
    const { positionClip, colorClip } = mixer;
    const correctTime =
        timeStamp > halfFrame - 1
            ? Math.abs(halfFrame - timeStamp + halfFrame)
            : timeStamp;
    console.log({ imageId, correctTime });
    let position = positionClip[imageId][correctTime];
    let color = colorClip[imageId][correctTime];
    // console.log("start instantiating BufferAttribute");
    if (!(position instanceof THREE.BufferAttribute))
        positionClip[imageId][correctTime] = position =
            new THREE.BufferAttribute(new Float32Array(position), 3);
    if (!(color instanceof THREE.BufferAttribute))
        colorClip[imageId][correctTime] = color = new THREE.BufferAttribute(
            new Float32Array(color),
            4
        );
    geometry.setAttribute("position", position);
    geometry.setAttribute("color", color);
};

const animationTrigger = () => {
    if (workerDoneCount !== imageUrls.length) return;

    geometry = initGeo();
    updateGeo();

    console.log("ready");
    animation(() => {
        if (!aniInit) aniInit = true;
        if (canPlay) setPlay();
        else autoWheel();
    });
};

const autoWheel = () => {
    const breakTS = timeStamp >= frame - 1 || timeStamp <= 0;
    if (breakTS) return;
    const upLimit = timeStamp < frame / 5;
    const downLimit = timeStamp > (frame / 5) * 4 && timeStamp < frame;
    if (delta && upLimit) delta = 0;
    else if (!delta && downLimit) delta = 1;
    setPlay();
};

const setPlay = () => {
    delta ? timeStamp++ : timeStamp--;
    if (timeStamp >= frame) timeStamp = 0;
    if (timeStamp < 0) timeStamp = frame - 1;

    imageAnimate();
};

const selectImg = () => {
    if (timeStamp === halfFrame - 1) delta ? imageId++ : imageId--;
    if (imageId === imageUrls.length) imageId = 0;
    if (imageId < 0) imageId = imageUrls.length - 1;
};

const imageAnimate = () => {
    const zeroToZero = Math.abs(Math.sin(timeStamp * pi));
    const oneToOne = Math.abs(Math.cos(timeStamp * pi));
    shadowMask.style.opacity = oneToOne;
    frameBack.style.opacity = zeroToZero;
    backImageBlock.style.opacity = oneToOne;
    updateGeo();
};

imageUrls.forEach((url, idx, arr) => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.willReadFrequently = true;
    c.width = 297;
    c.height = c.width / targetAspectRatio;
    const image = new Image();
    image.src = url;
    image.crossOrigin = "anonymous";
    image.onload = () => {
        ctx.drawImage(image, 0, 0, c.width, c.height);
        const imageData = ctx.getImageData(0, 0, c.width, c.height);
        if (init)
            newWorker({
                image: imageData.data,
                width: c.width,
                height: c.height,
                scaleFactor: 200,
                index: idx,
            });
        c.remove();
    };
});

window.addEventListener("wheel", (e) => {
    if (!aniInit) return;
    clearTimeout(timer);
    canPlay = true;
    e.deltaY > 0 ? (delta = 1) : (delta = 0);
    // console.log({ timeStamp, imageId });
    timer = setTimeout(() => {
        canPlay = false;
        // console.log("wheel end");
    }, 100);
});
