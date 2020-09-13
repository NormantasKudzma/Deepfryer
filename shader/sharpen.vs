attribute vec2 aPos;
attribute vec2 aUV;

varying highp vec2 vUV;

void main(void) {
	gl_Position = vec4(aPos, 0.0, 1.0);
    vUV = aUV;
}
