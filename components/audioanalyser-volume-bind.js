AFRAME.registerComponent('audioanalyser-volume-bind', {
  schema: {
    analyserEl: {type: 'selector'},
    component: {type: 'string'},
    property: {type: 'string'},
    max: {type: 'number'},
    multiplier: {type: 'number'},
  },

  tick: function () {
    var data = this.data;
    var el = this.el;
    var value;

    var analyserComponent = data.analyserEl.components.audioanalyser;
    if(!analyserComponent.lightEffectFlag || !analyserComponent.analyser) { return; }
    
    value = Math.min(data.max, analyserComponent.volume * data.multiplier);
    el.setAttribute(data.component, data.property, value);
  }
});
