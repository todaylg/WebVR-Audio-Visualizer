function isOnBeat() {
	var localAverageEnergy = 0;
	var instantCounter = 0;
	var isBeat = false;
	// fill history buffer 
	for (var i = 0; i < this.levels.length - 1; i++ , ++instantCounter) {
		this.historyBuffer.push(this.levels[i]);  //add sample to historyBuffer
	}
	//sensitivity of detection
	this.sens = 1 + 0.05;
	if (instantCounter > this.COLLECT_SIZE - 1 &&
		this.historyBuffer.length > this.MAX_COLLECT_SIZE - 1) {

		this.instantEnergy = this.instantEnergy / (this.COLLECT_SIZE * (this.analyser.fftSize / 2));

		var average = 0;
		for (var i = 0; i < this.historyBuffer.length - 1; i++) {
			average += this.historyBuffer[i];
		}

		localAverageEnergy = average / this.historyBuffer.length;

		var timeDiff = this.context.currentTime - this.prevTime;
		// timeDiff > 2 is out of normal song bpm range, but if it is a multiple of range [0.3, 1.5] 
		// we probably have missed a beat before but now have a match in the bpm table.

		if (timeDiff > 2 && this.bpmTable.length > 0) {
			//console.log("timediff is now greater than 3");

			//check if we have a multiple of range in bpm table

			for (var j = 0; j < this.bpmTable.length - 1; j++) {
				// mutiply by 10 to avoid float rounding errors
				var timeDiffInteger = Math.round((timeDiff / this.bpmTable[j]['time']) * 1000);

				// timeDiffInteger should now be a multiple of a number in range [3, 15] 
				// if we have a match

				if (timeDiffInteger % (Math.round(this.bpmTable[j]['time']) * 1000) == 0) {
					timeDiff = new Number(this.bpmTable[j]['time']);
					//console.log("TIMEDIFF MULTIPLE MATCH: " + timeDiff);
				}
			}
		}


		//still?
		if (timeDiff > 3) {
			this.prevTime = timeDiff = 0;
		}

		////////////////////////
		// MAIN BPM HIT CHECK //
		////////////////////////

		// CHECK IF WE HAVE A BEAT BETWEEN 200 AND 40 BPM (every 0.29 to 2s), or else ignore it.
		// Also check if we have _any_ found prev beats
		if (this.context.currentTime > 0.29 && this.instantEnergy > localAverageEnergy &&
			(this.instantEnergy > (this.sens * localAverageEnergy)) &&
			((timeDiff < 2.0 && timeDiff > 0.29) || this.prevTime == 0)) {

			isBeat = true;

			this.prevTime = this.context.currentTime;

			this.bpm =
				{
					time: timeDiff.toFixed(3),
					counter: 1,
				};


			//TODO
			// for (var j = 0; j < this.bpmTable.length; j++) {
			// 	//FOUND ANOTHER MATCH FOR ALREADY GUESSED BEAT

			// 	if (this.bpmTable[j]['time'] == this.bpm['time']) {
			// 		this.bpmTable[j]['counter']++;
			// 		this.bpm = 0;

			// 		if (this.bpmTable[j]['counter'] > 3 && j < 2) {
			// 			isBeat = true;
			// 			//console.log("WE HAVE A BEAT MATCH IN TABLE!!!!!!!!!!");
			// 		}

			// 		break;
			// 	}
			// }

			if (this.bpm != 0 || this.bpmTable.length == 0) {
				this.bpmTable.push(this.bpm);
			}

			//sort and draw 10 most current bpm-guesses
			this.bpmTable.sort(function (a, b) {
				return b['counter'] - a['counter']; //descending sort
			});
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