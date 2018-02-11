/**
 * Scale children based on audio frequency levels.
 */
AFRAME.registerComponent('audioanalyser-levels-scale', {
  schema: {//data
    analyserEl: {type: 'selector'},
    max: {default: 20},
    multiplier: {default: 100}//相当于系数
  },

  tick: function (time) {
    var data = this.data;
    var children;
    var levels;

    var analyserComponent = data.analyserEl.components.audioanalyser;
    if(!analyserComponent.levelsEffectFlag || !analyserComponent.analyser) { return; }
    
    levels = analyserComponent.levels;
    if (!levels) { return; }
    //可视化效果
    children = this.el.children;
    for (var i = 0; i < children.length; i++) {
      children[i].setAttribute('scale', {
        x: 1,
        y: Math.min(data.max, Math.max(levels[i+4] * data.multiplier, 0.05)),
        z: 1
      });
    }
  }
});
