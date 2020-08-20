varying highp vec2 vUV;

uniform sampler2D uTexture;
uniform highp float uDistance;
uniform highp float uStrength;

void main(void) {
	highp float samples[10];
	samples[0] = -0.08;
	samples[1] = -0.05;
	samples[2] = -0.03;
	samples[3] = -0.02;
	samples[4] = -0.01;
	samples[5] =  0.01;
	samples[6] =  0.02;
	samples[7] =  0.03;
	samples[8] =  0.05;
	samples[9] =  0.08;

	highp vec2 dir = 0.5 - vUV;

	/* Jei reikes offseto - tai tiesiog offsettint vUV */
	highp vec4 color = texture2D(uTexture, vUV); 
	highp vec4 sum = color;
	for (int i = 0; i < 10; i++) {
		sum += texture2D(uTexture, vUV + dir * samples[i] * uDistance);
	}
	sum /= 11.0;
	
	highp float t = clamp(uStrength, 0.0, 1.0);
	gl_FragColor = mix(color, sum, t);
}
