// #region IMPORTS
import * as THREE from 'three';
// #endregion

export default class ShapeQuads extends THREE.Mesh{
    // #region MAIN
    _defaultShape = 1;
    _defaultSize  = 1;
    _defaultColor = 0x00ff00;
    _cnt          = 0;
    _pos          = [];
    _col          = [];
    _cfg          = []; // [ size, shape ]
    _dirty        = false;

    constructor(initSize = 20) {
        const mat = new ShapeQuadsMaterial();
        const geo = createInstanceGeo(
            null,
            new Float32Array(initSize * 3),
            new Float32Array(initSize * 3),
            new Float32Array(initSize * 2),
        );

        super(geo, mat);

        this.name = 'ShapeQuads';
        this.onBeforeRender = () => {
            if (this._dirty) this._updateGeometry();
        };
    }

    // #endregion

    // #region MANAGE DATA

    reset() {
        this._cnt           = 0;
        this._pos.length    = 0;
        this._col.length    = 0;
        this._cfg.length    = 0;
        this.geometry.instanceCount = 0;
        return this;
    }

    add( pos, color=this._defaultColor, size=this._defaultSize, shape=this._defaultShape ){
        this._pos.push(pos[0], pos[1], pos[2]);
        this._col.push(...glColor(color));

        this._cfg.push(size, shape);
        this._cnt++;
        this._dirty = true;
        return this;
    }

    setColorAt(idx, color){
        const c = glColor(color);
        idx *= 3;

        this._col[idx]      = c[0];
        this._col[idx + 1]  = c[1];
        this._col[idx + 2]  = c[2];
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

    getPosAt(idx){
        if (idx < this._cnt) {
            const i = idx * 3;
            return [this._pos[i + 0], this._pos[i + 1], this._pos[i + 2]];
        }

        return [0, 0, 0];
    }

  // #endregion

    // #region MISC

    forDebugging(order = 101) {
        this.renderOrder        = order;
        this.frustumCulled      = false;
        this.material.depthTest = false;
        return this;
    }

    _updateGeometry() {
        const geo  = this.geometry;
        const bPos = geo.attributes.ipos;
        const bCol = geo.attributes.icol;
        const bCfg = geo.attributes.icfg;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(
            this._pos.length > bPos.array.length ||
            this._col.length > bCol.array.length ||
            this._cfg.length > bCfg.array.length
        ){
            const oldGeo  = this.geometry;
            this.geometry = createInstanceGeo( oldGeo, new Float32Array(this._pos), new Float32Array(this._col), new Float32Array(this._cfg) );

            oldGeo.dispose();
            this._dirty = false;
            return;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        bPos.array.set(this._pos);
        bPos.count       = this._pos.length / 3;
        bPos.needsUpdate = true;

        bCol.array.set(this._col);
        bCol.count       = this._col.length / 3;
        bCol.needsUpdate = true;

        bCfg.array.set(this._cfg);
        bCfg.count       = this._cfg.length / 2;
        bCfg.needsUpdate = true;

        geo.instanceCount = bPos.count;
        geo.computeBoundingBox();
        geo.computeBoundingSphere();

        this._dirty = false;
    }

    // #endregion
}

// #region HELPERS

function createInstanceGeo( oldGeo, pos, col, cfg ){
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  const geo = new THREE.InstancedBufferGeometry();
  let xGeo;

  if (!oldGeo) {
    // Brand new blank geo
    xGeo = new THREE.PlaneGeometry(1, 1);
    geo.instanceCount = 0;
  } else {
    // Rebuilding & Extending old Geo
    geo.instanceCount = pos.length / 3;
    xGeo = oldGeo;
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(xGeo.attributes.position.array, 3),
  );
  geo.setAttribute(
    'uv',
    new THREE.BufferAttribute(xGeo.attributes.uv.array, 2),
  );

  if (xGeo.index) geo.setIndex(new THREE.BufferAttribute(xGeo.index.array, 1));

  geo.setAttribute('ipos', new THREE.InstancedBufferAttribute(pos, 3));
  geo.setAttribute('icol', new THREE.InstancedBufferAttribute(col, 3));
  geo.setAttribute('icfg', new THREE.InstancedBufferAttribute(cfg, 2));

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

class ShapeQuadsMaterial extends THREE.RawShaderMaterial {
    constructor() {
        super();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name           = 'ShapeQuadsMaterial';
        this.glslVersion    = THREE.GLSL3;
        this.side           = THREE.DoubleSide;
        this.depthTest      = true;
        this.transparent    = true;
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
        in vec2 icfg; // [size,shape]

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        uniform float uniScale;

        out vec2 fragUV;
        out vec3 fragCol;
        flat out int fragShape;

        // #####################################################################

        void main(){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Get the transposed positions if we treat the viewMatrix as a 3x# matrix
            // This allows us to avoid using invert to get the camera axes
            vec3 xCam = vec3( viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x );
            vec3 yCam = vec3( viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y );

            // Spherical billboarding position
            vec3 bPos = ipos 
                + ( xCam * position.x * uniScale * icfg.x ) 
                + ( yCam * position.y * uniScale * icfg.x );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wPos   = modelMatrix * vec4( bPos, 1.0 );
            gl_Position = projectionMatrix * viewMatrix * wPos;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            fragUV    = uv;
            fragCol   = icol;
            fragShape = int( icfg.y );
        }`;

        this.fragmentShader = `precision mediump float;
        in vec2 fragUV;
        in vec3 fragCol;
        flat in int fragShape;

        out vec4 outColor;

        #define PI	3.14159265359
        #define PI2	6.28318530718

        // #####################################################################

        float circle(){ 
            vec2 coord      = fragUV * 2.0 - 1.0; // v_uv * 2.0 - 1.0;
            float radius    = dot( coord, coord );
            float dxdy      = fwidth( radius );
            return smoothstep( 0.90 + dxdy, 0.90 - dxdy, radius );
        }
        
        float ring( float inner ){ 
            vec2 coord      = fragUV * 2.0 - 1.0;
            float radius    = dot( coord, coord );
            float dxdy      = fwidth( radius );
            return  smoothstep( inner - dxdy, inner + dxdy, radius ) - 
                    smoothstep( 1.0 - dxdy, 1.0 + dxdy, radius );
        }
        
        float diamond(){
            // http://www.numb3r23.net/2015/08/17/using-fwidth-for-distance-based-anti-aliasing/
            const float radius = 0.5;
        
            float dst   = dot( abs(fragUV-vec2(0.5)), vec2(1.0) );
            float aaf   = fwidth( dst );
            return 1.0 - smoothstep( radius - aaf, radius, dst );
        }
        
        float poly( int sides, float offset, float scale ){
            // https://thebookofshaders.com/07/
            vec2 coord = fragUV * 2.0 - 1.0;
            
            coord.y += offset;
            coord *= scale;
        
            float a = atan( coord.x, coord.y ) + PI; 	// Angle of Pixel
            float r = PI2 / float( sides ); 			// Radius of Pixel
            float d = cos( floor( 0.5 + a / r ) * r-a ) * length( coord );
            float f = fwidth( d );
            return smoothstep( 0.5, 0.5 - f, d );
        }

        // signed distance to a n-star polygon with external angle en
        float sdStar( float r, int n, float m ){ // m=[2,n]
            vec2 p = vec2( fragUV.x, 1.0 - fragUV.y ) * 2.0 - 1.0;

            // these 4 lines can be precomputed for a given shape
            float an = 3.141593/float(n);
            float en = 3.141593/m;
            vec2  acs = vec2(cos(an),sin(an));
            vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) and simplify, for regular polygon,
        
            // reduce to first sector
            float bn = mod(atan(p.x,p.y),2.0*an) - an;
            p = length(p)*vec2(cos(bn),abs(sin(bn)));
        
            // line sdf
            p -= r*acs;
            p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);

            float dist = length(p)*sign(p.x);
            float f = fwidth( dist );

            return smoothstep( 0.0, 0.0 - f, dist );
        }

        // #####################################################################

        void main(){
            float alpha = 1.0;

            if( fragShape == 1 ) alpha = circle();
            if( fragShape == 2 ) alpha = diamond();
            if( fragShape == 3 ) alpha = poly( 3, 0.2, 1.0 );	// Triangle
            if( fragShape == 4 ) alpha = poly( 5, 0.0, 0.65 );  // Pentagram
            if( fragShape == 5 ) alpha = poly( 6, 0.0, 0.65 );	// Hexagon
            if( fragShape == 6 ) alpha = ring( 0.2 );
            if( fragShape == 7 ) alpha = ring( 0.7 );
            if( fragShape == 8 ) alpha = sdStar( 1.0, 3, 2.3 );
            if( fragShape == 9 ) alpha = sdStar( 1.0, 6, 2.5 );
            if( fragShape == 10 ) alpha = sdStar( 1.0, 4, 2.4 );
            if( fragShape == 11 ) alpha = sdStar( 1.0, 5, 2.8 );

            outColor = vec4( fragCol, alpha );
        }`;
    }
}

// #endregion