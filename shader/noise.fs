precision mediump float;

varying vec2 vUV;

uniform sampler2D uTexture;
uniform float uDensity;
uniform float uSize;
uniform float uSeed;
uniform float uAlpha;

float rand2(in vec2 co){
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
	float r = rand2(floor((1.0 + vUV.xy) * uSize) * uSeed);
	float sv = step(r, uDensity) * uAlpha;
	gl_FragColor = texture2D(uTexture, vUV);
	gl_FragColor.rgb = mix(gl_FragColor.rgb, fract(vec3(uSeed * 269.169 * r, uSize * r, uDensity * 79.312 * r)), sv);
}
