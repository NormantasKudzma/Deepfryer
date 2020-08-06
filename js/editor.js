"use strict";

function onOpenCvReady(){
	deepfry();
}

function deepfry(){
	let inputElem = document.getElementById("input");
	let mat = cv.imread(inputElem);
	
	let outputElem = document.getElementById("output");
	cv.imshow(mat, outputElem);
}
