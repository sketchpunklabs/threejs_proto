class CustomMaterial extends THREE.RawShaderMaterial{
    constructor(){
        super();

        this.name               = 'CustomMaterial';
        this.glslVersion        = THREE.GLSL3;
        // this.side               = THREE.DoubleSide;
        // this.depthTest          = true;
        // this.transparent        = true;
        // this.alphaToCoverage    = true;
        // this.lights             = true;

        this.uniforms           = {
            // oRadius     : { value: 0.49 },
            // color       : { value: new THREE.Color( '#202020' ) },
        };

        this.vertexShader = `
        in	vec3    position;
        in  vec3    normal;
        in	vec2    uv;
        
        // uniform highp vec3 cameraPosition;

        uniform mat4  modelMatrix;
        uniform mat4  viewMatrix;
        uniform mat4  projectionMatrix;

        out vec3 fragLPos;
        out vec3 fragWPos;

        // #####################################################################

        void main(){
            vec4 wPos       = modelMatrix * vec4( position, 1.0 );
            
            fragWPos        = wPos.xyz;
            fragLPos        = position.xyz;

            gl_Position     = projectionMatrix * viewMatrix * wPos;
        }`;

        this.fragmentShader = `precision mediump float;
        in vec3 fragLPos;
        in vec3 fragWPos;
        out vec4 outColor;

        uniform float oRadius;
        uniform vec3  color;

        // #####################################################################

        void main(){
            outColor = vec4( 1.0, 0.0, 0.0, 1.0 );
        }`;
    }
}