varying highp vec2 vUV;

uniform sampler2D uTexture;
uniform highp float uMultiplier;

void main(void) {
	gl_FragColor = texture2D(uTexture, vUV);
	gl_FragColor.rgb *= uMultiplier;
}
