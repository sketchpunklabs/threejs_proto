class CustomMaterial extends THREE.RawShaderMaterial{
    constructor( props={} ){
        super();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Merge custom props with default options
        // const opts = Object.assign({
        //     offset : [ 0, 1, 0 ],
        //     color  : new THREE.Color( '#00ff00' ),
        // }, props );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
            // tex         : { type: 'sampler2D', value: props.tex },
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in vec3 position;
        in vec3 normal;
        in vec2 uv;
        
        // uniform highp vec3 cameraPosition;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        out vec3 fragLPos;
        out vec3 fragWPos;
        out vec3 fragWNorm;
        out vec2 fragUV;

        // #####################################################################

        void main(){
            vec4 wPos       = modelMatrix * vec4( position, 1.0 );
            
            fragWPos        = wPos.xyz;
            fragLPos        = position.xyz;
            fragUV          = uv;
            fragWNorm       = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            gl_Position     = projectionMatrix * viewMatrix * wPos;
        }`;

        this.fragmentShader = `precision mediump float;
        in vec3 fragLPos;
        in vec3 fragWPos;
        in vec3 fragWNorm;
        in vec2 fragUV

        out vec4 outColor;

        uniform float oRadius;
        uniform vec3  color;
        // uniform sampler2D tex;

        // #####################################################################

        void main(){
            //outColor = texture( tex, fragUV );
            outColor = vec4( 1.0, 0.0, 0.0, 1.0 );
        }`;
    }

    // #region SETTERS
    // setOffset( v ){
    //     this.uniforms.offset.value = v;
    //     return this;
    // }
    // #endregion
}