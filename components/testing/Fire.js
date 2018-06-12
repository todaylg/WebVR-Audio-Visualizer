import SPE from 'shader-particle-engine';

AFRAME.registerComponent('fire', {
    schema: {
        analyserEl: { type: 'selector' },
        enabled: { default: true }
    },

    init: function () {
        let data = this.data;
        let analyserComponent = data.analyserEl.components.audioanalyser;
        let el = this.el;
        el.setObject3D('fireEffect', new THREE.Object3D());
        this.emitter = new SPE.Emitter({
            maxAge: {
                value: 3
            },
            position: {
                value: new THREE.Vector3(0, 0, 0),
                spread: new THREE.Vector3(1, 1, 1)
            },
            acceleration: {
                value: new THREE.Vector3(0, 20, 0),
                spread: new THREE.Vector3(0, 0, 0)
            },

            velocity: {
                value: new THREE.Vector3(0, 40, 0),
                spread: new THREE.Vector3(0, 0, 0)
            },

            color: {
                value: [new THREE.Color('white'), new THREE.Color('red')]
            },

            size: {
                value: 1
            },

            particleCount: 500,
            activeMultiplier: 0,
        });
    },
    update() {
        let data = this.data;
        let el = this.el;
        this.clock = new THREE.Clock();
        this.particleGroup = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture('/dist/fire/gradient.png')
            },
            blending: THREE.AdditiveBlending
        });
        //this.particleGroup.addPool(1, this.emitter, false);
        this.particleGroup.addEmitter(this.emitter);
        this.el.getObject3D('fireEffect').add(this.particleGroup.mesh);

        let particleGroup = this.particleGroup;


        data.analyserEl.addEventListener('audioanalyser-beat', () => {
            let analyserComponent = this.data.analyserEl.components.audioanalyser;
            let volume = analyserComponent.volume;
            updateColor(this.emitter, new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ), volume);
        });
    },
    tick: function () {
        let el = this.el;
        let bigBeatParicle = el.getObject3D('fireEffect');
        let analyserComponent = this.data.analyserEl.components.audioanalyser;
        // if (!analyserComponent.bigBeatFlag || !analyserComponent.analyser) {
        //     if (bigBeatParicle.visible) bigBeatParicle.visible = false;
        //     return;
        // } else {
        //     if (!bigBeatParicle.visible) bigBeatParicle.visible = true;
        // }

        //Calculation
        this.particleGroup.tick(this.clock.getDelta());
    }
});

function updateColor(emitter, color, volume) {
    emitter.color.value = color;
    emitter.activeMultiplier = 1;
    setTimeout(() => {
        emitter.activeMultiplier = 0;
    }, 200);
}