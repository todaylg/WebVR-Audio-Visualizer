AFRAME.registerComponent('ball-light', {
  schema: {
    analyserEl: { type: 'selector' },
    max: { type: 'number' },
    multiplier: { type: 'number' },
    ballCount: { default: 6 }
  },

  init() {
    var el = this.el;
    var data = this.data;
    this.ballLightArr = [];
    el.setObject3D('ballContainer', new THREE.Object3D());
    for (i = 0; i < data.ballCount; i++) {//init
      var pointLight = createLight('#' + new THREE.Color(
        Math.random(), Math.random(), Math.random()
      ).getHexString());
      this.ballLightArr.push(pointLight);
      //el.getObject3D('ballContainer').position.y = -5;
      el.getObject3D('ballContainer').add(pointLight);
    }
  },

  tick: function () {
    var data = this.data;
    var el = this.el;
    var value;
    var analyserComponent = data.analyserEl.components.audioanalyser;
    if (!analyserComponent.lightEffectFlag || !analyserComponent.analyser) { return; }

    value = Math.min(data.max, analyserComponent.volume * data.multiplier);

    var time = performance.now() * 0.001;
    for (i = 0; i < this.ballLightArr.length; i++) {//init
      let pointLight = this.ballLightArr[i];
      pointLight.intensity = value;

      pointLight.position.x = Math.sin(time * 0.6) * 9;
      pointLight.position.y = Math.sin(time * 0.7) * 9 + 10;
      pointLight.position.z = Math.sin(time * 0.8) * 9;

      pointLight.rotation.x = time;
      pointLight.rotation.z = time;

      time += 10000;
    }
  }
});

function createLight(color) {

  var intensity = 1.5;

  var pointLight = new THREE.PointLight(color, intensity, 20);
  pointLight.castShadow = true;
  pointLight.shadow.camera.near = 1;
  pointLight.shadow.camera.far = 60;
  pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects

  var geometry = new THREE.SphereGeometry(0.15, 12, 6);
  var material = new THREE.MeshBasicMaterial({ color: color });
  material.color.multiplyScalar(intensity);
  var sphere = new THREE.Mesh(geometry, material);
  pointLight.add(sphere);

  var texture = new THREE.CanvasTexture(generateTexture());
  texture.magFilter = THREE.NearestFilter;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(1, 3.5);

  var geometry = new THREE.SphereGeometry(0.5, 32, 8);
  var material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    alphaMap: texture,
    alphaTest: 0.5
  });

  var sphere = new THREE.Mesh(geometry, material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  pointLight.add(sphere);

  // custom distance material
  var distanceMaterial = new THREE.MeshDistanceMaterial({
    alphaMap: material.alphaMap,
    alphaTest: material.alphaTest
  });
  sphere.customDistanceMaterial = distanceMaterial;

  return pointLight;

}

function generateTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  var context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 1, 2, 1);

  return canvas;
}

