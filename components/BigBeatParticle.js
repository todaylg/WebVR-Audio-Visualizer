import SPE from 'shader-particle-engine';
import smokeparticle from '/assets/images/smokeparticle.png';

AFRAME.registerComponent('big-beat', {
    schema: {
        analyserEl: { type: 'selector' },
        enabled: { default: true }
    },

    init: function () {
        let data = this.data;
        let analyserComponent = data.analyserEl.components.audioanalyser;
        let el = this.el;
        el.setObject3D('bigBeatParicle', new THREE.Object3D());
        this.emitter = new SPE.Emitter({
            maxAge: {
                value: 2.5
            },
            position: {
                value: new THREE.Vector3(0, 1, -2),
                spread: new THREE.Vector3(0, 0, 0)
            },

            acceleration: {
                value: new THREE.Vector3(0, -10, 0),
                spread: new THREE.Vector3(10, 0, 10)
            },

            velocity: {
                value: new THREE.Vector3(0, 25, 0),
                spread: new THREE.Vector3(10, 7.5, 10)
            },

            color: {
                value: [new THREE.Color('white'), new THREE.Color('red')]
            },

            size: {
                value: 1
            },

            particleCount: 3000,
            activeMultiplier: 0,
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
        this.el.getObject3D('bigBeatParicle').add(this.particleGroup.mesh);

        data.analyserEl.addEventListener('audioanalyser-bigbeat', () => {
            let analyserComponent = this.data.analyserEl.components.audioanalyser;
            let volume = analyserComponent.volume;
            updateColor(this.emitter, [new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ),new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ),new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ),new THREE.Color(
                Math.random(), Math.random(), Math.random()
            )], volume);
        });
    },
    tick: function () {
        let el = this.el;
        let bigBeatParicle = el.getObject3D('bigBeatParicle');
        let analyserComponent = this.data.analyserEl.components.audioanalyser;
        if (!analyserComponent.bigBeatFlag || !analyserComponent.analyser) {
            if (bigBeatParicle.visible) bigBeatParicle.visible = false;
            return;
        } else {
            if (!bigBeatParicle.visible) bigBeatParicle.visible = true;
        }

        //Calculation
        this.particleGroup.tick(this.clock.getDelta());
    }
});

let timer = null;

function updateColor(emitter, color, volume) {
    clearTimeout(timer);
    emitter.color.value = color;
    emitter.activeMultiplier = 1;
    timer = setTimeout(() => {
        emitter.activeMultiplier = 0;
    }, 200);
}