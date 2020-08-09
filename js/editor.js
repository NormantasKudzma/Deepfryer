"use strict";

let sliderR = void 0
let sliderG = void 0
let sliderB = void 0

let sliderGrain = void 0

let sliderBlurAngle = void 0
let sliderBlurStrength = void 0

let original = void 0
let staging = void 0

function randomInt(max) {
  return (Math.random() * max) | 0;
}

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function setupElement(name){
	let e = document.getElementById(name);
	e.oninput = deepfry;
	return e;
}

function onOpenCvReady(){
	sliderR = setupElement("shiftRed");
	sliderG = setupElement("shiftGreen");
	sliderB = setupElement("shiftBlue");
	
	sliderGrain = setupElement("grainPercent");
	
	sliderBlurAngle = setupElement("blurAngle");
	sliderBlurStrength = setupElement("blurStrength");
	
	let inputElem = document.getElementById("input");
	original = cv.imread(inputElem);
	staging = original.clone();
	deepfry();
}

function colorShift(mat){
	let shiftR = sliderR.value & 0xff;
	let shiftG = sliderG.value & 0xff;
	let shiftB = sliderB.value & 0xff;
	staging.setTo(new cv.Scalar(shiftR, shiftG, shiftB, 0));
	cv.add(mat, staging, mat);
}

function motionBlur(mat){
	let strength = sliderBlurStrength.value | 0;
	if (strength <= 0) { return; }
	
	strength = strength * 2 + 1;
	
	let angle = sliderBlurAngle.value | 0;
	let kernel = new cv.Mat(strength, strength, cv.CV_32FC1);
	
	const data = kernel.data32F;
	const pivot = (strength / 2) | 0;
	let ones = 0;
	for (let y = 0; y < strength; ++y){
		for (let x = 0; x < strength; ++x){
			const dx = x - pivot;
			const dy = pivot - y;
			const ia = (Math.atan2(dy, dx) * 180 / Math.PI);
			let angleDiff = Math.abs(angle - ia);
			angleDiff = Math.min(180 - angleDiff, angleDiff);
			data[y * strength + x] = (angleDiff <= 30 ? 1 : 0);
			ones += data[y * strength + x];
		}
	}
	for (let i = 0; i < strength * strength; ++i){
		data[i] /= ones;
	}
	
	cv.filter2D(mat, mat, cv.CV_8U, kernel);
	kernel.delete();
}

function grain(mat){
	if (!mat.isContinuous()) { return; }
	
	const channels = mat.channels();
	const rows = mat.rows;
	const cols = mat.cols;
	const data = mat.data;
	let grainPixels = rows * cols * (clamp(sliderGrain.value, 0, 99) / 100)
	
	while (grainPixels > 0){
		let r = randomInt(rows);
		let c = randomInt(cols);
		let p = r * cols * channels + c * channels;
		let random = randomInt(0xffffff);
		data[p + 0] = (random >> 16) & 0xff;
		data[p + 1] = (random >> 8) & 0xff;
		data[p + 2] = random & 0xff;
		--grainPixels;
	}
}

function deepfry(){
	if (!original) { return; }
	let mat = original.clone();
	
	colorShift(mat);
	grain(mat);
	motionBlur(mat);
	
	cv.imshow("output", mat);
	mat.delete();
}
