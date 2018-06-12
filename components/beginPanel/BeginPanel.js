import config from '../../scripts/config';
import PreAnalysis from '../../scripts/PreAnalysis';

//sourceNode根据开始面板的选择在这里初始化(sourceInit)
function BeginPanel(context, analyser, bigBeatArr, convolutionNodes, gainNodes, sourceGainNode, convolutionInfo) {
	let beginBtn = document.getElementById('beginBtn');
	let audio = document.getElementById('song');//audioEl
	let audioFile = document.getElementById('file');
	let beginPanel = document.getElementById('beginPanel');
	let singBtn = document.getElementById('singBtn');

	beginBtn.addEventListener('click', () => {
		handleAudio('click');
	})

	audioFile.addEventListener('change', () => {
		let file = audioFile.files[0];
		audio.src = URL.createObjectURL(file);

		handleAudio('change');
	})

	//Just Sing 
	singBtn.addEventListener('click', () => {
		let constraints = { audio: true };
		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				let sourceInit = context.createMediaStreamSource(stream);
				sourceInit.connect(sourceGainNode);
				sourceGainNode.connect(analyser);
				analyser.connect(context.destination);
				//环境音效
				for (let i = 0; i < convolutionNodes.length; i++) {
					sourceInit.connect(convolutionNodes[i]);
					convolutionNodes[i].connect(gainNodes[i]);
					gainNodes[i].connect(analyser);
					analyser.connect(context.destination);
				}

				//同样fix 移动端
				let buffer = context.createBuffer(1, 1, config.sampleRateGuess / 2);
				let source = context.createBufferSource();
				source.buffer = buffer;
				source.connect(context.destination);
				source.start(0);
			})
			.catch(function (err) {
				console.log(err);
				/* 处理error */
			});
		beginPanel.remove();//隐藏面板
	})

	let handleAudio = (flag) => {
		// 初始化
		// 使用createMediaElementSource将Audio Element移交给AudioContext处理
		// 这样使用suspend、resume等方法与play、pause同样效果
		let sourceInit = context.createMediaElementSource(audio);
		sourceInit.connect(sourceGainNode);
		sourceGainNode.connect(analyser);
		analyser.connect(context.destination);
		//环境音效
		for (let i = 0; i < convolutionNodes.length; i++) {
			sourceInit.connect(convolutionNodes[i]);
			convolutionNodes[i].connect(gainNodes[i]);
			gainNodes[i].connect(analyser);
			analyser.connect(context.destination);
		}
		
		// 后面的两种方法是为了适配移动端发声用的
		// For mobile
		// 两种方法
		// 方法一 需要有已经解码完的buffer数据，不太适合，因为处理大文件音频的时候需要较长时间
		// create empty buffer
		// create new buffer source for playback with an already
		// loaded and decoded empty sound file
		// let source = self.context.createBufferSource();
		// alert(self.decodeBuffer);//已经解码完的buffer数据
		// source.buffer = self.decodeBuffer;
		// // connect to output (your speakers)
		// source.connect(self.analyser);
		// self.analyser.connect(self.context.destination);
		// // play the file
		// source.start(0);

		//方法二 直接合上一个无关紧要的buffer数据来解禁被静音的context
		// create empty buffer
		let buffer = context.createBuffer(1, 1, config.sampleRateGuess / 2);
		let source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.start(0);

		//For Mobile
		audio.play();//得同步的方法紧接着事件触发才行

		beginPanel.remove();//todo 加个处理中，然后取消开始面板放在回调中

		//For Firework
		//TODO 这里在手机上触发不了（oncanplaythrough也是）
		if (flag === 'click') {
			PreAnalysis(audio, bigBeatArr);
		} else {
			audio.oncanplaythrough = () => {
				PreAnalysis(audio, bigBeatArr);
			};
		}
	}
}

export default BeginPanel;