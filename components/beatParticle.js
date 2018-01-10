import SPE from 'shader-particle-engine';

AFRAME.registerComponent('beat-paricle', {
    schema: {
        analyserEl: { type: 'selector' },
        enabled: { default: false }
    },

    init: function () {
        var data = this.data;
        var analyserComponent = data.analyserEl.components.audioanalyser;
        var el = this.el;
        el.setObject3D('beatParicle', new THREE.Object3D());
        this.emitter = new SPE.Emitter({
            type: 3,
            maxAge: {
                value: 2
            },
            position: {
                value: new THREE.Vector3(0, 0, -50),
                radius: 15,
                spread: new THREE.Vector3(0, 0, 0)
            },
            rotation: {
                value: new THREE.Vector3(0, 90, 0),
            },
            acceleration: {
                value: new THREE.Vector3(0, 10, 0),
                // spread: new THREE.Vector3(10, 10, 10)
            },

            velocity: {
                value: new THREE.Vector3(1, 3, 3),
                distribution: SPE.distributions.DISC
            },

            color: {
                value: [new THREE.Color('white'), new THREE.Color('red')]
            },

            size: {
                value: 0.5
            },

            particleCount: 5000
        });
    },
    update() {
        var data = this.data;
        var el = this.el;
        this.clock = new THREE.Clock();
        this.particleGroup = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture('/dist/smokeparticle.png')
            },
            blending: THREE.AdditiveBlending
        });
        this.particleGroup.addPool(1, this.emitter, false);

        this.el.getObject3D('beatParicle').add(this.particleGroup.mesh);

        var particleGroup = this.particleGroup;
        data.analyserEl.addEventListener('audioanalyser-beat', function () {
            updateColor(particleGroup, new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ));
        });
    },
    tick: function () {
        var analyserComponent = this.data.analyserEl.components.audioanalyser;
        if (!analyserComponent.beatParticleFlag || !analyserComponent.analyser) { return; }
        this.particleGroup.tick(this.clock.getDelta());
    }
});

function updateColor(particleGroup, color) {
    if (particleGroup._pool.length) {
        const emitter = particleGroup._pool[particleGroup._pool.length - 1];
        emitter.color.value = color;
    }
    particleGroup.triggerPoolEmitter(1, new THREE.Vector3(0, 1, -2));
}