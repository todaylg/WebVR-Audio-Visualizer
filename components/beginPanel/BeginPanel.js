import BeatFirework from './BeatFirework.js';

function BeginPanel(context, bigBeatArr) {
	//Begin panel
	let beginBtn = document.getElementById('beginBtn');
	let audio = document.getElementById('song');//audioEl
	let audioFile = document.getElementById('file');
	let beginPanel = document.getElementById('beginPanel');

	beginBtn.addEventListener('click', () => {
		//For mobile
		//两种方法
		//方法一 需要有已经解码完的buffer数据，不太适合，因为处理大文件音频的时候需要较长时间
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
		let buffer = context.createBuffer(1, 1, 22050);
		let source = context.createBufferSource();
		source.buffer = buffer;
		// connect to output (your speakers)
		source.connect(context.destination);
		source.start(0);
		
		//For Mobile
		audio.play();//得同步的方法紧接着事件触发才行

		beginPanel.remove();//todo 加个处理中，然后取消开始面板放在回调中

		//Here for Firework
		//TODO 这里在手机上触发不了（oncanplaythrough也是，是已经处理完了的缘故吗？）
		BeatFirework(audio, bigBeatArr);
	})

	audioFile.addEventListener('change', () => {
		let file = audioFile.files[0];
		audio.src = URL.createObjectURL(file);

		let buffer = context.createBuffer(1, 1, 22050);
		let source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.start(0);
		audio.play();

		beginPanel.remove();//todo 加个处理中，然后取消开始面板放在回调中
		//Here for Firework
		audio.oncanplaythrough = () => {
			BeatFirework(audio, bigBeatArr);
		};
	})
}

export default BeginPanel;