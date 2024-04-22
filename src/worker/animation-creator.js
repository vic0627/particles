// importScripts("https://unpkg.com/three@0.149.0/build/three.min.js");
// importScripts("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js");

const frame = 60;
const timeClip = Array.from({ length: frame / 2 }, (_, i) => i);
const pi = Math.PI / frame;

const threshold = (x, threshold = 1) => (x > threshold ? threshold : x);

let w, h;

/**
 * 計算圖片 RGB、三維座標
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {number} scaleFactor
 */
const createAttrs = (data, width, height, scaleFactor) => {
    /** @type {number[]} */
    const positions = [];
    /** @type {number[]} */
    const colors = [];
    /** @type {number[]} */
    const positionsColor = [];

    w = width;
    h = height;

    const row = 297 * 4;
    const maxShadow = 0.9;
    const shadowRange = 15;

    /**
     * 陰影公式
     * @param {number} color 原始色
     * @param {number} percent 百分比
     */
    const getShadowColor = (color, percent) =>
        color * threshold((percent / shadowRange) * maxShadow);

    let y = height / 2;
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        if (x === width - 1) y -= 1;
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const a = 1;

        const currentRow = 1 + parseInt(i / 4 / width);
        const currentCol = x + 1;
        const topShadow = i < shadowRange * row;
        const leftShadow = currentCol < shadowRange;
        const rightShadow = currentCol > width - shadowRange;
        const bottomShadow = currentRow > height - shadowRange;
        /**
         * 取得角落陰影
         * @param {number} row
         * @param {number} col
         */
        const getCornerLength = (row, col) =>
            shadowRange -
            Math.sqrt((col - shadowRange) ** 2 + (row - shadowRange) ** 2);
        /**
         * 計算陰影
         * @param {number} color 原始色
         */
        const getShadow = (color) => {
            if (topShadow && leftShadow)
                return getShadowColor(
                    color,
                    getCornerLength(currentRow, currentCol)
                );
            if (topShadow && rightShadow)
                return getShadowColor(
                    color,
                    getCornerLength(currentRow, width - currentCol)
                );
            if (bottomShadow && leftShadow)
                return getShadowColor(
                    color,
                    getCornerLength(height - currentRow, currentCol)
                );
            if (bottomShadow && rightShadow)
                return getShadowColor(
                    color,
                    getCornerLength(height - currentRow, width - currentCol)
                );
            if (topShadow) return getShadowColor(color, currentRow);
            if (leftShadow) return getShadowColor(color, currentCol);
            if (rightShadow) return getShadowColor(color, width - currentCol);
            if (bottomShadow) return getShadowColor(color, height - currentRow);
            return color;
        };
        const _r = getShadow(r);
        const _g = getShadow(g);
        const _b = getShadow(b);

        colors.push(_r, _g, _b, a);
        positionsColor.push(_r, _g, _b);
        const px = x / scaleFactor - width / scaleFactor / 2;
        const py = y / scaleFactor;
        positions.push(px, py, 0.01);
    }

    return {
        positions,
        colors,
        positionsColor,
    };
};

/**
 * 計算動畫影格
 * @description 一張圖 60 幀，但 1~30 幀等於 60~31 幀，因此只計算一半。
 * @param {{
 *     positions: number[];
 *     colors: number[];
 *     positionsColor: number[];
 * }} imageData
 * @param {number} index
 */
const createAnimation = (imageData, index) => {
    let time = 0;

    // const tmpTime = [];
    const { positionsColor, positions, colors } = imageData;
    // const totalLength = positions.length / 3;

    timeClip.forEach((_, tci, tca) => {
        const positionClip = [];
        let tmpPt = [];
        let tmpClr = [];
        // const tmpTime = new Map();
        // const snapshot = tci === tca.length - 10;
        // const clipPercentage = threshold((tci + 1) / tca.length);
        // const allowRange = (base, val) => {
        //     const half = base / 2;
        //     const range = clipPercentage * half;
        //     const max = half + range;
        //     const min = half - range;
        //     const allow = val > min && val < max;
        //     return allow;
        // };
        // const allowCol = (val) => allowRange(w, val);
        // const allowRow = (val) => allowRange(h, val);
        // const allowRange = (val) => val <= clipPercentage * totalLength;

        positions.forEach((p, i) => {
            const c = positionsColor[i];

            if (!(i % 3)) {
                tmpPt = [p];
                tmpClr = [c];
            } else {
                tmpPt.push(p);
                tmpClr.push(c);
            }

            if (tmpPt.length === 3) {
                // const id = (i + 1) / 3;
                // const col = id % w;
                // const row = 1 + parseInt(id / w);
                // const notAllowed = !allowCol(col) && !allowRow(row);
                // const notAllowed = !allowRange(id);
                // if (notAllowed) return positionClip.push(...tmpPt);

                // const time =
                //     typeof tmpTime[id] === "number"
                //         ? (tmpTime[id] += pi)
                //         : (tmpTime[id] = 0);
                const [P1, P2] = createControlPoint(tmpPt, tmpClr);
                const travelP = cubicBezier(tmpPt, P1, P2, time);
                positionClip.push(...travelP);
            }
        });

        const colorClip = colors.map((val, idx) =>
            idx % 4 === 3 ? Math.abs(Math.cos(time)) : val
        );

        postMessage({ positionClip, colorClip, index });

        time += pi;
        if (tci === tca.length - 1) time = 0;
    });
};

onmessage = function (e) {
    const { image, width, height, scaleFactor, index } = e.data;
    const imageData = createAttrs(image, width, height, scaleFactor);
    createAnimation(imageData, index);
    console.log("worker done");
    postMessage(null);
};

/**
 * @typedef {[x: number, y: number, z: number]} Vec3
 */
/**
 * 二次方貝茲曲線
 * @param {Vec3} P0 起始位置
 * @param {Vec3} P1 控制點一
 * @param {Vec3} P2 控制點二
 * @param {number} t (Math.PI/60) 的倍數，最小值 0
 * @returns {Vec3}
 */
function cubicBezier(P0, P1, P2, t) {
    const oneMinusT = 1 - t;
    const oneMinusTSquared = oneMinusT * oneMinusT;
    const tSquared = t * t;

    const x =
        oneMinusTSquared * P0[0] + 2 * oneMinusT * t * P1[0] + tSquared * P2[0];
    const y =
        oneMinusTSquared * P0[1] + 2 * oneMinusT * t * P1[1] + tSquared * P2[1];
    const z =
        oneMinusTSquared * P0[2] + 2 * oneMinusT * t * P1[2] + tSquared * P2[2];

    return [x, y, z];
}

/**
 * 生成控制點
 * @description
 * 每個點 `point` 會依照該點的顏色 `color` 決定控制點的位移量，以此生成額外三個控制點
 * @param {Vec3} point 原點，為三維點座標，其中只有 `point[2]` 恆正
 * @param {Vec3} color `point` 上的 RGB 參數，陣列中的數字最小為 0，最大為 1，數值與位移量成正比
 * @param {number} [maxTravel=1] 控制點間的最長距離
 * @returns {[P1: Vec3, P2: Vec3]} 三個控制點，其中 P3[2] > P2[2] > point[2]，且任一輸出的控制點接不等於 `point`
 */
function createControlPoint(point, color, maxTravel = 1) {
    const [x, y, z] = point;
    const [r, g, b] = color;

    // 根據顏色值計算控制點的位移量
    const avg = (r + g + b) / 3;
    const travelFactor = avg * maxTravel;

    // 生成控制點
    const P1 = [
        randOp(x, r, travelFactor),
        randOp(y, g, travelFactor),
        Math.abs(z + travelFactor),
    ];
    const P2 = [x * g * avg, y * b * avg, Math.abs(b + avg)];

    return [P1, P2];
}

function randOp(a, b, c) {
    return (a * c) / b;
}
