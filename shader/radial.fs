precision lowp float;

varying vec2 vUV;

uniform sampler2D uTexture;
uniform float uDistance;
uniform float uStrength;

const int numSamples = 6;
float samples[numSamples];

void main(void) {
	samples[0] = -0.06;
	samples[1] = -0.04;
	samples[2] = -0.02;
	samples[3] =  0.02;
	samples[4] =  0.04;
	samples[5] =  0.06;

	vec2 dir = 0.5 - vUV;

	/* Jei reikes offseto - tai tiesiog offsettint vUV */
	vec4 color = texture2D(uTexture, vUV); 
	vec4 sum = color;
	for (int i = 0; i < numSamples; i++) {
		sum += texture2D(uTexture, vUV + dir * samples[i] * uDistance);
	}
	sum /= 1.0 + float(numSamples);
	
	float t = clamp(uStrength, 0.0, 1.0);
	gl_FragColor = mix(color, sum, t);
}
