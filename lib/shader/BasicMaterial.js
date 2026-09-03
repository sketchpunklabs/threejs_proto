export default class BasicMaterial extends THREE.RawShaderMaterial{
    set uMap( v ){ this.uniforms.uMap.value = v; return this; }
    constructor( props={} ){
        super();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name           = 'BasicMaterial';
        this.glslVersion    = THREE.GLSL3;
        // this.depthTest      = true;
        // this.transparent    = true;
        this.side           = THREE.DoubleSide;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.uniforms = {
            uMap        : { type:'sampler2D', value: props.map },
            useGamma    : { type:'float', value: props.useGamma ?? 1 },
            // color   : { type:'vec3',  value: new THREE.Color( opt.color ) }
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in vec3 position;
        in vec2 uv;

        // uniform mat4 modelMatrix;
        // uniform mat4 viewMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        out vec2 fragUV;

        // ################################################################

        void main(){
            fragUV      = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`;

        this.fragmentShader  = `precision mediump float;
        in vec2 fragUV;
        uniform sampler2D uMap;
        uniform float useGamma;
        out vec4 outColor;

        vec3 linearToSRGB( vec3 linearColor ){
            // True sRGB transfer function piecewise approximation
            vec3 low  = linearColor * 12.92;
            vec3 high = pow(linearColor, vec3( 1.0 / 2.4 ) ) * 1.055 - 0.055;

            // Choose between linear or exponential branch based on threshold
            return mix( high, low, lessThanEqual( linearColor, vec3( 0.0031308 ) ) );
        }

        // #####################################################################
        void main(){
            outColor = texture( uMap, fragUV );

            // gamma correction to get correct colors
            // if( useGamma > 0.5 ) outColor.rgb = pow( outColor.rgb, vec3( 1.0 / 2.2 ) ); // Approximation
            if( useGamma > 0.5 ) outColor.rgb = linearToSRGB( outColor.rgb );           // Exact sRGB
        }`;
    }
}
