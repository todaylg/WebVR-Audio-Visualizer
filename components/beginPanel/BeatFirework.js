function BeatFirework(audio, bigBeatArr) {
	let audioLength = audio.duration, musicSrc = audio.getAttribute('src');

	let OfflineContext = window.OfflineAudioContext;
	let context = new OfflineContext(2, audioLength * 44100, 44100);//numOfChannels,length,sampleRate

	// load a sound and play it immediatly
	LoadBuffer(context, musicSrc, function onload(buffer) {
		let destination = context.destination;

		let source = context.createBufferSource();
		source.buffer = buffer;

		//低通滤波器先走一波
		let lowpass = context.createBiquadFilter();
		lowpass.type = "lowpass";
		lowpass.frequency.value = 150;//高于150的直接pass
		lowpass.Q.value = 1;

		source.connect(lowpass);

		//高通滤波器再来一遭
		let highpass = context.createBiquadFilter();
		highpass.type = "highpass";
		highpass.frequency.value = 100;//低于100的直接pass
		highpass.Q.value = 1;//Quality

		lowpass.connect(highpass);

		highpass.connect(destination);

		source.start(0);

		//For Mobile(TODO) Mobile触发不了这个oncomplete事件
		//For PC
		context.startRendering().then((buffer) => {
			//This AudioNode will do the amplitude modulation effect directly in JavaScript
			console.log("Compelete BigBeatAnalyse");
			let peaks = GetPeaks([buffer.getChannelData(0), buffer.getChannelData(1)]);//双声道
			peaks.forEach(function (peak) {//将peaks信息进行绘制
				bigBeatArr.push(Math.floor(peak.position / buffer.length * 10000));
			});
			console.log(bigBeatArr);
			//For PC TODO => Merge with mobile
			audio.play();
		});
	});
}

function LoadBuffer(context, url, onLoad, onComplete, onError) {
	onLoad = onLoad || function (buffer) { }
	onError = onError || function () { }

	let request;
	if (url instanceof Blob) {
		request = new FileReader();
	} else {
		request = new XMLHttpRequest()
		request.open('GET', url, true)
		request.responseType = 'arraybuffer'
	}

	request.onload = function () {
		context.decodeAudioData(request.response, function (buffer) {//解码
			// callback
			onLoad(buffer);

		}, function () {
			// callback
			onError()
		})
	}
	request.send()
}

function GetPeaks(data) {
	let partSize = 22050,
		parts = data[0].length / partSize,
		peaks = [];

	for (let i = 0; i < parts; i++) {//分块处理
		let max = 0;
		for (let j = i * partSize; j < (i + 1) * partSize; j++) {
			let volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
			if (!max || (volume > max.volume)) {
				max = {
					position: j,
					volume: volume
				};
			}
		}
		peaks.push(max);// 0.5秒里要么有一个(取0.5秒里最大的)要么一个都没有
	}

	// We then sort the peaks according to volume...

	peaks.sort(function (a, b) {//顺序排序
		return b.volume - a.volume;
	});

	// ...take the loundest half of those...

	peaks = peaks.splice(0, peaks.length * 0.5);//取后一半

	// ...and re-sort it back based on position.

	peaks.sort(function (a, b) {//按位置重新排好
		return a.position - b.position;
	});

	return peaks;
}

export default BeatFirework;