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
    "./src/assets/particle_4.png",
];
const mixer = {
    positionClip: [],
    colorClip: [],
};

const frame = 60;
const pi = Math.PI / frame;
let timeStamp = 0;
let imageId = 0;
let canPlay = false;
/**
 * @type {-1 | 0 | 1}
 */
let delta = -1;
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
    const { index, positionAttr, colorAttr } = e.data;
    if (!mixer.positionClip[index]) mixer.positionClip[index] = [];
    if (!mixer.colorClip[index]) mixer.colorClip[index] = [];
    mixer.positionClip[index].push(
        new THREE.BufferAttribute(new Float32Array(positionAttr), 3)
    );
    mixer.colorClip[index].push(
        new THREE.BufferAttribute(new Float32Array(colorAttr), 4)
    );
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
    const position = positionClip[imageId][timeStamp];
    const color = colorClip[imageId][timeStamp];
    geometry.setAttribute("position", position);
    geometry.setAttribute("color", color);
};

const animationTrigger = () => {
    if (workerDoneCount !== imageUrls.length) return;

    console.log("all inited", mixer);

    geometry = initGeo();
    updateGeo();
    animation(() => {
        if (!aniInit) aniInit = true;
        if (!deltaBreak()) setPlay();
        // else autoWheel();
    });
};

const shadowMask = document.getElementById("shadowMask");
const frameBack = document.getElementById("frameBack");

const autoWheel = () => {
    if (timeStamp >= frame || timeStamp < 0) return;
    const upLimit = timeStamp < frame / 5 && timeStamp > 0;
    const downLimit = timeStamp > (frame / 5) * 4 && timeStamp < frame;
    if (delta && downLimit) {
        delta = 0;
        setPlay();
    } else if (!delta && upLimit) {
        delta = 1;
        setPlay();
    }
};

const setPlay = () => {
    if (timeStamp >= frame) timeStamp = 0;
    if (timeStamp < 0) timeStamp = frame - 1;

    imageAnimate();
    delta ? timeStamp++ : timeStamp--;
};

const selectImg = () => {
    if (timeStamp === frame / 2) imageId++;
    else if (!timeStamp) imageId--;
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
    e.deltaY > 0 ? (delta = 1) : (delta = 0);
    timer = setTimeout(() => {
        delta = -1;
        console.log("wheel end");
    }, 100);
});
