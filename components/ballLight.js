AFRAME.registerComponent('ball-light', {
  schema: {
    analyserEl: { type: 'selector' },
    max: { type: 'number' },
    multiplier: { type: 'number' },
    ballCount: { default: 6 }
  },

  init() {
    let el = this.el;
    let data = this.data;
    this.ballLightArr = [];
    el.setObject3D('ballContainer', new THREE.Object3D());
    for (i = 0; i < data.ballCount; i++) {//init
      let pointLight = createLight('#' + new THREE.Color(
        Math.random(), Math.random(), Math.random()
      ).getHexString());
      this.ballLightArr.push(pointLight);
      //el.getObject3D('ballContainer').position.y = -5;
      el.getObject3D('ballContainer').add(pointLight);
    }
  },

  tick: function () {
    let data = this.data;
    let el = this.el;
    let value;
    let analyserComponent = data.analyserEl.components.audioanalyser;
    if (!analyserComponent.lightEffectFlag || !analyserComponent.analyser) { return; }

    value = Math.min(data.max, analyserComponent.volume * data.multiplier);

    let time = performance.now() * 0.001;
    for (i = 0; i < this.ballLightArr.length; i++) {//init
      let pointLight = this.ballLightArr[i];
      pointLight.intensity = value;

      pointLight.position.x = Math.sin(time * 0.6) * 9;//[0,9]
      pointLight.position.y = Math.sin(time * 0.7) * 9 + 10;//[10,19]
      pointLight.position.z = Math.sin(time * 0.8) * 9;//[0,9]

      pointLight.rotation.x = time;
      pointLight.rotation.z = time;

      time += 10000;
    }
  }
});

function createLight(color) {

  let intensity = 1.5;

  let pointLight = new THREE.PointLight(color, intensity, 20);
  pointLight.castShadow = true;
  pointLight.shadow.camera.near = 1;
  pointLight.shadow.camera.far = 60;
  pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects

  let geometry = new THREE.SphereGeometry(0.15, 12, 6);
  let material = new THREE.MeshBasicMaterial({ color: color });
  material.color.multiplyScalar(intensity);
  let sphere = new THREE.Mesh(geometry, material);
  pointLight.add(sphere);

  let texture = new THREE.CanvasTexture(generateTexture());
  texture.magFilter = THREE.NearestFilter;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(1, 3.5);

  geometry = new THREE.SphereGeometry(0.5, 32, 8);
  material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    alphaMap: texture,
    alphaTest: 0.5
  });

  sphere = new THREE.Mesh(geometry, material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  pointLight.add(sphere);

  // custom distance material
  let distanceMaterial = new THREE.MeshDistanceMaterial({
    alphaMap: material.alphaMap,
    alphaTest: material.alphaTest
  });
  sphere.customDistanceMaterial = distanceMaterial;

  return pointLight;

}

function generateTexture() {
  let canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  let context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 1, 2, 1);

  return canvas;
}

