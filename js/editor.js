"use strict";

let sliderR = void 0
let sliderG = void 0
let sliderB = void 0

let original = void 0

function onOpenCvReady(){
	sliderR = document.getElementById("shiftRed");
	sliderR.oninput = deepfry;
	sliderG = document.getElementById("shiftGreen");
	sliderG.oninput = deepfry;
	sliderB = document.getElementById("shiftBlue");
	sliderB.oninput = deepfry;
	
	let inputElem = document.getElementById("input");
	original = cv.imread(inputElem);
	deepfry();
}

function deepfry(){
	if (!original) { return; }
	let mat = original.clone();
	
	// Apply color shift
	let shiftR = sliderR.value & 0xff;
	let shiftG = sliderG.value & 0xff;
	let shiftB = sliderB.value & 0xff;
	let colorShift = new cv.Mat(mat.rows, mat.cols, mat.type(), new cv.Scalar(shiftR, shiftG, shiftB, 255));
	cv.add(mat, colorShift, mat);
	colorShift.delete();
	
	//let outputElem = document.getElementById("output");
	cv.imshow("output", mat);
	mat.delete();
}
