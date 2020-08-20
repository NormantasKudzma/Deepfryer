varying highp vec2 vUV;

uniform sampler2D uTexture;
uniform highp vec3 uColor;

void main(void) {
	gl_FragColor = texture2D(uTexture, vUV) * vec4(uColor, 1.0);
}
