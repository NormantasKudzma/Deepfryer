"use strict";

let sliderR = void 0
let sliderG = void 0
let sliderB = void 0

let sliderGrain = void 0

let sliderBlurAngle = void 0
let sliderBlurStrength = void 0

let original = void 0
let staging = void 0

let gl = void 0

function randomInt(max){
  return (Math.random() * max) | 0;
}

function clamp(num, min, max){
  return num <= min ? min : num >= max ? max : num;
}

function imgToTex(elem){
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = elem.width;
	const height = elem.height;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
  
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, elem);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	return texture;
}

function createStaticBuffer(data){
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return buffer;
}

async function get(file){
	return new Promise(resolve => {
		let request = new XMLHttpRequest();
		request.open('GET', `${file}`);
		request.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) { resolve(this.responseText); }
				else { throw new Error(`unable to download file ${file}`); }
			}
		}
		request.send();
	});
}

async function compileShader(name){
	const compile = (shader, source) => {
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		let info = gl.getShaderInfoLog(shader);
		if (info.length > 0){
			throw `Could not compile '${name}'. ` + info;
		}
		return shader;
	};
	
	const sources = await Promise.all([get(`${name}.vs`), get(`${name}.fs`)]);
	const vs = compile(gl.createShader(gl.VERTEX_SHADER), sources[0]);
	const fs = compile(gl.createShader(gl.FRAGMENT_SHADER), sources[1]);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vs);
	gl.attachShader(shaderProgram, fs);
	gl.linkProgram(shaderProgram);
	
	gl.validateProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		let info = gl.getProgramInfoLog(shaderProgram);
		throw `Could not link '${name}'. ` + info;
	}
	
	return {
		program: shaderProgram,
		vertexShader: vs,
		fragmentShader: fs,
	}
}

async function setup() {
	let canvas = document.getElementById("output");
	gl = canvas.getContext("webgl", { stencil: false, depth: false });
	if (!gl) { console.log("no gl"); return; }
	
	gl.viewport(0,0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	let vertex_buffer = createStaticBuffer([-1, 1, -1, -1, 1, -1, 1, 1]);
	let uv_buffer = createStaticBuffer([0, 0, 0, 1, 1, 1, 1, 0]);

	let compiled = await compileShader("tex");
	let shaderProgram = compiled.program;

	gl.useProgram(shaderProgram);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	const posAttr = gl.getAttribLocation(shaderProgram, "aPos");
	gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(posAttr);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
	const uvAttr = gl.getAttribLocation(shaderProgram, "aUV");
	gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(uvAttr);

	const texUniform = gl.getUniformLocation(shaderProgram, 'uTexture');
	gl.activeTexture(gl.TEXTURE0);
	let tex = imgToTex(document.getElementById("input"));
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.uniform1i(texUniform, 0);
	
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}
