const debugEnabled = false;//location.hostname == "localhost";

const perf = {
	t0: 0,
	now: function() {
		if (window && window.performance && window.performance.now) { return window.performance.now(); }
		return 0;
	},
	startMeasure: function() {
		if (!debugEnabled){ return; }
		this.t0 = this.now();
	},
	endMeasure: function() {
		if (!debugEnabled){ return; }
		
		const t1 = this.now();
		console.log(`Pipelines done in ${t1 - this.t0} ms`);
		
		const gle = gl.getError();
		if (gle != gl.NO_ERROR){
			throw `Opengl error occured ${gle}`;
		}
	}
}

const debug = {
	onSetupGL: function() {
		if (!debugEnabled) { return; }
		inputImage.src = 'viktor.png';
	}
}
