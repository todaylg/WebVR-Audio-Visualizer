import ShaderTexture from '../lib/THREE.ShaderTexture.js';
import Maf from '../lib/Maf.js';
import PingPongTexture from '../lib/THREE.PingPongTexture.js';


AFRAME.registerComponent('snow-env', {
    schema: {
        analyserEl: { type: 'selector' },
    },

    init() {
        var el = this.el;
        var scene = document.querySelector('a-scene');
        var data = this.data;
        this.startTime = new Date();
        el.setObject3D('snowContainer', new THREE.Object3D());

        //地形初始化
        let terrainWidth = 256;
        let terrainHeight = 256;

        var terrainShader = new THREE.RawShaderMaterial({
            uniforms: {
                time: { value: 0 },
                source: { value: null },
                resolution: { value: new THREE.Vector2(terrainWidth, terrainHeight) },
                speed: { value: - .05 }
            },
            vertexShader: document.getElementById('ortho-vs').textContent,
            fragmentShader: document.getElementById('terrain-fs').textContent,
        });

        this.terrainTexture = new ShaderTexture(scene.renderer, terrainShader, terrainWidth, terrainHeight, THREE.RGBAFormat, THREE.UnsignedByteType);

        var shadowWidth = 256;
        var shadowHeight = 256;

        var shadowShader = new THREE.RawShaderMaterial({
            uniforms: {
                heightMap: { value: this.terrainTexture.fbo.texture },
                resolution: { value: new THREE.Vector2(shadowWidth, shadowHeight) },
                lightPosition: { value: new THREE.Vector3() },
                // sphereData: { value: sphereData },
                // sphereLight: { value: sphereLight },
                lightColor: { value: new THREE.Color(0xffea3b) },
                pos: { value: 0 }
            },
            vertexShader: document.getElementById('ortho-vs').textContent,
            fragmentShader: document.getElementById('terrain-shadow-fs').textContent,
            transparent: true
        });

        this.shadowTexture = new ShaderTexture(scene.renderer, shadowShader, shadowWidth, shadowHeight, THREE.RGBAFormat, THREE.UnsignedByteType);

        var blurShadowShader = new THREE.RawShaderMaterial({
            uniforms: {
                source: { value: this.shadowTexture.fbo.texture },
                resolution: { value: new THREE.Vector2(shadowWidth, shadowHeight) },
                delta: { value: new THREE.Vector2(1., 0.) },
            },
            vertexShader: document.getElementById('ortho-vs').textContent,
            fragmentShader: document.getElementById('blur-fs').textContent,
        });

        this.blurHShadowTexture = new ShaderTexture(scene.renderer, blurShadowShader, shadowWidth, shadowHeight, THREE.RGBAFormat, THREE.UnsignedByteType);
        this.blurVShadowTexture = new ShaderTexture(scene.renderer, blurShadowShader, shadowWidth, shadowHeight, THREE.RGBAFormat, THREE.UnsignedByteType);

        var planeMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                heightMap: { value: this.terrainTexture.fbo.texture },
                shadowMap: { value: null },
                backgroundColor: { value: new THREE.Color() },
                time: { value: 0 }
            },
            vertexShader: document.getElementById('plane-vs').textContent,
            fragmentShader: document.getElementById('plane-fs').textContent,
            wireframe: !true,
            transparent: true
        });
        //前面已经四种材质了
        var planeGeometry = new THREE.PlaneBufferGeometry(20, 20 * terrainHeight / terrainWidth, terrainWidth, terrainHeight);
        planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

        this.plane = new THREE.Mesh(
            planeGeometry,
            planeMaterial
        );
        this.plane.renderOrder = 1;
        this.plane.userData.name = 'Landscape';

        el.getObject3D('snowContainer').add(this.plane);
    },

    tick: function () {
        // var data = this.data;
        // var el = this.el;
        // var value;
        // var analyserComponent = data.analyserEl.components.audioanalyser;
        // if (!analyserComponent.lightEffectFlag || !analyserComponent.analyser) { return; }
        this.terrainTexture.render();
        var lastTime = new Date();
        var t = (lastTime - this.startTime) / 1000;
        this.terrainTexture.shader.uniforms.time.value = t;
        this.plane.material.uniforms.time.value = t;

        this.shadowTexture.shader.uniforms.pos.value = this.terrainTexture.shader.uniforms.time.value;
        this.shadowTexture.render();

        this.blurHShadowTexture.shader.uniforms.delta.value.set(1., 0.);
        this.blurHShadowTexture.shader.uniforms.source.value = this.shadowTexture.fbo.texture;
        this.blurHShadowTexture.render();
        this.blurVShadowTexture.shader.uniforms.delta.value.set(0., 1.);
        this.blurVShadowTexture.shader.uniforms.source.value = this.blurHShadowTexture.fbo.texture;
        this.blurVShadowTexture.render();
        this.plane.material.uniforms.shadowMap.value = this.blurVShadowTexture.fbo.texture;
    }
});

// <script type="x-shader/x-vertex" id="ortho-vs">
//       precision highp float;
      
//       attribute vec3 position;
//       attribute vec2 uv;
      
//       varying vec2 vUv;
      
//       void main() {
//           vUv = uv;
//           gl_Position = vec4(position, 1.);
//       }
//   </script>

//   <script id="terrain-fs" type="x-shader/x-fragment">
//       precision highp float;
      
//       uniform sampler2D source;
//       uniform float time;
//       uniform vec2 resolution;
//       uniform float speed;
      
//       varying vec2 vUv;
      
//       vec3 mod289(vec3 x) {
//         return x - floor(x * (1.0 / 289.0)) * 289.0;
//       }
      
//       vec2 mod289(vec2 x) {
//         return x - floor(x * (1.0 / 289.0)) * 289.0;
//       }
      
//       vec3 permute(vec3 x) {
//         return mod289(((x*34.0)+1.0)*x);
//       }
      
//       float snoise(vec2 v)
//         {
//         const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
//                             0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
//                            -0.577350269189626,  // -1.0 + 2.0 * C.x
//                             0.024390243902439); // 1.0 / 41.0
//       // First corner
//         vec2 i  = floor(v + dot(v, C.yy) );
//         vec2 x0 = v -   i + dot(i, C.xx);
      
//       // Other corners
//         vec2 i1;
//         //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
//         //i1.y = 1.0 - i1.x;
//         i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
//         // x0 = x0 - 0.0 + 0.0 * C.xx ;
//         // x1 = x0 - i1 + 1.0 * C.xx ;
//         // x2 = x0 - 1.0 + 2.0 * C.xx ;
//         vec4 x12 = x0.xyxy + C.xxzz;
//         x12.xy -= i1;
      
//       // Permutations
//         i = mod289(i); // Avoid truncation effects in permutation
//         vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
//               + i.x + vec3(0.0, i1.x, 1.0 ));
      
//         vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
//         m = m*m ;
//         m = m*m ;
      
//       // Gradients: 41 points uniformly over a line, mapped onto a diamond.
//       // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
      
//         vec3 x = 2.0 * fract(p * C.www) - 1.0;
//         vec3 h = abs(x) - 0.5;
//         vec3 ox = floor(x + 0.5);
//         vec3 a0 = x - ox;
      
//       // Normalise gradients implicitly by scaling m
//       // Approximation of: m *= inversesqrt( a0*a0 + h*h );
//         m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      
//       // Compute final noise value at P
//         vec3 g;
//         g.x  = a0.x  * x0.x  + h.x  * x0.y;
//         g.yz = a0.yz * x12.xz + h.yz * x12.yw;
//         return 130.0 * dot(m, g);
//       }
      
//       float squareTurbulence(float v) {
//           return pow(v,2.);
//       }
      
//       float ridgedTurbulence(float v) {
//           return 1. - abs(v);
//       }
      
//       float fbm(vec2 uv) {
//           float value = 0.;
//           float amplitude = 1.;
//           for (int i = 0; i < 8; i++) {
//               value += amplitude * abs(snoise(uv));
//               uv *= 2.;
//               amplitude *= .5;
//           }
//           return value;
//       }
      
//       void main() {
      
//           vec2 uv = vUv;
//           uv.y += speed*time;
//           float n = .5 * squareTurbulence(fbm(1.*uv));
      
//           vec4 s = vec4(n,0.,0.,1.);
//           gl_FragColor = s;
      
//       }
//       </script>
//   <script id="terrain-shadow-fs" type="x-shader/x-fragment">
//         precision highp float;
        
//         uniform sampler2D heightMap;
//         uniform vec2 resolution;
//         uniform vec3 lightPosition;
//         uniform vec3 lightColor;
        
//         uniform vec4 sphereData[18];
//         uniform vec4 sphereLight[18];
//         uniform float pos;
        
//         varying vec2 vUv;
        
//         float blendOverlay(float base, float blend) {
//             return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
//         }
        
//         vec3 blendOverlay(vec3 base, vec3 blend) {
//             return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
//         }
        
//         vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
//             return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
//         }
        
//         vec3 applyHardLight(vec3 base, vec3 blend) {
//             return blendOverlay(blend,base);
//         }
        
//         vec3 applyScreen( vec3 base, vec3 blend ) {
//             return (1.0 - ((1.0 - base) * (1.0 - blend)));
//         }
        
//         float sampleOcclusion(vec2 uv, float offset){
//             vec2 inc = vec2(1.)/resolution;
//             float oh = texture2D(heightMap,uv).r + offset;
//             float th = lightPosition.y;
//             vec2 dir = vec2(.5)-(uv+vec2(-lightPosition.x,lightPosition.z)/20.);
//             float falloff = length(dir) * 20. + th;
//             float steps = 20.;//abs(dir.x)/inc.x;
//             //if( dir.y>dir.x) steps = abs(dir.y)/inc.y;
//             //steps = max(1.,steps);
//             int iSteps = int(steps);
//             dir /= steps;
//             float occlusion = 0.;
//             for(int i = 0; i < 300; i++ ){
//                 if( i > iSteps ) {
//                     break;
//                 }
//                 float sh = texture2D(heightMap,uv + dir*float(i)).r;
//                 float vh = oh + float(i) * ( th - oh ) / steps;
//                 if( sh > vh ) {
//                     occlusion = 1.;
//                 }
//             }
//             return ( 1. - sqrt(.1*falloff) ) * ( 1. - occlusion );
//         }
        
//         void main() {
//             vec3 brightness = vec3(0.);
//             float h = texture2D(heightMap,vUv).r;
//             vec3 p = vec3((vUv.x-.5)*20.,h,((1.-vUv.y)-.5)*20.);
//             for(int i=0;i<18;i++) {
//                 float d = sphereData[i].w/pow(length(p-(sphereData[i].xyz-vec3(0.,0.,pos))),1.);
//                 brightness += 2. * sphereLight[i].w * sphereLight[i].xyz * d;
//             }
//             float d = length(vec2(.5)-(vUv+vec2(-lightPosition.x,lightPosition.z)/20.));
//             float occlusion = sampleOcclusion(vUv,0.);
//             occlusion = .5 + .5 * occlusion;
//             float v = length(brightness);
//             vec3 l = mix(.75 + .25 *lightColor,vec3(1.),4.*d);
//             gl_FragColor = vec4(vec3(mix(.8,1.,h))*l*occlusion,.2);
//             gl_FragColor.rgb = mix(gl_FragColor.rgb,brightness,v);
//         }
//         </script>

//   <script id="blur-fs" type="x-shader/x-fragment">
//           precision highp float;
          
//           uniform vec2 resolution;
//           uniform sampler2D source;
//           uniform vec2 delta;
          
//           varying vec2 vUv;
          
//           vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
//             vec4 color = vec4(0.0);
//             vec2 off1 = vec2(1.3333333333333333) * direction;
//             color += texture2D(image, uv) * 0.29411764705882354;
//             color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
//             color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
//             return color;
//           }
          
//           vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
//             vec4 color = vec4(0.0);
//             vec2 off1 = vec2(1.3846153846) * direction;
//             vec2 off2 = vec2(3.2307692308) * direction;
//             color += texture2D(image, uv) * 0.2270270270;
//             color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
//             color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
//             color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
//             color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
//             return color;
//           }
          
//           vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
//             vec4 color = vec4(0.0);
//             vec2 off1 = vec2(1.411764705882353) * direction;
//             vec2 off2 = vec2(3.2941176470588234) * direction;
//             vec2 off3 = vec2(5.176470588235294) * direction;
//             color += texture2D(image, uv) * 0.1964825501511404;
//             color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
//             color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
//             color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
//             color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
//             color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
//             color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
//             return color;
//           }
          
//           void main() {
//               vec4 b  = blur5( source, vUv, resolution, delta );
//               gl_FragColor = b;
//           }
//           </script>

//   <script type="x-shader/x-vertex" id="plane-vs">
//             precision highp float;
            
//             attribute vec3 position;
//             attribute vec2 uv;
            
//             uniform mat4 modelViewMatrix;
//             uniform mat4 projectionMatrix;
            
//             uniform sampler2D heightMap;
            
//             varying vec2 vUv;
//             varying float vHeight;
//             varying vec3 vPosition;
//             varying float vDepth;
            
//             void main() {
            
//                 vUv = uv;
//                 vec3 p = position;
//                 float h = texture2D(heightMap,uv).r;
//                 vHeight = h;
//                 p.y += h;
//                 vPosition = p;
//                 gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1. );
//                 vDepth = clamp(-(modelViewMatrix * vec4( p, 1. )).z/10.,0.,1.);
            
//             }
//             </script>

//   <script type="x-shader/x-fragment" id="plane-fs">
//             precision highp float;
            
//             uniform sampler2D footprintTexture;
//             uniform sampler2D shadowMap;
//             uniform sampler2D heightMap;
//             uniform vec3 backgroundColor;
//             uniform float time;
            
//             varying vec2 vUv;
//             varying float vHeight;
//             varying vec3 vPosition;
//             varying float vDepth;
            
//             float random(vec2 n, float offset ){
//                 return .5 - fract(sin(dot(n.xy + vec2( offset, 0. ), vec2(12.9898, 78.233)))* 43758.5453);
//             }
            
//             vec3 mod289(vec3 x) {
//               return x - floor(x * (1.0 / 289.0)) * 289.0;
//             }
            
//             vec2 mod289(vec2 x) {
//               return x - floor(x * (1.0 / 289.0)) * 289.0;
//             }
            
//             vec3 permute(vec3 x) {
//               return mod289(((x*34.0)+1.0)*x);
//             }
            
//             float snoise(vec2 v) {
//               const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
//                                   0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
//                                  -0.577350269189626,  // -1.0 + 2.0 * C.x
//                                   0.024390243902439); // 1.0 / 41.0
//             // First corner
//               vec2 i  = floor(v + dot(v, C.yy) );
//               vec2 x0 = v -   i + dot(i, C.xx);
            
//             // Other corners
//               vec2 i1;
//               //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
//               //i1.y = 1.0 - i1.x;
//               i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
//               // x0 = x0 - 0.0 + 0.0 * C.xx ;
//               // x1 = x0 - i1 + 1.0 * C.xx ;
//               // x2 = x0 - 1.0 + 2.0 * C.xx ;
//               vec4 x12 = x0.xyxy + C.xxzz;
//               x12.xy -= i1;
            
//             // Permutations
//               i = mod289(i); // Avoid truncation effects in permutation
//               vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
//                     + i.x + vec3(0.0, i1.x, 1.0 ));
            
//               vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
//               m = m*m ;
//               m = m*m ;
            
//             // Gradients: 41 points uniformly over a line, mapped onto a diamond.
//             // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
            
//               vec3 x = 2.0 * fract(p * C.www) - 1.0;
//               vec3 h = abs(x) - 0.5;
//               vec3 ox = floor(x + 0.5);
//               vec3 a0 = x - ox;
            
//             // Normalise gradients implicitly by scaling m
//             // Approximation of: m *= inversesqrt( a0*a0 + h*h );
//               m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            
//             // Compute final noise value at P
//               vec3 g;
//               g.x  = a0.x  * x0.x  + h.x  * x0.y;
//               g.yz = a0.yz * x12.xz + h.yz * x12.yw;
//               return 130.0 * dot(m, g);
//             }
            
//             void main() {
//                 float z = gl_FragCoord.z;
//                 float d = 2. * length( vUv - .5 );
//                 d = smoothstep(.7, 1., d);
//                 float p = 1. - texture2D(footprintTexture, 3. * vUv - 1.).r;
//                 vec3 shadow = texture2D(shadowMap, vUv).rgb;
//                 shadow = mix(backgroundColor,shadow, length(shadow));
//                 float sparkle = snoise(800.*(vUv - vec2(0.,.05 * time)));
//                 sparkle = smoothstep(.8,1.,sparkle);
//                 sparkle *= 1. - vDepth;
//                 vec3 grain = vec3(.05*snoise(4000.*(vUv - vec2(0.,.05 * time))));
//                 vec3 snowColor = vec3(mix(.8,1.,vHeight));
//                 gl_FragColor.rgb = shadow.xyz;
//                 gl_FragColor.rgb += grain;
//                 float s = length(shadow.rgb);
//                 gl_FragColor.rgb += sparkle * s;
//                 gl_FragColor.a = 1.-d + sparkle*s;
//                 gl_FragColor.rgb = mix( gl_FragColor.rgb, backgroundColor, d);
//             //	gl_FragColor = vec4(vec3(vDepth),1.);
//             }
//             </script>
//   <script id="snow-vs" type="x-shader/x-vertex">
//               precision highp float;
              
//               attribute vec3 position;
//               attribute vec3 offset;
//               attribute vec2 uv;
              
//               uniform mat4 modelMatrix;
//               uniform mat4 modelViewMatrix;
//               uniform mat4 projectionMatrix;
              
//               uniform vec2 dimensions;
//               uniform vec2 resolution;
//               uniform float scale;
//               uniform vec3 color;
//               uniform float delta;
              
//               uniform sampler2D curPos;
//               uniform sampler2D prevPos;
              
//               varying vec2 vUv;
//               varying vec3 vColor;
              
//               const float PI = 3.14159265359;
              
//               vec3 hsv2rgb(vec3 c) {
//                 vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
//                 vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
//                 return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
//               }
              
//               vec2 rotate(vec2 v, float a) {
//                   float s = sin(a);
//                   float c = cos(a);
//                   mat2 m = mat2(c, -s, s, c);
//                   return m * v;
//               }
              
//               void main() {
              
//                   vec2 luv = vec2( mod( offset.x, dimensions.x ) / dimensions.x, floor( offset.x / dimensions.y ) / dimensions.y );
//                   vec4 lp = texture2D( curPos, luv );
//                   vec4 lpp = texture2D( prevPos, luv );
              
//                   vec4 tlp = projectionMatrix * modelViewMatrix * vec4( lp.xyz, 1. );
//                   vec4 tlpp = projectionMatrix * modelViewMatrix * vec4( lpp.xyz, 1. );
//                   float l = delta;//max(.5,length(tlp.xy - tlpp.xy));
//                   vec2 tlp2 = tlp.xy/tlp.w;
//                   vec2 tlpp2 = tlpp.xy/tlpp.w;
//                   vec2 dir = normalize(tlp2 - tlpp2);
//                   float aspect = resolution.x / resolution.y;
//                   dir.x *= aspect;
//                   vec2 perp = normalize(vec2(-dir.y,dir.x));
//                   if( l == 1. ) {
//                       dir = vec2(0.,1.);
//                       perp = vec2( 1.,0.);
//                   }
//                   dir *= l;
//                   perp /= l;
              
//                   vec4 mVP = modelViewMatrix * vec4(lp.xyz,1.);
//                   mVP.xy += ( dir.xy * position.x + perp.xy * position.y ) * scale;// * (lp.w/100.);
//                   //mVP.xy += position.xy * scale;
              
//                   //if( lpp.w < lp.w ) p.x = 1000000.;
              
//                   vUv = uv;
//                   vColor = vec3(1.);
//                   float fogFactor = clamp(-lp.z/10.,0.,1.);
//                   vColor *= vec3( 1. - fogFactor );
//                   vColor = vec3(fogFactor );
              
//                   gl_Position = projectionMatrix * mVP;
              
//               }
              
//               </script>

//   <script id="snow-fs" type="x-shader/x-vertex">
//               precision highp float;
              
//               uniform sampler2D map;
              
//               varying vec2 vUv;
//               varying vec3 vColor;
              
//               uniform float opacity;
              
//               void main() {
//                   vec2 uv = vUv;
//                   /*vec2 barycenter = vec2( .5, .5+(.5-.435) );
//                   float dist = 2. * length( vUv.xy - barycenter );
//                   float d = smoothstep(.4,.6, dist);
//                   d = clamp(d,0.,1.);
//                   gl_FragColor = vec4( vColor, ( 1.- d ) * opacity);*/
//                   gl_FragColor = texture2D(map,uv);
//                   gl_FragColor.a *= opacity;
//               }
              
//               </script>
//   <script type="x-shader/x-fragment" id="sim-fs">
//                 precision highp float;
                
//                 uniform sampler2D source;
//                 uniform sampler2D seed;
//                 uniform vec2 resolution;
//                 uniform float time;
//                 uniform float persistence;
//                 uniform float speed;
//                 uniform float decay;
//                 uniform float spread;
//                 uniform float delta;
                
//                 varying vec2 vUv;
                
//                 vec4 mod289(vec4 x) {
//                     return x - floor(x * (1.0 / 289.0)) * 289.0;
//                 }
                
//                 float mod289(float x) {
//                     return x - floor(x * (1.0 / 289.0)) * 289.0;
//                 }
                
//                 vec4 permute(vec4 x) {
//                     return mod289(((x*34.0)+1.0)*x);
//                 }
                
//                 float permute(float x) {
//                     return mod289(((x*34.0)+1.0)*x);
//                 }
                
                
//                 vec4 taylorInvSqrt(vec4 r) {
//                     return 1.79284291400159 - 0.85373472095314 * r;
//                 }
                
//                 float taylorInvSqrt(float r) {
//                     return 1.79284291400159 - 0.85373472095314 * r;
//                 }
                
//                 vec4 grad4(float j, vec4 ip) {
//                     const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
//                     vec4 p,s;
                
//                     p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
//                     p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
//                     s = vec4(lessThan(p, vec4(0.0)));
//                     p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
                
//                     return p;
//                 }
                
                
//                 #define F4 0.309016994374947451
                
//                 vec4 simplexNoiseDerivatives (vec4 v) {
//                     const vec4  C = vec4( 0.138196601125011,0.276393202250021,0.414589803375032,-0.447213595499958);
                
//                     vec4 i  = floor(v + dot(v, vec4(F4)) );
//                     vec4 x0 = v -   i + dot(i, C.xxxx);
                
//                     vec4 i0;
//                     vec3 isX = step( x0.yzw, x0.xxx );
//                     vec3 isYZ = step( x0.zww, x0.yyz );
//                     i0.x = isX.x + isX.y + isX.z;
//                     i0.yzw = 1.0 - isX;
//                     i0.y += isYZ.x + isYZ.y;
//                     i0.zw += 1.0 - isYZ.xy;
//                     i0.z += isYZ.z;
//                     i0.w += 1.0 - isYZ.z;
                
//                     vec4 i3 = clamp( i0, 0.0, 1.0 );
//                     vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
//                     vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
                
//                     vec4 x1 = x0 - i1 + C.xxxx;
//                     vec4 x2 = x0 - i2 + C.yyyy;
//                     vec4 x3 = x0 - i3 + C.zzzz;
//                     vec4 x4 = x0 + C.wwww;
                
//                     i = mod289(i);
//                     float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
//                     vec4 j1 = permute( permute( permute( permute (
//                              i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
//                            + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
//                            + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
//                            + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
                
                
//                     vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
                
//                     vec4 p0 = grad4(j0,   ip);
//                     vec4 p1 = grad4(j1.x, ip);
//                     vec4 p2 = grad4(j1.y, ip);
//                     vec4 p3 = grad4(j1.z, ip);
//                     vec4 p4 = grad4(j1.w, ip);
                
//                     vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
//                     p0 *= norm.x;
//                     p1 *= norm.y;
//                     p2 *= norm.z;
//                     p3 *= norm.w;
//                     p4 *= taylorInvSqrt(dot(p4,p4));
                
//                     vec3 values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)); //value of contributions from each corner at point
//                     vec2 values1 = vec2(dot(p3, x3), dot(p4, x4));
                
//                     vec3 m0 = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0); //(0.5 - x^2) where x is the distance
//                     vec2 m1 = max(0.5 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
                
//                     vec3 temp0 = -6.0 * m0 * m0 * values0;
//                     vec2 temp1 = -6.0 * m1 * m1 * values1;
                
//                     vec3 mmm0 = m0 * m0 * m0;
//                     vec2 mmm1 = m1 * m1 * m1;
                
//                     float dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x + temp1[0] * x3.x + temp1[1] * x4.x + mmm0[0] * p0.x + mmm0[1] * p1.x + mmm0[2] * p2.x + mmm1[0] * p3.x + mmm1[1] * p4.x;
//                     float dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y + temp1[0] * x3.y + temp1[1] * x4.y + mmm0[0] * p0.y + mmm0[1] * p1.y + mmm0[2] * p2.y + mmm1[0] * p3.y + mmm1[1] * p4.y;
//                     float dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z + temp1[0] * x3.z + temp1[1] * x4.z + mmm0[0] * p0.z + mmm0[1] * p1.z + mmm0[2] * p2.z + mmm1[0] * p3.z + mmm1[1] * p4.z;
//                     float dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w + temp1[0] * x3.w + temp1[1] * x4.w + mmm0[0] * p0.w + mmm0[1] * p1.w + mmm0[2] * p2.w + mmm1[0] * p3.w + mmm1[1] * p4.w;
                
//                     return vec4(dx, dy, dz, dw) * 49.0;
//                 }
                
//                 vec3 curlNoise(vec3 p) {
                
//                     float t = .01 * time / ( 1000./60. );
                
//                     vec4 xNoisePotentialDerivatives = vec4(0.0);
//                     vec4 yNoisePotentialDerivatives = vec4(0.0);
//                     vec4 zNoisePotentialDerivatives = vec4(0.0);
                
//                     for (int i = 0; i < 3; ++i) {
//                         float scale = (1.0 / 2.0) * pow(2.0, float(i));
                
//                         float noiseScale = pow(persistence, float(i));
//                         if (persistence == 0.0 && i == 0) { //fix undefined behaviour
//                             noiseScale = 1.0;
//                         }
                
//                         xNoisePotentialDerivatives += simplexNoiseDerivatives(vec4(p * pow(2.0, float(i)), t)) * noiseScale * scale;
//                         yNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((p + vec3(123.4, 129845.6, -1239.1)) * pow(2.0, float(i)), t)) * noiseScale * scale;
//                         zNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((p + vec3(-9519.0, 9051.0, -123.0)) * pow(2.0, float(i)), t)) * noiseScale * scale;
//                     }
                
//                     vec3 noiseVelocity = vec3(
//                         zNoisePotentialDerivatives[1] - yNoisePotentialDerivatives[2],
//                         xNoisePotentialDerivatives[2] - zNoisePotentialDerivatives[0],
//                         yNoisePotentialDerivatives[0] - xNoisePotentialDerivatives[1] );
                
//                     return noiseVelocity;
                
//                 }
                
//                 void main() {
//                     vec4 s = texture2D(source,vUv);
//                     if( s.w <= 0. || s.w > 100. ) {
//                         s = texture2D(seed,vUv);
//                         s.xyz *= spread;
//                     }else{
//                         s.xyz += delta * speed * curlNoise( .1 * s.xyz);
//                         s.z -= .01 * delta;
//                         s.w -= decay * delta;
//                     }
//                     gl_FragColor = s;
//                 }
//                 </script>