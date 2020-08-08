"use strict";

let sliderR = void 0
let sliderG = void 0
let sliderB = void 0

let sliderGrain = void 0

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
	
	cv.imshow("output", mat);
	mat.delete();
}
