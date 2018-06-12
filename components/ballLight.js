AFRAME.registerComponent('ball-light', {
  schema: {
    analyserEl: { type: 'selector' },
    camera: { type: 'selector' },
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
      el.getObject3D('ballContainer').add(pointLight);
      el.getObject3D('ballContainer').visible = false;
    }
    this.ballContainer = el.getObject3D('ballContainer');
  },

  tick: function () {
    let data = this.data;
    let el = this.el;
    let value;
    let analyserComponent = data.analyserEl.components.audioanalyser;
    let ballContainer = el.getObject3D('ballContainer');
    if (!analyserComponent.lightEffectFlag || !analyserComponent.analyser) {
      //权衡了一下还是决定将控制组件的权利从Menu归还给组件自己（多一次判断但是避免了污染sceneEl）
      if (ballContainer.visible) ballContainer.visible = false;
      return;
    } else {
      if (!ballContainer.visible) ballContainer.visible = true;
    }

    let targetPos = data.camera.getAttribute('position');
    this.ballContainer.position.x = targetPos.x;//跟随摄像机
    this.ballContainer.position.y = targetPos.y;
    this.ballContainer.position.z = targetPos.z;

    //Calculation (only position)
    value = Math.min(data.max, analyserComponent.volume / 255 * data.multiplier);

    let time = performance.now() * 0.001;//和JavaScript中其他可用的时间类函数(比如Date.now)不同的是,window.performance.now()返回的时间戳没有被限制在一毫秒的精确度内,而它使用了一个浮点数来达到微秒级别的精确度.另外一个不同点是,window.performance.now()是以一个恒定的速率慢慢增加的,它不会受到系统时间的影响(可能被其他软件调整)。另外，performance.timing.navigationStart + performance.now() 约等于 Date.now()。
    for (i = 0; i < this.ballLightArr.length; i++) {//init
      let pointLight = this.ballLightArr[i];
      pointLight.intensity = value;

      pointLight.position.x = Math.sin(time * 0.6) * 9;//[-9,9]
      pointLight.position.y = Math.sin(time * 0.7) * 9 + 10;//[1,19]
      pointLight.position.z = Math.sin(time * 0.8) * 9;//[-9,9]

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
    color: color,
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

