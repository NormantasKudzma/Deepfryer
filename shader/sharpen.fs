precision lowp float;

varying vec2 vUV;

uniform sampler2D uTexture;
uniform float uDistance;

void main(void) {
	vec4 color = texture2D(uTexture, vUV + vec2(0.0, -uDistance)) * -1.0;
	color += 	 texture2D(uTexture, vUV + vec2(-uDistance, 0.0)) * -1.0;
	color += 	 texture2D(uTexture, vUV)						  * 5.0;
	color += 	 texture2D(uTexture, vUV + vec2(uDistance, 0.0))  * -1.0;
	color += 	 texture2D(uTexture, vUV + vec2(0.0, uDistance))  * -1.0;
	gl_FragColor = color;
}
