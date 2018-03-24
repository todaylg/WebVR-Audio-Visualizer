/**
 * Scale children based on audio frequency levels.
 */
AFRAME.registerComponent('audioanalyser-levels-scale', {
  schema: {//data
    analyserEl: { type: 'selector' },
    max: { default: 20 },
    multiplier: { default: 100 }//相当于系数
  },

  tick: function (time) {
    let data = this.data;
    let children;
    let levels;

    let analyserComponent = data.analyserEl.components.audioanalyser;
    let el = this.el;
    if (!analyserComponent.levelsEffectFlag || !analyserComponent.analyser) {
      if (el.getAttribute("visible"))el.setAttribute("visible",false);
      return;
    } else {
      if (!el.getAttribute("visible")) el.setAttribute("visible",true);
    }

    //Calculation

    levels = analyserComponent.levels;
    if (!levels) { return; }
    //可视化效果
    children = el.children;
    for (let i = 0; i < children.length; i++) {
      children[i].setAttribute('scale', {
        x: 1,
        y: Math.min(data.max, Math.max(levels[i + 4] * data.multiplier, 0.05)),
        z: 1
      });
    }
  }
});
