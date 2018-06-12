//实时检测算法
function isOnBeat() {
	var localAverageEnergy = 0;
	var instantCounter = 0;
	var isBeat = false;
	// fill history buffer 
	for (var i = 0; i < this.levels.length - 1; i++ , ++instantCounter) {
		this.historyBuffer.push(this.levels[i]);  //add sample to historyBuffer
	}
	//sensitivity of detection
	this.sens = 1.05;
	if (instantCounter > this.COLLECT_SIZE - 1 &&
		this.historyBuffer.length > this.MAX_COLLECT_SIZE - 1) {

		this.instantEnergy = this.instantEnergy / (this.COLLECT_SIZE * (this.analyser.fftSize / 2));

		var average = 0;
		for (var i = 0; i < this.historyBuffer.length - 1; i++) {
			average += this.historyBuffer[i];
		}

		localAverageEnergy = average / this.historyBuffer.length;

		var timeDiff = this.context.currentTime - this.prevTime;
		
		if (timeDiff > 3) {
			this.prevTime = timeDiff = 0;
		}

		if (timeDiff > 0.5 && timeDiff < 1) {
			this.sens -= (this.sens - 1) * (timeDiff - 0.5) / 0.5;
		}

		if (this.context.currentTime > 0.29 && this.instantEnergy > localAverageEnergy &&
			(this.instantEnergy > (this.sens * localAverageEnergy)) &&
			((timeDiff < 1.0 && timeDiff > 0.29) || this.prevTime == 0)) {

			isBeat = true;

			this.prevTime = this.context.currentTime;
		}
		var temp = this.historyBuffer.slice(0); //get copy of buffer

		this.historyBuffer = []; //clear buffer

		// make room in array by deleting the last COLLECT_SIZE samples.
		this.historyBuffer = temp.slice(this.COLLECT_SIZE * (this.analyser.fftSize / 2), temp.length);

		instantCounter = 0;
		this.instantEnergy = 0;

		localAverageEnergy = 0;
	}

	return isBeat;
}

//Origin Method 

// Beat detection.
// Track a threshold volume level.
// If the current volume exceeds the threshold then you have a beat.Set the new threshold to the current volume.
// Reduce the threshold over time, using the Decay Rate.
// Wait for the Hold Time before detecting for the next beat.This can help reduce false positives.

// var BEAT_DECAY_RATE = 0.99;
// var BEAT_HOLD = 60;
// var BEAT_MIN = 0.15;  // Volume less than this is no beat.

// var volume = this.volume;
// if (!this.beatCutOff) { this.beatCutOff = volume; }
// if (volume > this.beatCutOff && volume > BEAT_MIN) {
// 	this.el.emit('audioanalyser-beat');
// 	this.beatCutOff = volume * 1.5;//beatCutOff抬上去
// 	this.beatTime = 0;
// } else {
// 	if (this.beatTime <= BEAT_HOLD) {
// 		this.beatTime++;
// 	} else {
// 		this.beatCutOff *= BEAT_DECAY_RATE;//beatCutOff往下降
// 		this.beatCutOff = Math.max(this.beatCutOff, BEAT_MIN);
// 	}
// }


export default isOnBeat;