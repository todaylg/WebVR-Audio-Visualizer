import BeginPanel from '../components/beginPanel/BeginPanel';
import isOnBeat from '../components/BeatDetect';

/**
 * Audio visualizer component for A-Frame using AnalyserNode.
 */
AFRAME.registerComponent('audioanalyser', {
	schema: {
		enableBeatDetection: { default: false },
		enableLevels: { default: true },
		enableWaveform: { default: true },
		enableVolume: { default: true },
		fftSize: { default: 2048 },
		smoothingTimeConstant: { default: 0.8 },
		src: { type: 'selector' },
		enableBigBeat: { default: false }
	},

	init: function () {
		this.analyser = null;
		this.levels = null;
		this.waveform = null;
		this.volume = 0;
		this.waveEffectFlag = false;
		this.snowEffectFlag = false;
		this.levelsEffectFlag = false;
		this.lightEffectFlag = false;

		this.prevTime = 0;
		this.bpmTable = [];
		this.historyBuffer = [];
		this.context = null;
		this.decodeBuffer = null;

		let data = this.data;
		let self = this;

		if (!data.src) { return; }

		//create AnalyserNode.
		let context = this.context = new AudioContext();
		let analyser = this.analyser = this.context.createAnalyser();

		let audioEl = data.src;
		this.audio = audioEl;
		let src = audioEl.getAttribute('src');

		//audio element 移交给 audioContext处理
		let source = context.createMediaElementSource(audioEl);
		source.connect(analyser);
		analyser.connect(context.destination);
		analyser.smoothingTimeConstant = data.smoothingTimeConstant;
		analyser.fftSize = data.fftSize;

		this.levels = new Uint8Array(this.analyser.frequencyBinCount);//fftSize值的一半. 该属性通常用于可视化的数据值的数量.(柱状频谱)
		this.waveform = new Uint8Array(this.analyser.fftSize);//FFT (快速傅里叶变换) 的大小.(波形频谱)

		//For bigBeat
		this.MAX_COLLECT_SIZE = 43 * (this.analyser.fftSize / 2);//44032
		this.COLLECT_SIZE = 1;
		//create empty historybuffer
		for (let i = 0; this.historyBuffer.length < this.MAX_COLLECT_SIZE - this.COLLECT_SIZE - 1; i++) {
			this.historyBuffer.push(1);
		}
		this.bigBeatArr = [];

		BeginPanel(context, this.bigBeatArr);
	},

	/**
	 * Update spectrum on each frame.跟踪数据变化
	 */
	tick: function () {
		let data = this.data;
		if (!this.analyser) { return; }

		// Levels (frequency).
		if (data.enableLevels) {
			this.analyser.getByteFrequencyData(this.levels);
		}

		// Waveform.
		if (data.enableWaveform) {
			this.analyser.getByteTimeDomainData(this.waveform);
		}

		// Average volume.
		if (data.enableVolume) {
			let sum = 0;
			for (let i = 0; i < this.levels.length; i++) {
				sum += this.levels[i];;
			}
			this.volume = sum / this.levels.length;

			this.instantEnergy = sum;
		}
		//上面三样是最基础的数据 必要

		if (data.enableBeatDetection) {
			if (isOnBeat.call(this)) {
				this.el.emit('audioanalyser-beat');
			}
		}

		if (data.enableBigBeat) {
			let now = Math.floor(this.audio.currentTime / this.audio.duration * 10000);
			if (this.bigBeatArr.includes(now)) {
				this.el.emit('audioanalyser-bigbeat');
			};
		}
	}
});
