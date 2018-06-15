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

//比如menu组件暴露接口 开关1，开关2这样接收传递进来的组件
const trackConfig = [
	{
		text: 'Levels',
		subText: 'ZHeight Color'
	},
	{
		text: 'Waveform',
		subText: 'ZHeight Color Opacity',
	},
	{
		text: 'BeatParticle',
		subText: 'Pre-analysis Color ZHeight Radius Acceleration',
	},
	{
		text: 'VolumeLight',
		subText: 'Intensity',
	},
	{
		text: 'PositionChange',
		subText: 'For No VR Controll',
	},
	{
		text: 'BigBeat',
		subText: 'Real-time-analysis Color'
	},
	{
		text: 'EnvEffect',
		subText: 'AnalyserNode'
	},
	{
		text: 'GraffitiEffect',
		subText: 'Pre-analysis Color'
	},
]

AFRAME.registerComponent('menu', {
	schema: {
		shrink: {
			type: 'boolean',
			default: true
		},
		camera: { type: 'selector' },
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

			//问题标记：这样Item的扩展性为0，7个就得懵了

			const rotated = i !== 1 && i !== 4
			const moveForward = 0.07

			if (i < 4) {
				//top row
				plane.setAttribute('position', `${(i - 1.5)} 0 0}`)
			} else {
				//bottom row
				plane.setAttribute('position', `${(i - 5.5)} -0.76 0}`)
			}

			// const angle = 8
			// if (i === 0 || i === 3) {
			// 	plane.setAttribute('rotation', `0 ${angle} 0`)
			// } else if (i === 2 || i === 5) {
			// 	plane.setAttribute('rotation', `0 ${-angle} 0`)
			// }

			//每个Item添加监听事件
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
		//？？？？let beatParticle = document.getElementById("beatParticle");
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

				case "VolumeLight":
					console.log("Begin Light");
					analyserComponent.lightEffectFlag = true;//begin Calculation and render
					break;
				case "BeatParticle":
					console.log("Begin BeatParticle");
					analyserComponent.beatParticleFlag = true;
					analyserEl.setAttribute("audioanalyser", 'enableBeatDetection', true);
					break;
				case "BigBeat":
					console.log("Begin BigBeat");
					analyserComponent.bigBeatFlag = true;
					analyserEl.setAttribute("audioanalyser", 'enableBigBeat', true);
					break;
				case "PositionChange":
					console.log("PositionChange");
					this.data.camera.setAttribute('position', { x: -13.0, y: 1.6, z: 13.0 });
					this.data.camera.setAttribute('rotation', { x: 19.19785908681687, y: -41.711327485523945, z: 0 });
					break;
				case "EnvEffect":
					analyserComponent.envEffectIndex++;
					analyserComponent.envEffectIndex = analyserComponent.envEffectIndex % analyserComponent.convolutionInfo.length;
					//赶时间了，暴力方法
					this.el.children[10].emit('changeSubText', analyserComponent.convolutionInfo[analyserComponent.envEffectIndex].name);

					setConvolution(analyserComponent.envEffectIndex);
					break;
				case "GraffitiEffect":
					console.log("Begin GraffitiEffect");
					analyserComponent.eyesDraw = true;
					analyserEl.setAttribute("audioanalyser", 'enableEyesDraw', true);
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

				case "VolumeLight":
					console.log("Stop Light");
					analyserComponent.lightEffectFlag = false;
					break;
				case "BeatParticle":
					console.log("Stop BeatParticle");
					analyserComponent.beatParticleFlag = false;
					analyserEl.setAttribute("enableBeatDetection", false);
					break;
				case "BigBeat":
					console.log("Stop BigBeat");
					analyserComponent.bigBeatFlag = false;
					analyserEl.setAttribute("audioanalyser", 'enableBigBeat', false);
					break;
				case "PositionChange":
					this.data.camera.setAttribute('position', { x: 0, y: 1.6, z: 0 });
					// console.log(this.data.camera);
					// this.data.camera.lookAt({x:0,y:0,z:0});
					break;
				case "EnvEffect":
					//赶时间了，暴力方法
					this.el.children[10].emit('changeSubText', 'none');
					setConvolution(-1);
					break;
				case "GraffitiEffect":
					console.log("Stop GraffitiEffect");
					analyserComponent.eyesDraw = false;
					analyserEl.setAttribute("audioanalyser", 'enableEyesDraw', false);
					break;
				default:
					break;
			}
		})
		function setConvolution(index) {
			analyserComponent.sourceGainNode.gain.value = 0.8;
			for (i = 0; i < analyserComponent.gainNodes.length; i++) {
				analyserComponent.gainNodes[i].gain.value = 0.0;
			}
			if (index >= 0) {
				analyserComponent.gainNodes[index].gain.value = analyserComponent.convolutionInfo[index].sendGain;
				analyserComponent.sourceGainNode.gain.value = analyserComponent.convolutionInfo[index].mainGain;
			}
		}
	}
})