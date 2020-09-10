"use strict";

let gl = void 0;

let inputImage = void 0;
let inputTexture = void 0;
let framebuffers = [];
let framebufferTextures = [];

let compiledShaders = {};
let vertexBuffer = void 0;
let uvBuffer = void 0;

let pipeline = [];

let pipelinePanel = void 0;

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
		console.error(gl.getProgramInfoLog(shaderProgram));
		console.error(gl.getShaderInfoLog(vs));
		console.error(gl.getShaderInfoLog(fs));
		throw `Could not link '${name}'`;
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
	
	const numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
	let uniforms = {};
	for (let i = 0; i < numUniforms; ++i){
		let u = gl.getActiveUniform(shaderProgram, i);
		uniforms[u.name] = gl.getUniformLocation(shaderProgram, u.name);
	}
	
	compiledShaders[name] = {
		program: shaderProgram,
		vs: vs,
		fs: fs,
		uniform: uniforms,
	};
	return compiledShaders[name];
}

async function setupGL(){
	const canvas = document.getElementById("output");
	gl = canvas.getContext("webgl", {
		stencil: false,
		depth: false,
		preserveDrawingBuffer:true,
	});
	if (!gl) { throw "No webgl context could be created"; }
	
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.disable(gl.BLEND);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.SCISSOR_TEST);
	gl.disable(gl.STENCIL_TEST);
	
	const createStaticBuffer = (data) => {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return buffer;
	};
	vertexBuffer = createStaticBuffer([-1, 1, -1, -1, 1, -1, 1, 1]);
	uvBuffer = createStaticBuffer([0, 0, 0, 1, 1, 1, 1, 0]);
}

function recreateFramebuffers(){
	framebufferTextures = [];
	framebuffers = [void 0, void 0].map(_ => {
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		const framebufferTexture = newTex(gl.canvas.width, gl.canvas.height);
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

function pipelineAdd(stage){
	if (pipeline.length == 0){
		pipeline.push(stage);
	}
	else {
		pipeline.splice(pipeline.length - 1, 0, stage);
	}
}

async function setup(){
	pipelinePanel = document.getElementById("pipeline_panel");
	setupShaderPanel(pipelinePanel);
	pipelinePanel.onreorder = (children) => {
		let reordered = [];
		for (let i = 0; i < children.length; ++i){
			const stage = pipeline.find(s => {
				return s.div == children[i];
			});
			if (stage && stage.div) { reordered.push(stage); }
		}
		reordered.push(pipeline[pipeline.length - 1]);
		pipeline = reordered;
		runPipeline();
	};
	
	const dropdownPanel = document.getElementById("dropdown_panel");
	setupDropdownPanel(dropdownPanel, {
		"Color shift": shaders.addColorShader,
		"Radial blur": shaders.addRadialBlurShader,
		"Brightness": shaders.addBrightnessShader,
		"Contrast": shaders.addContrastShader,
		"Noise": shaders.addNoiseShader,
	});
	dropdownPanel.onadded = () => {
		runPipeline();
	};
	
	const firstRun = document.getElementById("first_run");
	inputImage = document.getElementById("input");
	inputImage.onload = () => {
		inputTexture = imgToTex(inputImage);
		hide(firstRun);
		show(gl.canvas);
		gl.canvas.width = inputImage.width;
		gl.canvas.height = inputImage.height;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		recreateFramebuffers();
		runPipeline();
	};
	const uploadButton = document.getElementById("upload_button");
	uploadButton.addEventListener('change', function() {
		if (this.files && this.files[0]) {
			inputImage.src = URL.createObjectURL(this.files[0]);
		}
	});
	
	setupGL().then(async () => {
		await shaders.addOutputShader();
		debug.onSetupGL();
	});
}

function runPipeline(){
	if (pipeline.length == 0) { return; }
	if (!inputTexture) { return; }
	
	perf.startMeasure();
	
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
		pipeline[i].render();
		swapBuffers();
	}
	bindFramebuffer(void 0);
	pipeline[pipeline.length - 1].render();
	perf.endMeasure();
}
