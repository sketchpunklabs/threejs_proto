import * as THREE from 'three';

// ScreenSpaceQuad.asMesh( {color: 0x00ff00 })
export default class ScreenSpaceQuad extends THREE.MeshBasicMaterial{
    static BOTTOM_LEFT  = 0;
    static TOP_LEFT     = 1;
    static TOP_RIGHT    = 2;
    static BOTTOM_RIGHT = 3;

    static asMesh( props={} ){
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 1, 1 ),
            new ScreenSpaceQuad( props )
        );
        mesh.renderOrder   = 100;
        mesh.frustumCulled = false;
        return mesh;
    }

    _uniforms = {
        uRes    : { value: [window.innerWidth, window.innerHeight] },
        uSize   : { value: [100, 100] },
        uOffset : { value: [0, 0] }, // Pixel offset from origin
        uOrigin : { value: ScreenSpaceQuad.BOTTOM_LEFT }, // Selected corner origin
    };

    constructor( props ){
        super( props );
        this.name       = 'ScreenSpaceQuad';
        this.depthTest  = false;
        this.depthWrite = false;

        this.size   = props.qsize   ?? [100,100];
        this.origin = props.qorigin ?? ScreenSpaceQuad.BOTTOM_RIGHT;
        this.offset = props.qoffset ?? [20,20];

        this.useGamma = props.gamma ?? true;
    }

    // Getters & Setters
    set resolution( v ){ this._uniforms.uRes.value    = v; }
    set size( v ){       this._uniforms.uSize.value   = v; }
    set offset( v ){     this._uniforms.uOffset.value = v; }
    set origin( v ){     this._uniforms.uOrigin.value = v; }

    onBeforeCompile = ( sh )=>{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Merge uniforms
        Object.assign(sh.uniforms, this._uniforms);
        this._uniforms = sh.uniforms;

        // 2. Prepend uniforms to vertex shader header
        sh.vertexShader = `
        uniform vec2 uRes;
        uniform vec2 uSize;
        uniform vec2 uOffset;
        uniform int  uOrigin;
        ` + sh.vertexShader;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Override gl_Position in <project_vertex>
        sh.vertexShader = sh.vertexShader.replace( '#include <project_vertex>',`
        vec2 pixelSize   = position.xy * uSize; // Scale to pixels
        vec2 localCenter = uSize * 0.5;         // Local center offset so quad edges align with origin
        vec2 pixelPos    = vec2( 0.0 );

        // Left or Right Side
        if( uOrigin == 0 || uOrigin == 1 ) pixelPos.x = localCenter.x + uOffset.x;
        else                               pixelPos.x = uRes.x - localCenter.x - uOffset.x;

        // Top or Bottom Side
        if( uOrigin == 1 || uOrigin == 2 ) pixelPos.y = uRes.y - localCenter.y - uOffset.y;
        else                               pixelPos.y = localCenter.y + uOffset.y;

        vec2 px     = pixelSize + pixelPos;         // final pixel position
        vec2 ndc    = ( px / uRes ) * 2.0 - 1.0;    // Convert Pixel to NDC
        gl_Position = vec4( ndc, 0.0, 1.0 );
        `);

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Stop Three.js from applying automatic sRGB/gamma conversion
        if( !this.useGamma ){
            sh.fragmentShader = sh.fragmentShader.replace( '#include <colorspace_fragment>', '' );
        }
    };
}
