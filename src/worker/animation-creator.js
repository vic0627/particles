// importScripts("https://unpkg.com/three@0.149.0/build/three.min.js");
// importScripts("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js");

const frame = 60;
const timeClip = Array.from({ length: frame / 2 }, (_, i) => i);
const pi = Math.PI / frame;

/**
 *
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {number} scaleFactor
 * @returns
 */
const createAttrs = (data, width, height, scaleFactor) => {
    /** @type {number[]} */
    const positions = [];
    /** @type {number[]} */
    const colors = [];
    /** @type {number[]} */
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
    let time = 0;

    timeClip.forEach((_, TCI, TCA) => {
        const { positionsColor, positions, colors } = imageData;
        const positionClip = positions.map((val, idx) =>
            (idx + 1) % 3 === 0
                ? val + Math.abs(positionsColor[idx] * Math.sin(time) * 3)
                : val
        );
        const colorClip = colors.map((val, idx) =>
            idx % 4 === 3 ? Math.abs(Math.cos(time)) : val
        );

        postMessage({ positionClip, colorClip, index });

        time += pi;
        if (TCI === TCA.length - 1) time = 0;
    });
};

onmessage = function (e) {
    const { image, width, height, scaleFactor, index } = e.data;
    const imageData = createAttrs(image, width, height, scaleFactor);
    createAnimation(imageData, index);
    console.log("worker done");
    postMessage(null);
};
