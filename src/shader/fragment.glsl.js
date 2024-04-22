export default /* glsl */ `
precision mediump float;

uniform sampler2D vTexture;
uniform float vFrameTime;

varying vec2 vUv;

const float HALF_FRAME = 30.0;

void main() {
    vec4 vt = texture2D(vTexture, vUv);
    bool innerRange = vUv.x > 0.2 && vUv.x < 0.8 && vUv.y > 0.15 && vUv.y < 0.85;
    if (vt.w == 0.0 && innerRange) {
        float framePercentage = vFrameTime / HALF_FRAME;
        vt = vec4(vec3(framePercentage), 1.0 - framePercentage);
    }
    gl_FragColor = vt;
}
`;
