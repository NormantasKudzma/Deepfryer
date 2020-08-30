varying highp vec2 vUV;

uniform sampler2D uTexture;
uniform highp float uMultiplier;

void main(void) {
	gl_FragColor = texture2D(uTexture, vUV);
	gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * uMultiplier + 0.5;
}
