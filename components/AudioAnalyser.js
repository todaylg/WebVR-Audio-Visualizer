import BeginPanel from './beginPanel/BeginPanel';
import isOnBeat from '../scripts/RealTimeDetect';
import initEnvEffect from '../scripts/EnvEffect';

//核心组件，实时检测、预分析检测判断
AFRAME.registerComponent('audioanalyser', {
	schema: {
		enableLevels: { default: true },
		enableWaveform: { default: true },
		enableVolume: { default: true },
		fftSize: { default: 2048 },
		smoothingTimeConstant: { default: 0.8 },
		src: { type: 'selector' },
		enableBeatDetection: { default: false },//实时检测算法默认关闭
		enableBigBeat: { default: false },
		enableEyesDraw: { default: false }
	},

	init: function () {
		this.analyser = null;
		this.levels = null;
		this.waveform = null;
		this.volume = 0;
		this.waveEffectFlag = false;//相当于全局变量
		this.levelsEffectFlag = false;
		this.lightEffectFlag = false;
		this.eyesDraw = false;
		
		this.prevTime = 0;
		this.bpmTable = [];
		this.historyBuffer = [];
		this.context = null;
		this.decodeBuffer = null;

		let data = this.data;
		let self = this;

		this.oldNow = 0;

		this.bigBeatArr = [];

		if (!data.src) { return; }

		//创建实时音频上下文
		let context = this.context = new AudioContext();
		let analyser = this.analyser = this.context.createAnalyser();

		let audioEl = data.src;
		this.audio = audioEl;

		//初始化analyser
		analyser.smoothingTimeConstant = data.smoothingTimeConstant;
		analyser.fftSize = data.fftSize;

		//frequencyBinCount为fftSize值的一半（默认2048）. 该属性通常用于可视化的数据值的数量.(柱状频谱)
		this.levels = new Uint8Array(this.analyser.frequencyBinCount);
		this.waveform = new Uint8Array(this.analyser.fftSize);//FFT的大小(默认2048)

		//44032 1s(44100/1024=43次fft,也就是43个levels更新)
		//这样这个43就算多了，应该是44100/2048 => 43/2 => 应该用22
		this.MAX_COLLECT_SIZE = 22 * (this.analyser.fftSize / 2);
		this.COLLECT_SIZE = 1;
		//填充历史缓存
		for (let i = 0; this.historyBuffer.length < this.MAX_COLLECT_SIZE - this.COLLECT_SIZE - 1; i++) {
			this.historyBuffer.push(1);
		}
		//初始化环境音效
		let {envEffectIndex, convolutionInfo, sourceGainNode, convolutionNodes, gainNodes} = initEnvEffect(context);
		//同步至全局
		this.envEffectIndex = envEffectIndex;this.convolutionInfo = convolutionInfo;this.sourceGainNode = sourceGainNode;this.convolutionNodes = convolutionNodes;this.gainNodes = gainNodes;
		BeginPanel(context, analyser, this.bigBeatArr, convolutionNodes, gainNodes, sourceGainNode, convolutionInfo);//预分析
	},

	//跟踪数据变化
	tick: function () {
		let data = this.data;

		// Levels
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

		if (data.enableBigBeat || data.enableEyesDraw) {
			let now = Math.floor(this.audio.currentTime / this.audio.duration * 10000);
			if (this.bigBeatArr.includes(now)) {
				if (this.oldNow === now) return;//防止触发两次（精度原因）
				this.el.emit('audioanalyser-bigbeat');
				this.oldNow = now;
			};
		}
	}
});
