importScripts("https://unpkg.com/three@0.149.0/build/three.min.js");
importScripts("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js");

const frame = 30;
const timeClip = Array.from({ length: frame }, (_, i) => i);

let idxCanUpdate = true;
const pi = Math.PI / frame;

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

    return {
        positions,
        colors,
        positionsColor,
    };
};

const createAnimation = (imageData, index) => {
    const positionClip = [];
    const colorClip = [];
    let time = 0;

    timeClip.forEach((val, TCI, TCA) => {
        if (time >= Math.PI / 2 && idxCanUpdate) {
            idxCanUpdate = false;
        }
        const { positionsColor, positions, colors } = imageData;
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

        positionClip.push(pc);
        colorClip.push(cc);

        postMessage({ positionClip: pc, colorClip: cc, index });

        time += pi;

        if (TCI === TCA.length - 1) {
            time = 0;
            idxCanUpdate = true;
        }
    });

    return { positionClip, colorClip };
};

onmessage = function (e) {
    const { image, width, height, scaleFactor, index } = e.data;
    const imageData = createAttrs(image, width, height, scaleFactor);
    createAnimation(imageData, index);
    console.log("worker done");
    postMessage(null);
};
