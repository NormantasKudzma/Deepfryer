"use strict";

let gl = void 0;

let inputTexture = void 0;
let framebuffers = [];
let framebufferTextures = [];

let compiledShaders = {};
let vertexBuffer = void 0;
let uvBuffer = void 0;

let pipeline = [];

function newTex(w, h, data){
	const level = 0;
	const internalFormat = gl.RGBA;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
  
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	if (data) {
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, data);
	}
	else {
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, w, h, 0, srcFormat, srcType, void 0);
	}

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	return texture;
}

function imgToTex(elem){
	return newTex(elem.width, elem.height, elem);
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
		vs: vs,
		fs: fs,
	};
	return compiledShaders[name];
}

async function setupGL(){
	const canvas = document.getElementById("output");
	gl = canvas.getContext("webgl", { stencil: false, depth: false });
	if (!gl) { throw "No webgl context could be created"; }
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	const createStaticBuffer = (data) => {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return buffer;
	};
	vertexBuffer = createStaticBuffer([-1, 1, -1, -1, 1, -1, 1, 1]);
	uvBuffer = createStaticBuffer([0, 0, 0, 1, 1, 1, 1, 0]);
	
	const inputImage = document.getElementById("input");
	inputTexture = imgToTex(inputImage);

	framebuffers = [void 0, void 0].map(_ => {
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		const framebufferTexture = newTex(inputImage.width, inputImage.height);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebufferTexture, 0);
		const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (framebufferStatus != gl.FRAMEBUFFER_COMPLETE){
			throw `Could not create framebuffer: error code ${framebufferStatus}`;
		}
		framebufferTextures.push(framebufferTexture);
		return framebuffer;
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, void 0)
}

async function addColorShader(){
	const shader = (await compileShader("shader/color")).program;
	const texUniform = gl.getUniformLocation(shader, "uTexture");
	const colorUniform = gl.getUniformLocation(shader, "uColor");
	
	const R = document.getElementById("shiftRed");
	const G = document.getElementById("shiftGreen");
	const B = document.getElementById("shiftBlue");
	pipeline.push(() => {
		gl.useProgram(shader);
		gl.uniform1i(texUniform, 0);
		gl.uniform3f(colorUniform, R.value / 0xff, G.value / 0xff, B.value / 0xff);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	});
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
	pipeline.push(() => {
		gl.useProgram(shader);
		gl.uniform1i(texUniform, 0);
		gl.uniform1f(distUniform, D.value / 100);
		gl.uniform1f(strUniform, S.value / 100);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	});
	D.oninput = runPipeline;
	S.oninput = runPipeline;
}

async function addOutputShader(){
	const shader = (await compileShader("shader/output")).program;
	const texUniform = gl.getUniformLocation(shader, "uTexture");
	const flipUniform = gl.getUniformLocation(shader, "uFlip");
	
	pipeline.push(() => {
		gl.useProgram(shader);
		gl.uniform1i(texUniform, 0);
		gl.uniform1f(flipUniform, pipeline.length % 2 == 0 ? 1.0 : 0.0);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	});
}

async function setup(){
	setupGL().then(() => {
		Promise.all([
			addColorShader(),
			addRadialBlurShader(),
			addOutputShader(),
		]).then(() => runPipeline());
	});
	
	testDivs();
}

function runPipeline(){
	if (pipeline.length == 0) { return; }
	
	const now = () => {
		if (window && window.performance && window.performance.now) { return window.performance.now(); }
		return 0;
	}
	const t0 = now();
	
	const bindFramebuffer = (fb) => {
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	};
	
	let activeFramebuffer = 0;
	const swapBuffers = () => {
		gl.bindTexture(gl.TEXTURE_2D, framebufferTextures[activeFramebuffer]);
		activeFramebuffer = 1 - activeFramebuffer;
		bindFramebuffer(framebuffers[activeFramebuffer]);
	};
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, inputTexture);
	bindFramebuffer(framebuffers[activeFramebuffer]);
	
	for (let i = 0; i < pipeline.length - 1; ++i){
		pipeline[i]();
		swapBuffers();
	}
	bindFramebuffer(void 0);
	pipeline[pipeline.length - 1]();
	
	const t1 = now();
	console.log(`Pipelines done in ${t1 - t0} ms`);
}

function testDivs(){
	let owner = document.getElementById('test_drag');
	setupShaderPanel(owner);
	for (let i = 0; i < 3; ++i){
		let div = createShaderDiv(`Shader select ${i}`);
		div.sliders.appendChild(createSlider(0, 100, (i + 1) * 25, `${i}-slider`));
		div.sliders.appendChild(createSlider(0, 100, (Math.random() * 100) | 0, `${i + 40}-slider`));
	//<input type="range" min="0" max="255" value="255" class="slider" id="shiftRed">
		insertToShaderPanel(owner, div);
	}
	owner.onreorder = () => {
		console.log('panel reordered');
	};
}
