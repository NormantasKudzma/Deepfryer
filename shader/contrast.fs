precision lowp float;

varying vec2 vUV;

uniform sampler2D uTexture;
uniform float uContrast;
uniform float uSaturation;

const vec3 toLuminosity = vec3(0.2125, 0.7154, 0.0721);
	
void main(void) {
	vec4 color = texture2D(uTexture, vUV);
	vec3 luminosity = vec3(dot(color.rgb, toLuminosity));
	vec3 saturation = mix(luminosity, color.rgb, uSaturation);
	vec3 contrast = mix(vec3(0.5), saturation, uContrast);
	gl_FragColor.rgb = contrast;
	gl_FragColor.a = color.a;
}
