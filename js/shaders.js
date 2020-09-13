const shaders = {
	addColorShader: async (label) => {
		const selector = createShaderDiv(label);
		const R = selector.sliders.appendChild(createSlider(0, 0xff, 0xff, runPipeline));
		const G = selector.sliders.appendChild(createSlider(0, 0xff, 0xff, runPipeline));
		const B = selector.sliders.appendChild(createSlider(0, 0xff, 0xff, runPipeline));
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
	},
	addRadialBlurShader: async (label) => {
		const selector = createShaderDiv(label);
		const D = selector.sliders.appendChild(createSlider(60, 130, 100, runPipeline));
		const S = selector.sliders.appendChild(createSlider(70, 120, 100, runPipeline));
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
	},
	addBrightnessShader: async (label) => {
		const selector = createShaderDiv(label);
		const B = selector.sliders.appendChild(createSlider(25, 350, 125, runPipeline));
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
	},
	addContrastShader: async (label) => {
		const selector = createShaderDiv(label);
		const C = selector.sliders.appendChild(createSlider(25, 350, 125, runPipeline));
		const S = selector.sliders.appendChild(createSlider(25, 350, 125, runPipeline));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/contrast");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uContrast"], C.value / 100);
				gl.uniform1f(compiled.uniform["uSaturation"], S.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
	},
	addNoiseShader: async (label) => {
		const selector = createShaderDiv(label);
		const D = selector.sliders.appendChild(createSlider(0, 100, 50, runPipeline));
		const S = selector.sliders.appendChild(createSlider(4, 300, 4, runPipeline));
		const A = selector.sliders.appendChild(createSlider(1, 100, 75, runPipeline));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/noise");
		const seed = Math.abs(Math.sin((Date.now() | 0) * 1.61803398874989484820459));
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uDensity"], D.value / 100);
				gl.uniform1f(compiled.uniform["uSize"], (S.max | 0) + (S.min | 0) - (S.value | 0));
				gl.uniform1f(compiled.uniform["uSeed"], seed);
				gl.uniform1f(compiled.uniform["uAlpha"], A.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
	},
	addSharpenShader: async(label) => {
		const selector = createShaderDiv(label);
		const D = selector.sliders.appendChild(createSlider(1, 20, 3, runPipeline));
		insertToShaderPanel(pipelinePanel, selector);
		
		const compiled = await compileShader("shader/sharpen");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(compiled.program);
				gl.uniform1i(compiled.uniform["uTexture"], 0);
				gl.uniform1f(compiled.uniform["uDistance"], D.value / 400);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
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
