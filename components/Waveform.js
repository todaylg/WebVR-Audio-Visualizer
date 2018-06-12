import ImprovedNoise from '../scripts/perlinNoise';

AFRAME.registerComponent('waveform', {
  schema: {
    analyserEl: {type: 'selector'},
    maxHeight: {default: 1},
    multiplier: {default: 1},
    radius: {default: 1},
    zHeight:{default:30},
    ringCount: {default: 160},
    segments: {default: 512},
    skyFlag: {default:false}
  },

  init: function () {
    this.colors = [];
    this.geometry;
    this.levels = [];
    this.noisePos = 0;
    this.rings = [];
    this.perlin = new ImprovedNoise();
  },

  update: function () {
    var data = this.data;
    var el = this.el;
    var i;
    var lineMesh;
    var loopShape;
    var material;
    var scale;
    var flag = this.data.skyFlag;//是天是地

    //可视化效果
    // Create ring geometries.
    loopShape = new THREE.Shape();
    //( x : Float, y : Float, radius : Float, startAngle : Float, endAngle : Float, clockwise : Float )
    loopShape.absarc(0, 0, data.radius, 0, Math.PI * 2, false);
    this.geometry = loopShape.createPointsGeometry(data.segments / 2);
    this.geometry.dynamic = true;

    // Create container object.
    el.setObject3D('waveformContainer', new THREE.Object3D());
    if(flag){
      el.setAttribute("position",{
        x:0,
        y:this.data.zHeight,
        z:0
      });
    }
    // Create rings.
    scale = 1;
    //Init
    for (i = 0; i < data.ringCount; i++) {
      material = new THREE.LineBasicMaterial({
        color: 0x000,
        linewidth: 1 ,
        opacity : 0.7,
        blending : THREE.AdditiveBlending,
        depthTest : true,
        transparent : true
      });

      //这里原本是分块顶点显示时域信息的
      //vertices representing the line segment(s) => 是给后面时域信息往每个圆环上放用的，但是加上了不太好看，还是去掉吧

      lineMesh = new THREE.Line(this.geometry, material);

      //所以可以理解为一个基本的圆形中心，线绕圆的顶点（所以线也是圆的），并且递归增大形成波形
      scale *= 1.05;//依次扩大
      lineMesh.scale.x = scale;
      lineMesh.scale.y = scale;
      if(flag){
        lineMesh.position.z = (i/data.ringCount)*this.data.zHeight;
      }
      el.getObject3D('waveformContainer').add(lineMesh);

      this.rings.push(lineMesh);
      this.levels.push(0);//填充数据
      this.colors.push(0);
    }
  },

  tick: function () {
    var VOL_SENS;
    var analyserComponent;
    var colors = this.colors;
    var data = this.data;
    var el = this.el;
    var levels = this.levels;
    var rings = this.rings;

    var analyserComponent = data.analyserEl.components.audioanalyser;
    let waveformContainer = el.getObject3D('waveformContainer');
    if (!analyserComponent.waveEffectFlag || !analyserComponent.analyser) {
      if (waveformContainer.visible) waveformContainer.visible = false;
      return;
    } else {
      if (!waveformContainer.visible) waveformContainer.visible = true;
    }

    //Calculation
    VOL_SENS = 2;
    levels.push(analyserComponent.volume / 256 * VOL_SENS);  // 256 is max level.（8位嘛）
    levels.shift(1);

    // Add a new color onto the list.
    this.noisePos += 0.005;
    colors.push((this.perlin.noise(this.noisePos, 0, 0)));//generate color？最新的数据在数组最末后面要倒着拿
    colors.shift(1);

    // Write current waveform into all rings.
    //遍历点集
    this.geometry.vertices.forEach(function (vertex, index) {
      vertex.z = data.maxHeight;
    });

    // Link up last segment.
    this.geometry.vertices[this.geometry.vertices.length - 1].z = this.geometry.vertices[0].z;
    this.geometry.verticesNeedUpdate = true;

    rings.forEach(function transformRing (ring, index) {//一帧里遍历转换所有圆环颜色
      var normLevel;
      normLevel = levels[data.ringCount - index - 1] + 0.01;  // Avoid scaling by 0.//倒着拿
      //颜色也受levels影响
      //HSL
      //H:取值范围是0°到360°的圆心角，每个角度可以代表一种颜色:360°/0°红、60°黄、120°绿、180°青、240°蓝、300°洋红
      //S:S(saturation)分量，指的是色彩的饱和度，它用0%至100%的值描述了相同色相、明度下色彩纯度的变化。数值越大，颜色中的灰色越少，颜色越鲜艳，呈现一种从理性(灰度)到感性(纯色)的变化。
      //L:L(lightness)分量，指的是色彩的明度，作用是控制色彩的明暗变化。它同样使用了0%至100%的取值范围。数值越小，色彩越暗，越接近于黑色；数值越大，色彩越亮，越接近于白色
      ring.material.color.setHSL(colors[index], 1, normLevel);//色相(H)、饱和度(S)、明度(L)
      ring.material.opacity = normLevel;//透明度由levels决定
      ring.scale.z = normLevel;//Z轴高度
    });
  },

  remove: function () {
    this.el.removeObject3D('waveformContainer');
  }
});
