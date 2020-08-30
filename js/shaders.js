const shaders = {
	addColorShader: async (label) => {
		const selector = createShaderDiv(label);
		const R = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		const G = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		const B = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/color");		
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform3f(compiled.uniform["uColor"], R.value / 0xff, G.value / 0xff, B.value / 0xff);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		R.oninput = runPipeline;
		G.oninput = runPipeline;
		B.oninput = runPipeline;
	},
	addRadialBlurShader: async (label) => {
		const selector = createShaderDiv(label);
		const D = selector.sliders.appendChild(createSlider(60, 130, 100));
		const S = selector.sliders.appendChild(createSlider(70, 120, 100));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/radial");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uDistance"], D.value / 100);
				gl.uniform1f(compiled.uniform["uStrength"], S.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		D.oninput = runPipeline;
		S.oninput = runPipeline;
	},
	addBrightnessShader: async (label) => {
		const selector = createShaderDiv(label);
		const B = selector.sliders.appendChild(createSlider(25, 350, 125));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/brightness");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uMultiplier"], B.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		B.oninput = runPipeline;
	},
	addContrastShader: async (label) => {
		const selector = createShaderDiv(label);
		const C = selector.sliders.appendChild(createSlider(25, 350, 125));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/contrast");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uMultiplier"], C.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		C.oninput = runPipeline;
	},
	addOutputShader: async () => {
		const compiled = await compileShader("shader/output");
		pipelineAdd({
			div: void 0,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uFlip"], pipeline.length % 2 == 0 ? 1.0 : 0.0);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
	}
};
