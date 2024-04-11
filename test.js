import * as THREE from "three";
import * as _T from "./src/scene.js";

// const wt = new Worker("./src/worker/wt.js");
// wt.postMessage(null);
// wt.addEventListener("message", async (e) => {
//     console.log(e.data);
// });

const { scene, renderer, camera, animation, postprocessing } = _T;

const imageUrls = [
    "./src/assets/particle_1.png",
    "./src/assets/particle_2.png",
    "./src/assets/particle_3.png",
    // "./src/assets/particle_4.png",
];
const mixer = {
    positionClip: [],
    colorClip: [],
};

const frame = 30;
const pi = Math.PI / frame;
let timeStamp = 0;
let imageId = 0;
let canPlay = false;
/**
 * @type {0 | 1}
 */
let delta = 1;
let timer;
let geometry;
let aniInit = false;
let workerDoneCount = 0;

const deltaBreak = () => delta === -1;

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

const updateGeo = () => {
    if (!geometry) return;
    selectImg();
    const { positionClip, colorClip } = mixer;
    let position = positionClip[imageId][timeStamp];
    let color = colorClip[imageId][timeStamp];
    // console.log("start instantiating BufferAttribute");
    if (!(position instanceof THREE.BufferAttribute))
        positionClip[imageId][timeStamp] = position = new THREE.BufferAttribute(
            new Float32Array(position),
            3
        );
    if (!(color instanceof THREE.BufferAttribute))
        colorClip[imageId][timeStamp] = color = new THREE.BufferAttribute(
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

const shadowMask = document.getElementById("shadowMask");
const frameBack = document.getElementById("frameBack");

const autoWheel = () => {
    console.log("autoWheel");
    const wrongTS = timeStamp >= frame || timeStamp < 0;
    const breakTS = timeStamp === 0 || timeStamp === frame - 1;
    if (wrongTS || breakTS) return;
    const upLimit = timeStamp < frame / 5 && timeStamp > 0;
    const downLimit = timeStamp > (frame / 5) * 4 && timeStamp < frame;
    if (delta) {
        if (downLimit) delta = 0;
        else delta = 1;
        setPlay();
    } else if (!delta) {
        if (upLimit) delta = 1;
        else delta = 0;
        setPlay();
    }
};

const setPlay = () => {
    delta ? timeStamp++ : timeStamp--;
    if (timeStamp >= frame) timeStamp = 0;
    if (timeStamp < 0) timeStamp = frame - 1;

    console.log("setPlay");
    imageAnimate();
};

const selectImg = () => {
    if (timeStamp === frame / 2) delta ? imageId++ : imageId--;
    if (imageId === imageUrls.length) imageId = 0;
    if (imageId < 0) imageId = imageUrls.length - 1;
};

const imageAnimate = () => {
    shadowMask.style.opacity = Math.abs(Math.cos(timeStamp * pi));
    frameBack.style.opacity = Math.abs(Math.sin(timeStamp * pi));
    updateGeo();
    // console.log({ delta, imageId, timeStamp });
};

const targetAspectRatio = 235 / 408;

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
        console.log("wheel end");
    }, 100);
});
