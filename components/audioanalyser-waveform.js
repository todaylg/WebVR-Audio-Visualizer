/**
 * Generate rings (THREE.Line) and transform them using audioanalyser waveform data.
 * Adapted from https://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/
 */
AFRAME.registerComponent('audioanalyser-waveform', {
  schema: {
    analyserEl: {type: 'selector'},
    maxHeight: {default: 0.2},
    multiplier: {default: .01},
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
    var flag = this.data.skyFlag;

    //可视化效果
    // Create ring geometries.
    loopShape = new THREE.Shape();
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
    for (i = 0; i < data.ringCount; i++) {//init
      material = new THREE.LineBasicMaterial({
        color: 0x000,
        linewidth: 1 ,
        opacity : 0.7,
        blending : THREE.AdditiveBlending,
        depthTest : true,
        transparent : true
      });
      //vertices representing the line segment(s)  this.geometry
      //根据顶点信息画线，在这里就是画圆
      lineMesh = new THREE.Line(this.geometry, material);

      //所以可以理解为一个基本的圆形中心，线绕圆的顶点（所以线也是圆的），并且递归增大形成波形
      scale *= 1.05;//依次扩大在这里实现
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
    if(!analyserComponent.waveEffectFlag || !analyserComponent.analyser) { return; }

    VOL_SENS = 2;
    //区间由128-256 => 0-256
    levels.push(analyserComponent.volume / 256 * VOL_SENS);  // 256 is max level.
    levels.shift(1);

    // Add a new color onto the list.
    // this.noisePos += 0.01;
    this.noisePos += 0.005;
    colors.push(Math.abs(this.perlin.noise(this.noisePos, 0, 0)));//generate color？
    colors.shift(1);

    // Write current waveform into all rings.
    this.geometry.vertices.forEach(function (vertex, index) {
      vertex.z = Math.min(analyserComponent.waveform[index] * data.multiplier,
                          data.maxHeight);
    });

    // Link up last segment.
    this.geometry.vertices[this.geometry.vertices.length - 1].z = this.geometry.vertices[0].z;
    this.geometry.verticesNeedUpdate = true;

    rings.forEach(function transformRing (ring, index) {//一帧里遍历转换所有圆环颜色
      var normLevel;
      normLevel = levels[data.ringCount - index - 1] + 0.01;  // Avoid scaling by 0.
      //颜色也受levels影响
      //HSL
      //H:取值范围是0°到360°的圆心角，每个角度可以代表一种颜色:360°/0°红、60°黄、120°绿、180°青、240°蓝、300°洋红
      //S:S(saturation)分量，指的是色彩的饱和度，它用0%至100%的值描述了相同色相、明度下色彩纯度的变化。数值越大，颜色中的灰色越少，颜色越鲜艳，呈现一种从理性(灰度)到感性(纯色)的变化。
      //L:L(lightness)分量，指的是色彩的明度，作用是控制色彩的明暗变化。它同样使用了0%至100%的取值范围。数值越小，色彩越暗，越接近于黑色；数值越大，色彩越亮，越接近于白色
      ring.material.color.setHSL(colors[index], 1, normLevel);//色相(H)、饱和度(S)、明度(L)
      ring.material.linewidth = normLevel * 3;
      ring.material.opacity = normLevel;//透明度由levels决定
      ring.scale.z = normLevel;//Z轴高度
    });
  },

  remove: function () {
    this.el.removeObject3D('waveformContainer');
  }
});

/**
 * http://mrl.nyu.edu/~perlin/noise/
 */
function ImprovedNoise () {
  var p = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
    23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
    174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
    133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
    89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
    202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
    248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
    178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191
    ,179,162,241,81,51,145,235,249,
    14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
    93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];
  for (var i = 0; i < 256 ; i++) {
    p[256 + i] = p[i];
  }
  function fade (t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp (t, a, b) {
    return a + t * (b - a);
  }
  function grad (hash, x, y, z) {
    var h = hash & 15;
    var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
  }
  return {
    noise: function (x, y, z) {
      var floorX = ~~x, floorY = ~~y, floorZ = ~~z;
      var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;
      x -= floorX;
      y -= floorY;
      z -= floorZ;
      var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;
      var u = fade(x), v = fade(y), w = fade(z);
      var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;
      return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
              grad(p[BA], xMinus1, y, z)),
            lerp(u, grad(p[AB], x, yMinus1, z),
              grad(p[BB], xMinus1, yMinus1, z))),
          lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
              grad(p[BA+1], xMinus1, y, z-1)),
            lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
              grad(p[BB+1], xMinus1, yMinus1, zMinus1))));
    }
  }
}
