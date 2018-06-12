import ImprovedNoise from '../scripts/perlinNoise';
import config from '../scripts/config';

AFRAME.registerComponent('levels-scale', {
  schema: {
    analyserEl: { type: 'selector' },
    max: { default: 20 },
    multiplier: { default: 0.05 }//系数
  },
  init: function () {
    this.colors = new Array(config.spectrumNum).fill(0);
    this.noisePos = 0;
    this.perlin = new ImprovedNoise();
  },
  tick: function (time) {
    let data = this.data;
    let children;
    let levels;
    let colors = this.colors;
    this.noisePos += 0.005;//会通过求余重新循环的(整数过256算一个循环)
    colors.push((this.perlin.noise(this.noisePos, this.noisePos, 0)));
    colors.shift(1);

    let analyserComponent = data.analyserEl.components.audioanalyser;
    let el = this.el;
    if (!analyserComponent.levelsEffectFlag || !analyserComponent.analyser) {
      if (el.getAttribute("visible"))el.setAttribute("visible",false);
      return;
    } else {
      if (!el.getAttribute("visible")) el.setAttribute("visible",true);
    }

    //Calculation
    levels = analyserComponent.levels;//levels因为是8位的，所以最大2^8=>
    if (!levels) { return; }
    //可视化效果
    children = el.children;
    for (let i = 0; i < children.length; i++) {
      children[i].setAttribute('scale', {
        x: 1,
        y: Math.min(data.max, Math.max(levels[i*2] * data.multiplier, 0.05)),//i+4取中间，128个，fftsize是1024个
        z: 1
      });
      let color = new THREE.Color().setHSL(colors[i], 1, levels[i*2]/255);//色相(H)、饱和度(S)、明度(L)
      //children[i].setAttribute('material', 'opacity', levels[i*2]/255);//opacity change 太耗性能了，先不要了
      children[i].setAttribute('material', 'color', color);//这里改material的颜色好耗性能，是选的空组件材质不对吗？问题标记 看看材质能不能换，解决下性能问题
    }
  }
});

