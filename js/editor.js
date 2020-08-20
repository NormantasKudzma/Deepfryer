"use strict";

let gl = void 0;

let compiledShaders = {};
let inputTexture = void 0;
let vertexBuffer = void 0;
let uvBuffer = void 0;

let pipeline = [];

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
		request.open("GET", `${file}`);
		request.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) { resolve(this.responseText); }
				else { throw `unable to download file ${file}`; }
			}
		}
		request.send();
	});
}

async function compileShader(name){
	if (compiledShaders[name]){
		return compiledShaders[name];
	}
	
	const compile = (shader, source) => {
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		let info = gl.getShaderInfoLog(shader);
		if (info.length > 0){
			throw `Could not compile '${name}' - ${info}`;
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
		throw `Could not link '${name}' - ${info}`;
	}
	
	gl.useProgram(shaderProgram);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	const posAttr = gl.getAttribLocation(shaderProgram, "aPos");
	gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(posAttr);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	const uvAttr = gl.getAttribLocation(shaderProgram, "aUV");
	gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(uvAttr);
	
	compiledShaders[name] = {
		program: shaderProgram,
		vertexShader: vs,
		fragmentShader: fs,
	};
	return compiledShaders[name];
}

async function setupGL(){
	let canvas = document.getElementById("output");
	gl = canvas.getContext("webgl", { stencil: false, depth: false });
	if (!gl) { throw "No webgl context could be created"; }
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	vertexBuffer = createStaticBuffer([-1, 1, -1, -1, 1, -1, 1, 1]);
	uvBuffer = createStaticBuffer([0, 0, 0, 1, 1, 1, 1, 0]);

	inputTexture = imgToTex(document.getElementById("input"));
}

async function addColorShader(){
	const shader = (await compileShader("shader/color")).program;

	const texUniform = gl.getUniformLocation(shader, "uTexture");
	const colorUniform = gl.getUniformLocation(shader, "uColor");
	
	const R = document.getElementById("shiftRed");
	const G = document.getElementById("shiftGreen");
	const B = document.getElementById("shiftBlue");
	const redraw = () => {
		gl.useProgram(shader);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, inputTexture);
		gl.uniform1i(texUniform, 0);
		
		gl.uniform3f(colorUniform, R.value / 0xff, G.value / 0xff, B.value / 0xff);
		
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}
	pipeline.push(redraw);
	R.oninput = runPipeline;
	G.oninput = runPipeline;
	B.oninput = runPipeline;
}

async function addRadialBlurShader(){
	const shader = (await compileShader("shader/radial")).program;

	const texUniform = gl.getUniformLocation(shader, "uTexture");
	const distUniform = gl.getUniformLocation(shader, "uDistance");
	const strUniform = gl.getUniformLocation(shader, "uStrength");

	const D = document.getElementById("radialDistance");
	const S = document.getElementById("radialStrength");
	const redraw = () => {
		gl.useProgram(shader);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, inputTexture);
		gl.uniform1i(texUniform, 0);
		
		gl.uniform1f(distUniform, D.value / 100);
		gl.uniform1f(strUniform, S.value / 100);
		
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}
	pipeline.push(redraw);
	D.oninput = runPipeline;
	S.oninput = runPipeline;
}

async function setup(){
	await setupGL();
	await addColorShader();
	await addRadialBlurShader();
	runPipeline();
}

function runPipeline(){
	const now = () => {
		if (window && window.performance && window.performance.now) { return window.performance.now(); }
		return 0;
	}
	
	const t0 = now();
	for (let f of pipeline) {
		f();
	}
	const t1 = now();
	console.log(`Pipelines done in ${t1 - t0} ms`);
}
