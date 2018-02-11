/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const trackConfig = [
	{
		text: 'Levels',
		subText: 'Visual Effect'
	},
	{
		text: 'Waveform',
		subText: 'Visual Effect',
	},
	{
		text: 'BeatParticle',
		subText: 'Visual Effect',
	},
	{
		text: 'VolumeLight',
		subText: 'Visual Effect',
	},
	{
		text: 'Todo',
		subText: 'Visual Effect',
	},
	{
		text: 'BigBeat',
		subText: 'Visual Effect'
	},
]

AFRAME.registerComponent('menu', {
	schema: {
		shrink: {
			type: 'boolean',
			default: true
		},
		analyserEl: { type: 'selector' },
	},
	init() {
		this._itemWidth = 200
		this._itemHeight = 200

		let lastClick = Date.now()

		let analyserEl = this.data.analyserEl;
		let analyserComponent = this.data.analyserEl.components.audioanalyser;

		trackConfig.forEach((track, i) => {
			const plane = document.createElement('a-entity')
			plane.setAttribute('menu-item', {
				text: track.text,
				subText: track.subText,
			})
			this.el.appendChild(plane)

			const rotated = i !== 1 && i !== 4
			const moveForward = 0.07

			if (i < 3) {
				//top row
				plane.setAttribute('position', `${(i - 1)} 0 ${rotated ? moveForward : 0}`)
			} else {
				//bottom row
				plane.setAttribute('position', `${(i - 4)} -0.76 ${rotated ? moveForward : 0}`)
			}

			const angle = 8
			if (i === 0 || i === 3) {
				plane.setAttribute('rotation', `0 ${angle} 0`)
			} else if (i === 2 || i === 5) {
				plane.setAttribute('rotation', `0 ${-angle} 0`)
			}

			plane.addEventListener('click', () => {
				if (Date.now() - lastClick > 500) {
					lastClick = Date.now()
				} else {
					return
				}

				this.el.setAttribute('menu', 'shrink', true)

				const trackClone = {}
				Object.assign(trackClone, track)
				if (!plane.getAttribute('menu-item').selected) {
					//触发选中事件
					this.el.emit('select', trackClone)
				} else {
					//触发取消选择事件
					this.el.emit('unSelect', trackClone)
				}
			})
		})
		//事件处理
		let beatParticle = document.getElementById("beatParticle");
		this.el.addEventListener('select', (track) => {
			console.log("选择" + track.detail.text);
			switch (track.detail.text) {
				case "Levels":
					console.log("Begin Levels");
					analyserComponent.levelsEffectFlag = true;
					break;
				case "Waveform":
					console.log("Begin Waveform");
					analyserComponent.waveEffectFlag = true;
					break;
				case "BeatParticle":
					console.log("Begin BeatParticle");
					analyserComponent.beatParticleFlag = true;
					analyserEl.setAttribute("audioanalyser", 'enableBeatDetection', true);
					break;
				case "VolumeLight":
					console.log("Begin Light");
					analyserComponent.lightEffectFlag = true;
					break;
				case "BigBeat":
					console.log("Begin BigBeat");
					analyserComponent.bigBeatFlag = true;
					analyserEl.setAttribute("audioanalyser", 'enableBigBeat', true);
					break;
				default:
					break;
			}
		})
		this.el.addEventListener('unSelect', (track) => {
			console.log("取消选择" + track.detail.text);
			switch (track.detail.text) {
				case "Levels":
					console.log("Stop Levels");
					analyserComponent.levelsEffectFlag = false;
					break;
				case "Waveform":
					console.log("Stop Waveform");
					analyserComponent.waveEffectFlag = false;
					break;
				case "BeatParticle":
					console.log("Stop BeatParticle");
					analyserComponent.beatParticleFlag = false;
					analyserEl.setAttribute("enableBeatDetection", false);
					break;
				case "VolumeLight":
					console.log("Stop Light");
					analyserComponent.lightEffectFlag = false;
					break;
				case "BigBeat":
					console.log("Stop BigBeat");
					analyserComponent.bigBeatFlag = false;
					analyserEl.setAttribute("audioanalyser", 'enableBigBeat', false);
					break;
				default:
					break;
			}
		})
	}
})