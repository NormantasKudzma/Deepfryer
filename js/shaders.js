const shaders = {
	addColorShader: async (label) => {
		const selector = createShaderDiv(label);
		const R = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		const G = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		const B = selector.sliders.appendChild(createSlider(0, 0xff, 0xff));
		insertToShaderPanel(pipelinePanel, selector);
		
		const shader = (await compileShader("shader/color")).program;
		const texUniform = gl.getUniformLocation(shader, "uTexture");
		const colorUniform = gl.getUniformLocation(shader, "uColor");
		
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(shader);
				gl.uniform1i(texUniform, 0);
				gl.uniform3f(colorUniform, R.value / 0xff, G.value / 0xff, B.value / 0xff);
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
		
		const shader = (await compileShader("shader/radial")).program;
		const texUniform = gl.getUniformLocation(shader, "uTexture");
		const distUniform = gl.getUniformLocation(shader, "uDistance");
		const strUniform = gl.getUniformLocation(shader, "uStrength");
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(shader);
				gl.uniform1i(texUniform, 0);
				gl.uniform1f(distUniform, D.value / 100);
				gl.uniform1f(strUniform, S.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		D.oninput = runPipeline;
		S.oninput = runPipeline;
	},
	addContrastShader: async (label) => {
		const selector = createShaderDiv(label);
		const C = selector.sliders.appendChild(createSlider(25, 350, 125));
		insertToShaderPanel(pipelinePanel, selector);
		
		const shader = (await compileShader("shader/contrast")).program;
		const texUniform = gl.getUniformLocation(shader, "uTexture");
		const multiplierUniform = gl.getUniformLocation(shader, "uMultiplier");
		
		pipelineAdd({
			div: selector.root,
			render: () => {
				gl.useProgram(shader);
				gl.uniform1i(texUniform, 0);
				gl.uniform1f(multiplierUniform, C.value / 100);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
		C.oninput = runPipeline;
	},
	addOutputShader: async () => {
		const shader = (await compileShader("shader/output")).program;
		const texUniform = gl.getUniformLocation(shader, "uTexture");
		const flipUniform = gl.getUniformLocation(shader, "uFlip");
		
		pipelineAdd({
			div: void 0,
			render: () => {
				gl.useProgram(shader);
				gl.uniform1i(texUniform, 0);
				gl.uniform1f(flipUniform, pipeline.length % 2 == 0 ? 1.0 : 0.0);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		});
	}
};
