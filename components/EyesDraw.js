import SPE from 'shader-particle-engine';
import smokeparticle from '/assets/images/smokeparticle.png';

AFRAME.registerComponent('eyes-draw', {
    schema: {
        analyserEl: { type: 'selector' },
        camera: { type: 'selector' },
        enabled: { default: true },
        distance: { default: 10 },
        rightClickFlag: { default: false }
    },

    init: function () {
        let data = this.data;
        let analyserComponent = data.analyserEl.components.audioanalyser;
        let el = this.el;

        el.setObject3D('eyesDraw', new THREE.Object3D());
        this.eyesDraw = this.el.getObject3D('eyesDraw');

        //init rightClickEvent
        window.addEventListener('contextmenu',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
            })
        window.addEventListener('mousedown',
            function (e) {
                if (e.which === 3) {
                    document.querySelector('a-entity[eyes-draw]').getAttribute('eyes-draw')['rightClickFlag'] = true;
                }
            })
        window.addEventListener('mouseup',
            function (e) {
                if (e.which === 3) {
                    document.querySelector('a-entity[eyes-draw]').getAttribute('eyes-draw')['rightClickFlag'] = false;
                }
            })
        this.emitter = new SPE.Emitter({
            maxAge: {
                value: 18
            },
            position: {
                value: new THREE.Vector3(0, 0, 0),
            },

            acceleration: {
                value: new THREE.Vector3(0, 0, 0),
                //spread: new THREE.Vector3(5, 0, 5)
            },

            velocity: {
                //value: new THREE.Vector3(0, 10, 0)
            },

            color: {
                value: [new THREE.Color(
                    Math.random(), Math.random(), Math.random()
                ), new THREE.Color(
                    Math.random(), Math.random(), Math.random()
                ), new THREE.Color(
                    Math.random(), Math.random(), Math.random()
                ), new THREE.Color(
                    Math.random(), Math.random(), Math.random()
                ),],
                //spread: new THREE.Vector3(1, 1, 1),
            },
            size: {
                value: [2, 0]
            },

            particleCount: 3000,

            activeMultiplier: 1,
        });
    },
    update() {
        let data = this.data;
        let el = this.el;
        this.clock = new THREE.Clock();
        this.particleGroup = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture(smokeparticle)
            },
            blending: THREE.AdditiveBlending
        });
        //this.particleGroup.addPool(1, this.emitter, false);
        this.particleGroup.addEmitter(this.emitter);
        this.eyesDraw.add(this.particleGroup.mesh);
        data.analyserEl.addEventListener('audioanalyser-bigbeat', () => {
            let analyserComponent = this.data.analyserEl.components.audioanalyser;
            updateColor(this.emitter, [new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ), new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ), new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ), new THREE.Color(
                Math.random(), Math.random(), Math.random()
            )]);
        });
    },
    tick: function () {
        let el = this.el;
        let eyesDraw = this.eyesDraw;
        let distance = this.data.distance;
        let analyserComponent = this.data.analyserEl.components.audioanalyser;
        if (!analyserComponent.eyesDraw || !analyserComponent.analyser) {
            if (eyesDraw.visible) eyesDraw.visible = false;
            return;
        } else {
            if (!eyesDraw.visible) eyesDraw.visible = true;
            if(!this.data.rightClickFlag){
                this.emitter.activeMultiplier = 0;
            }else{
                this.emitter.activeMultiplier = 1;
            }
        }
        let targetPos = this.data.camera.getAttribute('position');
        let targetRot = this.data.camera.getAttribute('rotation');
        let calPos = {
            //以向右转为例
            x: targetPos.x - distance * Math.sin(targetRot.y * (Math.PI / 180)),//targetRot.y为负，求得targetPos.x需为正
            y: Math.max(0.5, distance * Math.tan(targetRot.x * (Math.PI / 180)) + targetPos.y),
            z: targetPos.z - distance * Math.cos(targetRot.y * (Math.PI / 180))
        }

        this.emitter.position.value = this.emitter.position.value.set(calPos.x, calPos.y, calPos.z);

        //Calculation
        this.particleGroup.tick(this.clock.getDelta());
    }
});

function updateColor(emitter, color) {
    //clearTimeout(timer);
    emitter.color.value = color;
    //emitter.velocity.value = new THREE.Vector3(0, 5, 0);
    // timer = setTimeout(() => { //Todo 0.8-1
    //     emitter.velocity.value = new THREE.Vector3(0, 0, 0);
    // }, 200);
}