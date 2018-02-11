import SPE from 'shader-particle-engine';

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
                value: 2
            },
            position: {
                value: new THREE.Vector3(0, 1, -2),
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
                value: new THREE.Vector3(3, 3, 3),
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
        let data = this.data;
        let el = this.el;
        this.clock = new THREE.Clock();
        this.particleGroup = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture('/dist/smokeparticle.png')
            },
            blending: THREE.AdditiveBlending
        });
        //this.particleGroup.addPool(1, this.emitter, false);
        this.particleGroup.addEmitter(this.emitter);
        this.el.getObject3D('beatParicle').add(this.particleGroup.mesh);
        
        let particleGroup = this.particleGroup;

        
        data.analyserEl.addEventListener('audioanalyser-beat', ()=> {
            let analyserComponent = this.data.analyserEl.components.audioanalyser;
            let volume = analyserComponent.volume;
            updateColor(this.emitter, new THREE.Color(
                Math.random(), Math.random(), Math.random()
            ),volume);
        });
    },
    tick: function () {
        let analyserComponent = this.data.analyserEl.components.audioanalyser;
        if (!analyserComponent.beatParticleFlag || !analyserComponent.analyser) { return; }
        this.particleGroup.tick(this.clock.getDelta());

        //let  volume = analyserComponent.volume;

        //TODO
        //取得volume结合beat来做
        //改变发射速度和生存时间
        // this.emitter.velocity.value = new THREE.Vector3(1, 3, volume/5);
        // this.emitter.acceleration.value = new THREE.Vector3(0, volume/2, volume/2);
        // this.emitter.position.radius = volume/6;
        // this.emitter.position.spread = new THREE.Vector3(0, volume/5, volume/5);
    }
});

function updateColor(emitter, color, volume) {
    emitter.color.value = color;
    emitter.velocity.value = new THREE.Vector3(1, 3, volume/5);
    emitter.acceleration.value = new THREE.Vector3(0, volume/2, volume/2);
    emitter.position.radius = volume/6;
    emitter.position.spread = new THREE.Vector3(0, volume/5, volume/5);
}