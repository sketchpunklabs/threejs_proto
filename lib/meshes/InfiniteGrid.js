import { RawShaderMaterial, PlaneGeometry, Mesh, Color, GLSL3, DoubleSide } from 'three';

export default class InfiniteGrid extends RawShaderMaterial {
    static mesh(){
        const geo  = new PlaneGeometry( 2, 2 );
        geo.rotateX( -Math.PI / 2 );

        const mesh = new Mesh( geo, new InfiniteGrid() );
        mesh.frustumCulled  = false;

        return mesh;
    }

    constructor( props={} ){
        super();
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Merge custom props with default options
        // const opts = Object.assign({
        //     offset : [ 0, 1, 0 ],
        //     color  : new THREE.Color( '#00ff00' ),
        // }, props );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name             = 'InfinitGrid';
        this.glslVersion      = GLSL3;
        this.depthTest        = true
        this.side             = DoubleSide;
        this.transparent      = true;
        // this.alphaToCoverage  = true;
        // this.lights           = false;
        // this.blending         = THREE.NormalBlending;

        this.uniforms = {
          gridScl   : { type:'float', value: 100 },

          fadeRange   : { type:'float', value: 20 },
          fadePow     : { type:'float', value: 1 },

          majorSize   : { type:'float', value: 1 },
          minorSize   : { type:'float', value: 0.2 },

          majorThic   : { type:'float', value: 0.6 },
          minorThic   : { type:'float', value: 1.2 },

          majorCol    : { type:'vec3', value: new Color(0x327340) }, // red: 0x9d4b4b,  greenish: 0x3B8F72, lime: 0x3E8F50, cyan: 0x428F8C
          minorCol    : { type:'vec3', value: new Color(0x404040) },
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in vec3 position;
        // in vec3 normal;
        // in vec2 uv;

        uniform highp float gridScl;

        uniform highp vec3 cameraPosition;
        // uniform mat4 modelMatrix;       // To WorldSpace
        uniform mat4 viewMatrix;        // To ViewSpace
        uniform mat4 projectionMatrix;  // To NDC ( Normalized Device Coordinate Space ) aka ScreenSpace

        out vec3 fwPos;

        void main(){
            // vec4 wpos   = modelMatrix * vec4( position, 1.0 );
            // fragUV      = uv;
            // fragWNorm   = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            vec4 spos    = vec4( position * gridScl, 1.0 ); // Scale Plane
            spos.x      += cameraPosition.x;                // Keep plane under camera
            spos.z      += cameraPosition.z;

            fwPos        = spos.xyz;                        // WorldSpace Position

            gl_Position  = projectionMatrix * viewMatrix * spos;
        }`;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.fragmentShader = `precision mediump float;
        in vec3 fwPos;
        out vec4 outColor;

        uniform highp vec3 cameraPosition;
        uniform float fadeRange;
        uniform float fadePow;
        uniform vec3 majorCol;
        uniform vec3 minorCol;
        uniform float majorThic;
        uniform float minorThic;
        uniform float majorSize;
        uniform float minorSize;

        float gridMask( vec2 pos, float size, float thick ){
            vec2 cell = pos / size;                       // Divide space into cells
            vec2 mask = abs( fract( cell - 0.5 ) - 0.5 ); // Remap: 0:1 to 0:1:0, Near 1 will be at cell border
                 mask = mask / fwidth( cell );            // Turn gradient into 1 pixel thin lines
            float fm  = min( mask.x, mask.y ) * thick;    // Create grid & apply a bit of thickness
            return 1.0 - min( 1.0, fm );                  // Invert mask, Lines will be white
        }

        void main(){
            outColor = vec4( vec3(0.0), 1.0 );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // MASK
            float mMajor = gridMask( fwPos.xz, majorSize, majorThic );
            float mMinor = gridMask( fwPos.xz, minorSize, minorThic );

            // outColor.rgb = vec3( mMajor );
            // outColor.rgb = vec3( max( mMinor, mMajor ) );
            // outColor.rgb = mix( colInner, colOuter, min( 1.0, 1.0 * mMajor ) );

            outColor.rgb = mix( minorCol, majorCol, mMajor );
            outColor.a   = max( mMinor, mMajor );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // FADE
            float dist   = distance( fwPos, cameraPosition );
            float d      = 1.0 - min( dist / fadeRange, 1.0 );
            outColor.a   = outColor.a * pow( d, fadePow );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            if( outColor.a <= 0.0 ) discard;
            outColor.rgb = pow( outColor.rgb, vec3( 1.0 / 2.2 ) );    // gamma correction to get correct colors
        }`;
    }

  // #region SETTERS
//   setOffset( v ){
//     this.uniforms.offset.value = v;
//     return this;
//   }
  // #endregion
}
