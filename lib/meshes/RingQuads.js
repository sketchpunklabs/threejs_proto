// #region IMPORTS
import * as THREE from 'three';
// #endregion

export default class RingQuads extends THREE.Mesh{
    // #region MAIN
    _defaultSize      = 6;
    _defaultRadius    = 0.6;
    _defaultColor     = 0x00ff00;
    _defaultColor2    = 0xff0000;
    _cnt              = 0;
    _pos              = [];
    _col              = [];
    _col2             = [];
    _cfg              = []; // [ size, thick ]
    _dirty            = false;

    constructor(initSize = 20) {
        const mat = new RingQuadsMaterial();
        const geo = createInstanceGeo(
            null,
            new Float32Array(initSize * 3),
            new Float32Array(initSize * 3),
            new Float32Array(initSize * 3),
            new Float32Array(initSize * 2),
        );

        super( geo, mat );

        this.name = 'RingQuads';
        this.onBeforeRender = () => {
            if (this._dirty) this._updateGeometry();
        };
    }
  // #endregion

    // #region MANAGE DATA
    reset(){
        this._cnt           = 0;
        this._pos.length    = 0;
        this._col.length    = 0;
        this._col2.length   = 0;
        this._cfg.length    = 0;
        this.geometry.instanceCount = 0;
        return this;
    }

    push( pos, color = this._defaultColor, color2 = this._defaultColor2, size = this._defaultSize, radius = this._defaultRadius ){
        this._pos.push(pos[0], pos[1], pos[2])
        this._col.push(...glColor(color));
        this._col2.push(...glColor(color2));

        this._cfg.push(size, radius);
        this._cnt++;
        this._dirty = true;
        return this;
    }

    setColorAt( idx, color, color2 ){
        const c  = glColor(color);
        const c2 = glColor(color2);
        idx     *= 3;

        this._col[idx]      = c[0];
        this._col[idx + 1]  = c[1];
        this._col[idx + 2]  = c[2];

        this._col2[idx]     = c2[0];
        this._col2[idx + 1] = c2[1];
        this._col2[idx + 2] = c2[2];
        this._dirty         = true;
        return this;
    }

    setPosAt( idx, pos ){
        idx *= 3;
        this._pos[idx + 0] = pos[0];
        this._pos[idx + 1] = pos[1];
        this._pos[idx + 2] = pos[2];
        this._dirty        = true;
        return this;
    }

    getPosAt( idx ){
        if( idx < this._cnt ){
            const i = idx * 3;
            return [ this._pos[i + 0], this._pos[i + 1], this._pos[i + 2] ];
        }
        return [0, 0, 0];
    }
    // #endregion

    // #region MISC
    forDebugging( order = 101 ){
        this.renderOrder        = order;
        this.frustumCulled      = false;
        this.material.depthTest = false;
        return this;
    }

    _updateGeometry(){
        const geo   = this.geometry;
        const bPos  = geo.attributes.ipos;
        const bCol  = geo.attributes.icol;
        const bCol2 = geo.attributes.icol2;
        const bCfg  = geo.attributes.icfg;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(
            this._pos.length  > bPos.array.length  ||
            this._col.length  > bCol.array.length  ||
            this._col2.length > bCol2.array.length ||
            this._cfg.length  > bCfg.array.length
        ){
            const oldGeo  = this.geometry;
            this.geometry = createInstanceGeo(
                oldGeo,
                new Float32Array( this._pos ),
                new Float32Array( this._col ),
                new Float32Array( this._col2 ),
                new Float32Array( this._cfg ),
            );

            oldGeo.dispose();
            this._dirty = false;
            return;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        bPos.array.set( this._pos );
        bPos.count       = this._pos.length / 3;
        bPos.needsUpdate = true;

        bCol.array.set( this._col );
        bCol.count       = this._col.length / 3;
        bCol.needsUpdate = true;

        bCol2.array.set( this._col2 );
        bCol2.count       = this._col2.length / 3;
        bCol2.needsUpdate = true;

        bCfg.array.set( this._cfg );
        bCfg.count       = this._cfg.length / 2;
        bCfg.needsUpdate = true;

        geo.instanceCount = bPos.count;
        geo.computeBoundingBox();
        geo.computeBoundingSphere();

        this._dirty = false;
    }
    // #endregion
}

// #region SUPPORT 

function createInstanceGeo( oldGeo, pos, col, col2, cfg ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const geo = new THREE.InstancedBufferGeometry();
    let xGeo;

    if( !oldGeo ){
        // Brand new blank geo
        xGeo = new THREE.PlaneGeometry( 1, 1 );
        geo.instanceCount = 0;
    }else{
        // Rebuilding & Extending old Geo
        geo.instanceCount = pos.length / 3;
        xGeo = oldGeo;
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    geo.setAttribute( 'position', new THREE.BufferAttribute( xGeo.attributes.position.array, 3 ) );
    geo.setAttribute( 'uv', new THREE.BufferAttribute( xGeo.attributes.uv.array, 2 ) );

    if( xGeo.index ) geo.setIndex( new THREE.BufferAttribute( xGeo.index.array, 1 ) );

    geo.setAttribute( 'ipos',  new  THREE.InstancedBufferAttribute( pos, 3 ) );
    geo.setAttribute( 'icol',  new  THREE.InstancedBufferAttribute( col, 3 ) );
    geo.setAttribute( 'icol2', new THREE.InstancedBufferAttribute( col2, 3 ) );
    geo.setAttribute( 'icfg',  new  THREE.InstancedBufferAttribute( cfg, 2 ) );

    return geo;
}

function glColor( hex, out = null ){
    const NORMALIZE_RGB = 1 / 255;
    out = out || [0,0,0];

    out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
    out[1] = ( hex >> 8 & 255 )  * NORMALIZE_RGB;
    out[2] = ( hex & 255 )       * NORMALIZE_RGB;

    return out;
}

// #endregion

// #region MATERIAL

class RingQuadsMaterial extends THREE.RawShaderMaterial {
    constructor() {
        super();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name            = 'RingQuadsMaterial';
        this.glslVersion     = THREE.GLSL3;
        this.side            = THREE.DoubleSide;
        this.depthTest       = true;
        this.transparent     = true;
        this.alphaToCoverage = true;

        this.uniforms = {
            uniScale: { value: 0.03 },
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in vec3 position;
        in vec2 uv;
        in vec3 ipos;
        in vec3 icol;
        in vec3 icol2;
        in vec2 icfg; // [size, radius]

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        uniform float uniScale;

        out vec2 fragUV;
        out vec3 fragCol;
        out vec3 fragCol2;
        out float fragRadius;

        // #####################################################################

        void main(){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Get the transposed positions if we treat the viewMatrix as a 3x# matrix
            // This allows us to avoid using invert to get the camera axes
            vec3 xCam = vec3( viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x );
            vec3 yCam = vec3( viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y );
            vec3 zCam = vec3( viewMatrix[0].z, viewMatrix[1].z, viewMatrix[2].z );

            // Spherical billboarding position
            // Use the model-view matrix to get the correct camera axes after group rotation
            mat4 mvMatrix = viewMatrix * modelMatrix;
            vec3 xCamMV = vec3( mvMatrix[0].x, mvMatrix[1].x, mvMatrix[2].x );
            vec3 yCamMV = vec3( mvMatrix[0].y, mvMatrix[1].y, mvMatrix[2].y );
            
            vec3 bPos = ipos 
                + ( xCamMV * position.x * uniScale * icfg.x ) 
                + ( yCamMV * position.y * uniScale * icfg.x );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wPos   = modelMatrix * vec4( bPos, 1.0 );
            gl_Position = projectionMatrix * viewMatrix * wPos;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            fragUV     = uv;
            fragCol    = icol;
            fragCol2   = icol2;
            fragRadius = icfg.y;
        }`;

        this.fragmentShader = `precision mediump float;
        in vec2 fragUV;
        in vec3 fragCol;
        in vec3 fragCol2;
        in float fragRadius;

        out vec4 outColor;

        // #####################################################################
        const float RADIUS_MAX = 0.90;

        void main(){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute circle data
            vec2 coord   = fragUV * 2.0 - 1.0;   // Remap from 0:1 to -1:1
            float radius = dot( coord, coord );  // Square Length
            float dxdy   = fwidth( radius );     // Anti-Alias delta

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Create circle masks
            float oMask = smoothstep( 
                RADIUS_MAX + dxdy, 
                RADIUS_MAX - dxdy, 
                radius
            );

            float iMask = smoothstep( 
                ( RADIUS_MAX * fragRadius ) + dxdy, 
                ( RADIUS_MAX * fragRadius ) - dxdy, 
                radius
            );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Blend Colors
            vec4 xCol = vec4( 0.0 );
            vec4 oCol = vec4( fragCol2, 1.0 );
            vec4 iCol = vec4( fragCol, 1.0 );

            outColor  = mix( xCol, oCol, oMask );
            outColor  = mix( outColor, iCol, iMask );
        }`;
    }
}

// #endregion