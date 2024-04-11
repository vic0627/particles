// importScripts("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js");
// importScripts("https://unpkg.com/three@0.149.0/build/three.min.js");

onmessage = function () {
    let i = 0;
    const t = setInterval(() => {
        postMessage(i);
        i++;
    }, 1000);
};
