import * as THREE from 'three';

export default class CheckerCrossMaterial extends THREE.RawShaderMaterial{
    static createMesh( prop={} ){
        const opt = { scl: 1, ...prop };

        const geo  = new THREE.PlaneGeometry( 2, 2, 1, 1 );
        geo.rotateX( -Math.PI * 0.5 );

        const mesh = new THREE.Mesh( geo, new CheckerCrossMaterial() );
        mesh.scale.setScalar( opt.scl );

        return mesh;
    }

    constructor(){
        super();
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name           = 'CheckerCrossMaterial';
        this.glslVersion    = THREE.GLSL3;
        this.depthTest      = true;
        this.transparent    = true;
        this.side           = THREE.DoubleSide;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.uniforms = {
            offset  : { type: 'vec2',  value: [0,0] },
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in	vec3    position;
        in  vec3    normal;
        in	vec2    uv;

        uniform     mat4    modelMatrix;
        uniform     mat4    viewMatrix;
        uniform     mat4    projectionMatrix;

        out vec3    fragWPos;  // World Space Position
        // out vec3    fragNorm;
        out vec2    fragUV;

        // ################################################################

        void main(){
            vec4 wPos 	        = modelMatrix * vec4( position, 1.0 );  // World Space
            vec4 vPos           = viewMatrix  * wPos;                   // View Space

            fragUV              = uv;
            fragWPos            = wPos.xyz;
            // fragNorm            = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            gl_Position			= projectionMatrix * vPos;
        }`;

        this.fragmentShader  = `precision mediump float;
        uniform vec2 offset;
        in vec3 fragWPos;
        in vec2 fragUV;

        out vec4 outColor;

        // #####################################################################

        float sdfCross( vec2 p, vec2 b, float r ){
            p = abs( p );
            p = ( p.y > p.x )? p.yx : p.xy;

            vec2  q = p - b;
            float k = max( q.y, q.x );
            vec2  w = ( k > 0.0 )? q : vec2( b.y - p.x, -k );
            float d = length( max( w, 0.0 ) );
            return ( ( k >0.0 )? d : -d ) + r;
        }

        vec3 hsl2rgb( vec3 c ){ // Hue: 0-1, Sat-01, Lit : 0,5
            vec3 rgb = clamp(
                abs(
                    mod( c.x * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0
                ) - 1.0, 0.0, 1.0
            );

            return c.z + c.y * ( rgb - 0.5 ) * ( 1.0 - abs( 2.0 * c.z -1.0 ) );
        }

        vec3 rgb( int c ){
            return vec3(
                float( ( c >> 16 ) & 0xff ) * 0.00392156863,
                float( ( c >> 8 ) & 0xff ) * 0.00392156863,
                float( c & 0xff ) * 0.00392156863
            );
        }

        // #####################################################################
        void main(){
            outColor   = vec4( 1.0 );
            vec2 pos   = fragWPos.xz + offset;
            vec2 space = pos / 1.0;
            vec2 coord = floor( space );
            vec2 grad  = fract( space );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Checker box
            float mask   = mod( coord.x + mod( coord.y, 2.0 ), 2.0 );
            outColor.rgb = mix( rgb( 0x404040 ), rgb( 0x969696 ), mask );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Crosses
            mask    = sdfCross( grad - 0.5, vec2(0.1, 0.02), 0.0 );
            mask    = 1.0 - step( 0.0, mask );

            float hue = length( coord ) / 2.8;    // Cycle some colors
            outColor.rgb = mix( outColor.rgb, hsl2rgb( vec3( hue, 1.0, 0.6) ), mask );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Outer Border
            vec2 vMask    = step( 0.5-0.01, abs( fragUV - 0.5 ) );
            outColor.rgb *= 1.0 - max( vMask.x, vMask.y );
        }`;
    }

    setOffset( x, y ){
        this.uniforms.offset.value[0] = x;
        this.uniforms.offset.value[1] = y;
        return this;
    }
}



function checkerCrossMaterial() {
    const mat = new THREE.RawShaderMaterial({
        name            : 'CheckboxGrid',
        side            : THREE.DoubleSide,
        depthTest       : true,
        transparent 	: true,
        alphaToCoverage : true,
        extensions      : { derivatives : true },

        uniforms        : {
            offset  : { type: 'vec4',  value: [0,0] },
        },

        vertexShader    : `#version 300 es
        in	vec3    position;
        in  vec3    normal;
        in	vec2    uv;

        uniform mat4  modelMatrix;
        uniform mat4  viewMatrix;
        uniform mat4  projectionMatrix;

        out vec3  fragWPos;
        out vec2  fragUV;

        // ############################################################

        void main(){
            vec4 wPos       = modelMatrix * vec4( position, 1.0 );
            gl_Position     = projectionMatrix * viewMatrix * wPos;
            fragWPos        = wPos.xyz;
            fragUV          = uv;
        }`,

        fragmentShader  : `#version 300 es
        precision mediump float;

        uniform vec2 offset;
        in vec3 fragWPos;
        in vec2 fragUV;

        out vec4 outColor;

        // #####################################################################

        float sdfCross( vec2 p, vec2 b, float r ){
            p = abs( p );
            p = ( p.y > p.x )? p.yx : p.xy;

            vec2  q = p - b;
            float k = max( q.y, q.x );
            vec2  w = ( k > 0.0 )? q : vec2( b.y - p.x, -k );
            float d = length( max( w, 0.0 ) );
            return ( ( k >0.0 )? d : -d ) + r;
        }

        vec3 hsl2rgb( vec3 c ){ // Hue: 0-1, Sat-01, Lit : 0,5
            vec3 rgb = clamp(
                abs(
                    mod( c.x * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0
                ) - 1.0, 0.0, 1.0
            );

            return c.z + c.y * ( rgb - 0.5 ) * ( 1.0 - abs( 2.0 * c.z -1.0 ) );
        }

        vec3 rgb( int c ){
            return vec3(
                float( ( c >> 16 ) & 0xff ) * 0.00392156863,
                float( ( c >> 8 ) & 0xff ) * 0.00392156863,
                float( c & 0xff ) * 0.00392156863
            );
        }

        // #####################################################################
        void main(){
            outColor   = vec4( 1.0 );
            vec2 pos   = fragWPos.xz + offset;
            vec2 space = pos / 1.0;
            vec2 coord = floor( space );
            vec2 grad  = fract( space );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Checker box
            float mask   = mod( coord.x + mod( coord.y, 2.0 ), 2.0 );
            outColor.rgb = mix( rgb( 0x404040 ), rgb( 0x969696 ), mask );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Crosses
            mask    = sdfCross( grad - 0.5, vec2(0.1, 0.02), 0.0 );
            mask    = 1.0 - step( 0.0, mask );

            float hue = length( coord ) / 2.8;    // Cycle some colors
            outColor.rgb = mix( outColor.rgb, hsl2rgb( vec3( hue, 1.0, 0.6) ), mask );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Outer boarder
            vec2 vMask    = step( 0.5-0.01, abs( fragUV - 0.5 ) );
            outColor.rgb *= 1.0 - max( vMask.x, vMask.y );
        }`
    });

    Object.defineProperty(mat, 'offsetX', {
        set(v){ mat.uniforms.offset.value[ 0 ] = v; },
    });

    Object.defineProperty(mat, 'offsetY', {
        set(v){ mat.uniforms.offset.value[ 1 ] = v; },
    });

    return mat;
}
