import SPE from 'shader-particle-engine';
import smokeparticle from '/assets/images/smokeparticle.png';

AFRAME.registerComponent('beat-paricle', {
    schema: {
        analyserEl: { type: 'selector' },
    },

    init: function () {
        let data = this.data;
        let analyserComponent = data.analyserEl.components.audioanalyser;
        let el = this.el;
        el.setObject3D('beatParicle', new THREE.Object3D());
        this.emitter = new SPE.Emitter({
            type: 3,
            maxAge: {
                value: 0.5
            },
            position: {
                value: new THREE.Vector3(0, 1, -2),
                radius: 3,
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
                value: new THREE.Vector3(1, 0, 0),
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
    
        this.clock = new THREE.Clock();
        this.particleGroup = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture(smokeparticle)
            },
            blending: THREE.AdditiveBlending
        });
        //this.particleGroup.addPool(1, this.emitter, false);
        this.particleGroup.addEmitter(this.emitter);
        this.el.getObject3D('beatParicle').add(this.particleGroup.mesh);

        data.analyserEl.addEventListener('audioanalyser-beat', () => {
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
        let analyserComponent = this.data.analyserEl.components.audioanalyser;
        let beatParicle = el.getObject3D('beatParicle');
        if (!analyserComponent.beatParticleFlag || !analyserComponent.analyser) {
            if (beatParicle.visible) beatParicle.visible = false;
            return;
        } else {
            if (!beatParicle.visible) beatParicle.visible = true;
        }

        //Calculation
        this.particleGroup.tick(this.clock.getDelta());
    }
});

function updateColor(emitter, color, volume) {
    emitter.color.value = color;
    emitter.acceleration.value = new THREE.Vector3(volume/20, 0, 0);
    emitter.position.radius = volume / 20;
    emitter.position.value = new THREE.Vector3(0, 1, -volume/5+10);
}