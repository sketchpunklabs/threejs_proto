import * as THREE from 'three';

export default class AngleViewMaterial extends THREE.RawShaderMaterial{    
    static createMesh(){
        return new THREE.Mesh(
            new THREE.PlaneGeometry( 1, 1 ), 
            new AngleViewMaterial()
        );
    }

    constructor(){
        super();
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name           = 'AngleViewMaterials';
        this.glslVersion    = THREE.GLSL3;
        this.depthTest      = true;
        this.transparent    = true;
        this.side           = THREE.DoubleSide;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.uniforms = { 
            radArc    : { type :'float', value: -315 * Math.PI / 180 },
            radOffset : { type :'float', value: 0 * Math.PI / 180 },
            radLine   : { type :'float', value: 0 * Math.PI / 180 },
            radLineOn : { type :'float', value: 0 },
        };

        // this.setRange( -190, 60 );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in	vec3    position;
        in  vec3    normal;
        in	vec2    uv;
        
        uniform     mat4    modelMatrix;
        uniform     mat4    viewMatrix;
        uniform     mat4    projectionMatrix;

        out vec3    fragWPos;  // World Space Position
        out vec3    fragNorm;
        out vec2    fragUV;
        
        // ################################################################

        void main(){
            vec4 wPos 	        = modelMatrix * vec4( position, 1.0 );  // World Space
            vec4 vPos           = viewMatrix * wPos;               // View Space
            
            fragUV              = uv;
            fragWPos            = wPos.xyz;
            fragNorm            = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            gl_Position			= projectionMatrix * vPos;
        }`;

        this.fragmentShader  = `precision mediump float;
        in  vec3    fragWPos;
        in  vec3    fragNorm;
        in  vec2    fragUV;
        out vec4    outColor;

        uniform float radArc;
        uniform float radOffset;
        uniform float radLine;
        uniform float radLineOn;

        // ################################################################

        float ring( vec2 coord, float outer, float inner ){ 
            float radius = dot( coord, coord );
            float dxdy   = fwidth( radius );
            return  smoothstep( inner - dxdy, inner + dxdy, radius ) - 
                    smoothstep( outer - dxdy, outer + dxdy, radius );
        }

        float circle( vec2 coord, float outer ){ 
            float radius = dot( coord, coord );
            float dxdy   = fwidth( radius );
            return 1.0 - smoothstep( outer - dxdy, outer + dxdy, radius );
        }

        // https://www.shadertoy.com/view/XtXyDn
        float arc( vec2 uv, vec2 up, float angle, float radius, float thick ){
            float hAngle = angle * 0.5;

            // vector from the circle origin to the middle of the arc
            float c  = cos( hAngle );
            
            // smoothing perpendicular to the arc
            float d1 = abs( length( uv ) - radius ) - thick;
            float w1 = 1.5 * fwidth( d1 ); // proportional to how much d1 change between pixels
            float s1 = smoothstep( w1 * 0.5, -w1 * 0.5, d1 ); 

            // smoothing along the arc
            float d2 = dot( up, normalize( uv ) ) - c;
            float w2 = 1.5 * fwidth( d2 ); // proportional to how much d2 changes between pixels
            float s2 = smoothstep( w2 * 0.5, -w2 * 0.5, d2 ); 

            // mix perpendicular and parallel smoothing
            return s1 * ( 1.0 - s2 );
        }

        float sdOrientedBox( in vec2 p, in vec2 a, in vec2 b, float th ){
            float l = length(b-a);
            vec2  d = (b-a)/l;
            vec2  q = (p-(a+b)*0.5);
                q = mat2(d.x,-d.y,d.y,d.x)*q;
                q = abs(q)-vec2(l,th)*0.5;
            return length(max(q,0.0)) + min(max(q.x,q.y),0.0);    
        }

        float sdTriangleIsosceles( in vec2 p, in vec2 q ){
            p.x = abs(p.x);
            vec2  a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
            vec2  b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
            float s = -sign( q.y );
            vec2  d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                           vec2( dot(b,b), s*(p.y-q.y) ) );
            return -sqrt(d.x) * sign(d.y);
        }

        float triangleMask( vec2 uv, vec2 size, vec2 offset ){
            // Transform the UV, Flip 180d & Move
            vec2 coord = uv * vec2( 1.0, -1.0 ) + offset;

            // Get distance from shape
            float dist = sdTriangleIsosceles( coord, size );
            return 1.0 - smoothstep( 0.0, 0.01, dist ); // Smooth & Invert Mask
        }

        // ################################################################

        void main(){
            outColor = vec4( 0.0, 0.0, 0.0, 1.0 );

            vec2 uvn    = fragUV * 2.0 - 1.0;  // Remap 0:1 to -1:1
            float mask  = 0.0;
            float upRad = radians( 90.0 );     // Starting radians to make UP zero degrees
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // ARC

            float maskArc = 0.0;

            if( radArc != 0.0 ){
                float arcRadius   = 0.56;
                float arcThick    = 0.18;
                float arcCenter   = upRad + radOffset + radArc * 0.5;
                vec2 arcCenterDir = vec2( cos( arcCenter ), sin( arcCenter ) );
                      maskArc     = arc( uvn, arcCenterDir, radArc, arcRadius, arcThick );
            }

            // outColor.rgb = vec3( maskArc );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // RING
            float maskRing =  ring( uvn, 0.78, 0.67 );
            // outColor.rgb = vec3( maskRing );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // CIRCLE
            float maskCircle = circle( uvn, 0.01 );
            // outColor.rgb     = vec3( maskCircle );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // TRIANGLE
            float maskTri = triangleMask( uvn, vec2(0.2,0.13), vec2(0.0,0.98) );
            // outColor.rgb = vec3( maskTri );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // LINE
            float maskLineCut = 1.0;
            float maskLine    = 0.0;

            if( radLineOn != 0.0 ){
                float lRadius = 0.6;
                vec2 end      = vec2( cos( upRad + radLine ) * lRadius, sin( upRad + radLine ) * lRadius );

                float distLen     = sdOrientedBox( uvn, vec2(0.0), end, 0.03 );
                      maskLine    = smoothstep( 0.03, 0.02, distLen );
                      maskLineCut = smoothstep( 0.08, 0.09, distLen );
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // MERGE MASKS
            mask = max( maskTri, maskRing );
            mask = max( mask, maskArc * maskLineCut );
            if( radLineOn != 0.0 ){ mask = max( mask, maskLine ); }
            mask = max( mask, maskCircle );
            outColor = vec4( mask );
        }`;
    }

    // Create  min/max arc in degrees
    setRange( dMin, dMax ){
        const nMin = normAngle( dMin );
        const nMax = normAngle( dMax );
        
        if( nMin <= nMax ){
            this.uniforms.radArc.value    = ( nMax - nMin ) * TO_RAD;
            this.uniforms.radOffset.value =  nMin * TO_RAD;
        }else{
            this.uniforms.radArc.value    = (( 180 - nMin ) + ( nMax - (-180) )) * TO_RAD;
            this.uniforms.radOffset.value = nMin * TO_RAD;
        }
    }

    // Pass in arc in radians
    setArc( rad, offset=0 ){
        this.uniforms.radArc.value    = rad;
        this.uniforms.radOffset.value = offset;
    }

    // Draw lines
    setRadLine( rad, isOn=1 ){
        this.uniforms.radLine.value   = rad;
        this.uniforms.radLineOn.value = isOn;
    }
}

// #region HELPERS

const TO_RAD = Math.PI / 180;
function normAngle( a ){
    const x = a % 360;
    if( x > 180 )  return x - 360;
    if( x < -180 ) return x + 360;
    return x;
}

// Helper function to find the shortest angular distance
function angleDist(a1, a2) {
  const diff = Math.abs( normAngle(a1) - normAngle(a2) );
  return Math.min(diff, 360 - diff);
}

// function clamp(dMin, dMax, d) {
//   const nMin = normAngle(dMin);
//   const nMax = normAngle(dMax);
//   const nD = normAngle(d);

//   if (isBetween(nMin, nMax, nD)) {
//     return nD;
//   }

//   // Calculate the distance to both min and max angles
//   // and return the closer one.
//   const distToMin = angleDist(nD, nMin);
//   const distToMax = angleDist(nD, nMax);

//   return distToMin < distToMax ? nMin : nMax;
// }

function isBetween( dMin, dMax, d ){
    const nMin = normAngle( dMin );
    const nMax = normAngle( dMax );
    const nD   = normAngle( d );

    if( nMin < nMax ) return ( nD >= nMin ) && ( nD <= nMax );

    // Crosses -180/180 boundary like 170 to -170
    return ( nD >= nMin && nD <= 180 ) ||
           ( nD >= -180 && nD <= nMax );
}

// Total Arc Angle & Starting Offset angle to visualize min & max
// function arcAndOffset( dMin, dMax ){ // [ arc, offset ]
//     const nMin = normAngle( dMin );
//     const nMax = normAngle( dMax );
    
//     if( nMin <= nMax ) return [ ( nMax - nMin ) * TO_RAD, nMin * TO_RAD ];
    
//     // Crosses -180/180 boundary like 170 to -170
//     return [ (( 180 - nMin ) + ( nMax - (-180) )) * TO_RAD, nMin * TO_RAD ];
// }

// #endregion