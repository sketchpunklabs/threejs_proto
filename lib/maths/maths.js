// #region MATHS

export function fNorm( min, max, v ){ return (v-min) / (max-min); }

export function smoothStep( min, max, v ){ 
    // https://en.wikipedia.org/wiki/Smoothstep
    v = Math.max( 0, Math.min( 1, (v-min) / (max-min) ) );
    return v * v * ( 3 - 2 * v );
}

export function spherical( x, y ){
    const sx = Math.sin( x );
    return [
        Math.sin( y ) * sx,
        Math.cos( x ),
        Math.cos( y ) * sx, 
    ];
}

// #endregion

// #region QUATERNION

export function qCopy( a, out ){
    out[ 0 ] = a[ 0 ];
    out[ 1 ] = a[ 1 ];
    out[ 2 ] = a[ 2 ];
    out[ 3 ] = a[ 3 ];
    return out;
}

export function qMul( a, b, out=[0,0,0,1] ){
    const ax = a[0], ay = a[1], az = a[2], aw = a[3],
          bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
    out[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
    out[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
    out[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}

export function qInvert( q, out=[0,0,0,1] ){
    const a0  = q[ 0 ],
          a1  = q[ 1 ],
          a2  = q[ 2 ],
          a3  = q[ 3 ],
          dot = a0*a0 + a1*a1 + a2*a2 + a3*a3;
    
    if( dot == 0 ){ out[0] = out[1] = out[2] = out[3] = 0; return out; }

    const iDot  = 1.0 / dot; // let invDot = dot ? 1.0/dot : 0;
    out[ 0 ]    = -a0 * iDot;
    out[ 1 ]    = -a1 * iDot;
    out[ 2 ]    = -a2 * iDot;
    out[ 3 ]    =  a3 * iDot;
    return out;
}

export function qNorm( a, out=[0,0,0,1] ){
    let len =  a[0]**2 + a[1]**2 + a[2]**2 + a[3]**2;
    if( len > 0 ){
        len = 1 / Math.sqrt( len );
        out[ 0 ] *= len;
        out[ 1 ] *= len;
        out[ 2 ] *= len;
        out[ 3 ] *= len;
    }
    return out;
}

export function qTransform( q, v, out=[0,0,0] ){ 
    const qx = q[ 0 ],    qy = q[ 1 ],    qz = q[ 2 ], qw = q[ 3 ],
        vx = v[ 0 ], vy = v[ 1 ], vz = v[ 2 ],
        x1 = qy * vz - qz * vy,
        y1 = qz * vx - qx * vz,
        z1 = qx * vy - qy * vx,
        x2 = qw * x1 + qy * z1 - qz * y1,
        y2 = qw * y1 + qz * x1 - qx * z1,
        z2 = qw * z1 + qx * y1 - qy * x1;
    out[ 0 ] = vx + 2 * x2;
    out[ 1 ] = vy + 2 * y2;
    out[ 2 ] = vz + 2 * z2;
    return out;
}

export function qLook( fwd, up=[0,1,0], out=[0,0,0,1] ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Orthogonal axes to make a mat3x3
    const zAxis	= fwd.slice();
    const xAxis = vNorm( vCross( up, zAxis ) );     // Right

    // Z & UP are parallel
    if( vLenSq( xAxis ) === 0 ){
        if( Math.abs( up[2] ) === 1 ) zAxis[0] += 0.0001;  // shift x when Fwd or Bak
        else                          zAxis[2] += 0.0001;  // shift z

        vNorm( zAxis, zAxis );      // ReNormalize
        vCross( up, zAxis, xAxis ); // Redo Left
        vNorm( xAxis, xAxis );
    }
    
    const yAxis = vNorm( vCross( zAxis, xAxis ) );  // Up
    const m     = [...xAxis, ...yAxis, ...zAxis];

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Mat3 to Quat
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quat Calculus and Fast Animation".
    let fRoot;
    const fTrace = m[0] + m[4] + m[8]; // Diagonal axis

    if( fTrace > 0.0 ){
        // |w| > 1/2, may as well choose w > 1/2
        fRoot	= Math.sqrt( fTrace + 1.0 );  // 2w
        out[3]	= 0.5 * fRoot;
        
        fRoot	= 0.5 / fRoot;  // 1/(4w)
        out[0]	= (m[5]-m[7])*fRoot;
        out[1]	= (m[6]-m[2])*fRoot;
        out[2]	= (m[1]-m[3])*fRoot;
    }else{
        // |w| <= 1/2
        let i = 0;
        if ( m[4] > m[0] )		i = 1;
        if ( m[8] > m[i*3+i] )	i = 2;
        
        const j = (i+1) % 3;
        const k = (i+2) % 3;

        fRoot	    = Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0);
        out[ i ]	= 0.5 * fRoot;
        fRoot	    = 0.5 / fRoot;
        out[ 3 ]	= ( m[j*3+k] - m[k*3+j] ) * fRoot;
        out[ j ]	= ( m[j*3+i] + m[i*3+j] ) * fRoot;
        out[ k ]	= ( m[k*3+i] + m[i*3+k] ) * fRoot;
    }
    return out;
}

function qLook2( dir, up=[0,1,0], out=[0,0,0,1] ){
    // Ported to JS from C# example at https://pastebin.com/ubATCxJY
    // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Orthogonal axes to make a mat3x3
    const zAxis	= dir;
    const xAxis = vNorm( vCross( up, zAxis ) );     // Right
    const yAxis = vNorm( vCross( zAxis, xAxis ) );  // Up
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Mat3 to Quat
    const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2],
            m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2],
            m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2],
            t   = m00 + m11 + m22;

    let x ,y , z , w, s;

    if(t > 0.0){
        s = Math.sqrt(t + 1.0);
        w = s * 0.5 ; // |w| >= 0.5
        s = 0.5 / s;
        x = (m12 - m21) * s;
        y = (m20 - m02) * s;
        z = (m01 - m10) * s;
    }else if((m00 >= m11) && (m00 >= m22)){
        s = Math.sqrt(1.0 + m00 - m11 - m22);
        x = 0.5 * s;// |x| >= 0.5
        s = 0.5 / s;
        y = (m01 + m10) * s;
        z = (m02 + m20) * s;
        w = (m12 - m21) * s;
    }else if(m11 > m22){
        s = Math.sqrt(1.0 + m11 - m00 - m22);
        y = 0.5 * s; // |y| >= 0.5
        s = 0.5 / s;
        x = (m10 + m01) * s;
        z = (m21 + m12) * s;
        w = (m20 - m02) * s;
    }else{
        s = Math.sqrt(1.0 + m22 - m00 - m11);
        z = 0.5 * s; // |z| >= 0.5
        s = 0.5 / s;
        x = (m20 + m02) * s;
        y = (m21 + m12) * s;
        w = (m01 - m10) * s;
    }

    out[ 0 ] = x;
    out[ 1 ] = y;
    out[ 2 ] = z;
    out[ 3 ] = w;
    return out;
}

export function qAxisAngle( axis, rad, out=[0,0,0,1] ){ 
    const half = rad * 0.5;
    const s    = Math.sin( half );
    out[ 0 ]  = axis[ 0 ] * s;
    out[ 1 ]  = axis[ 1 ] * s;
    out[ 2 ]  = axis[ 2 ] * s;
    out[ 3 ]  = Math.cos( half );
    return out;
}

export function qFromAxes( xAxis, yAxis, zAxis, out=[0,0,0,1] ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Mat3 to Quat
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quat Calculus and Fast Animation".
    let fRoot;
    const m      = [...xAxis, ...yAxis, ...zAxis];
    const fTrace = m[0] + m[4] + m[8]; // Diagonal axis

    if( fTrace > 0.0 ){
        // |w| > 1/2, may as well choose w > 1/2
        fRoot	= Math.sqrt( fTrace + 1.0 );  // 2w
        out[3]	= 0.5 * fRoot;
        
        fRoot	= 0.5 / fRoot;  // 1/(4w)
        out[0]	= (m[5]-m[7])*fRoot;
        out[1]	= (m[6]-m[2])*fRoot;
        out[2]	= (m[1]-m[3])*fRoot;
    }else{
        // |w| <= 1/2
        let i = 0;
        if ( m[4] > m[0] )		i = 1;
        if ( m[8] > m[i*3+i] )	i = 2;
        
        const j = (i+1) % 3;
        const k = (i+2) % 3;

        fRoot	    = Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0);
        out[ i ]	= 0.5 * fRoot;
        fRoot	    = 0.5 / fRoot;
        out[ 3 ]	= ( m[j*3+k] - m[k*3+j] ) * fRoot;
        out[ j ]	= ( m[j*3+i] + m[i*3+j] ) * fRoot;
        out[ k ]	= ( m[k*3+i] + m[i*3+k] ) * fRoot;
    }
    return out;
}

export function qFromEuler( x, y, z, order='YXZ', out=[0,0,0,1] ){
    // https://github.com/mrdoob/three.js/blob/dev/src/math/Quat.js

    const c1 = Math.cos( x*0.5 ); //Math.cos(x/2)
    const c2 = Math.cos( y*0.5 ); //Math.cos(y/2),
    const c3 = Math.cos( z*0.5 ); //Math.cos(z/2),
    const s1 = Math.sin( x*0.5 ); //Math.sin(x/2),
    const s2 = Math.sin( y*0.5 ); //Math.sin(y/2)
    const s3 = Math.sin( z*0.5 ); //Math.sin(z/2)

    switch(order){
        case 'XYZ':			
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;
        case 'YXZ':
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;
        case 'ZXY':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;
        case 'ZYX':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;
        case 'YZX':
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;
        case 'XZY':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;
    }

    return qNorm( out, out );
}

/** Using unit vectors, Shortest swing rotation from Direction A to Direction B  */
export function qSwing( a, b, out=[0,0,0,1] ){
    // http://physicsforgames.blogspot.com/2010/03/Quat-tricks.html
    const dot = vDot( a, b );

    if( dot < -0.999999 ){ // 180 opposites
        const tmp = vCross( [-1,0,0], a );
        if( vLen(tmp) < 0.000001 ) vCross( [0,1,0], a, tmp );
        vNorm( tmp, tmp );

        const half = Math.PI * 0.5;
        const s    = Math.sin( half );
        out[ 0 ]   = tmp[ 0 ] * s;
        out[ 1 ]   = tmp[ 1 ] * s;
        out[ 2 ]   = tmp[ 2 ] * s;
        out[ 3 ]   = Math.cos( half );

    }else if( dot > 0.999999 ){ // Same Direction
        out[ 0 ] = 0;
        out[ 1 ] = 0;
        out[ 2 ] = 0;
        out[ 3 ] = 1;
    }else{
        const v  = vCross( a, b );
        out[ 0 ] = v[ 0 ];
        out[ 1 ] = v[ 1 ];
        out[ 2 ] = v[ 2 ];
        out[ 3 ] = 1 + dot;
        qNorm( out, out );
    }

    return out;
}

export function qAxes( q ){
    return [
        qTransform( q, [1,0,0] ),
        qTransform( q, [0,1,0] ),
        qTransform( q, [0,0,1] ),
    ];
}
// #endregion

// #region VECTOR3
export function vLen( a ){ return Math.sqrt( a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2 ); }
export function vLenSq( a ){ return a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2; }
export function vDist( a, b ){ return Math.sqrt( (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2 ); }
export function vDistSq( a, b ){ return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2; }
    
export function vCopy( a, out ){
    out[ 0 ] = a[ 0 ];
    out[ 1 ] = a[ 1 ];
    out[ 2 ] = a[ 2 ];
    return out;
}

export function vCopXYZ( a, out ){
    out[ 0 ] = a.x;
    out[ 1 ] = a.y;
    out[ 2 ] = a.z;
    return out;
}

export function vAdd( a, b, out=[0,0,0] ){
    out[ 0 ] = a[ 0 ] + b[ 0 ];
    out[ 1 ] = a[ 1 ] + b[ 1 ];
    out[ 2 ] = a[ 2 ] + b[ 2 ];
    return out;
}

export function vSub( a, b, out=[0,0,0] ){
    out[ 0 ] = a[ 0 ] - b[ 0 ];
    out[ 1 ] = a[ 1 ] - b[ 1 ];
    out[ 2 ] = a[ 2 ] - b[ 2 ];
    return out;
}

export function vMul( a, b, out=[0,0,0] ){
    out[ 0 ] = a[ 0 ] * b[ 0 ];
    out[ 1 ] = a[ 1 ] * b[ 1 ];
    out[ 2 ] = a[ 2 ] * b[ 2 ];
    return out;
}

export function vDot( a, b ) { return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ]; }

export function vCross( a, b, out=[0,0,0] ){
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];

    out[ 0 ] = ay * bz - az * by;
    out[ 1 ] = az * bx - ax * bz;
    out[ 2 ] = ax * by - ay * bx;
    return out;
}

export function vNorm( v, out=[0,0,0] ){
    let mag = Math.sqrt( v[ 0 ]**2 + v[ 1 ]**2 + v[ 2 ]**2 );
    if( mag == 0 ) return out;

    mag = 1 / mag;
    out[ 0 ] = v[ 0 ] * mag;
    out[ 1 ] = v[ 1 ] * mag;
    out[ 2 ] = v[ 2 ] * mag;
    return out;
}

export function vNegate( a, out=[0,0,0] ){
    out[ 0 ] = -a[ 0 ]; 
    out[ 1 ] = -a[ 1 ];
    out[ 2 ] = -a[ 2 ];
    return out;
}

export function vScale( v, s, out=[0,0,0] ){
    out[0] = v[0] * s;
    out[1] = v[1] * s;
    out[2] = v[2] * s;
    return out;
}

export function vScaleThenAdd( s, v, a, out=[0,0,0] ){
    out[0] = v[0] * s + a[0];
    out[1] = v[1] * s + a[1];
    out[2] = v[2] * s + a[2];
    return out;
}

export function vLerp( a, b, t, out=[0,0,0] ){
    const ti  = 1 - t;
    out[ 0 ] = a[ 0 ] * ti + b[ 0 ] * t;
    out[ 1 ] = a[ 1 ] * ti + b[ 1 ] * t;
    out[ 2 ] = a[ 2 ] * ti + b[ 2 ] * t;
    return out;
}

export function vOrthogonal( fwd, up=[0,1,0] ){
    const zAxis	= fwd.slice();
    const xAxis = vNorm( vCross( up, zAxis ) );     // Right

    // Z & UP are parallel
    if( vLenSq( xAxis ) === 0 ){
        if( Math.abs( up[2] ) === 1 ) zAxis[0] += 0.0001;  // shift x when Fwd or Bak
        else                          zAxis[2] += 0.0001;  // shift z

        vNorm( zAxis, zAxis );      // ReNormalize
        vCross( up, zAxis, xAxis ); // Redo Left
        vNorm( xAxis, xAxis );
    }
    
    const yAxis = vNorm( vCross( zAxis, xAxis ) );  // Up
    return [ xAxis, yAxis, zAxis ];
}

export function vTransformYXZ( p, euler, out=[0,0,0], inDeg=false ){
    const toRad = ( inDeg )? Math.PI / 180 : 1;
    let tX;
    let tY;
    let tZ;

    out[0] = p[0];
    out[1] = p[1];
    out[2] = p[2];

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Z
    const cZ = Math.cos( euler[2] * toRad );
    const sZ = Math.sin( euler[2] * toRad );
    tX       = out[0];
    tY       = out[1];
    out[0]   = tX * cZ - tY * sZ;
    out[1]   = tX * sZ + tY * cZ;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // X
    const cX = Math.cos( euler[0] * toRad );
    const sX = Math.sin( euler[0] * toRad );
    tY       = out[1];
    tZ       = out[2];
    out[1]   = tY * cX - tZ * sX;
    out[2]   = tY * sX + tZ * cX;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Y
    const cY = Math.cos( euler[1] * toRad );
    const sY = Math.sin( euler[1] * toRad );
    tX       = out[0];
    tZ       = out[2];
    out[0]   =  tX * cY + tZ * sY;
    out[2]   = -tX * sY + tZ * cY;

    return out;
}

// #endregion

// #region MATRIX 4X4

const m4Identity = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
];

export function mTransformVec3( m, v, out=[0,0,0] ){
    const x = v[0], y = v[1], z = v[2];
    out[0] = m[0] * x + m[4] * y + m[8]  * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9]  * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
}
    
export function mTransformVec4( m, v, out=[0,0,0,0] ){
    const x = v[0], y = v[1], z = v[2], w = v[3];
    out[0] = m[0] * x + m[4] * y + m[8]  * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9]  * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
}

export function mMul( a, b, out=null ){ 
    const   a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3],
            a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7],
            a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    out = out || m4Identity.slice();

    // Cache only the current line of the second matrix
    let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;	
}

export function mInvert( mat, out=null  ){
    const a00 = mat[0],  a01 = mat[1],  a02 = mat[2],  a03 = mat[3],
          a10 = mat[4],  a11 = mat[5],  a12 = mat[6],  a13 = mat[7],
          a20 = mat[8],  a21 = mat[9],  a22 = mat[10], a23 = mat[11],
          a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

          b00 = a00 * a11 - a01 * a10,
          b01 = a00 * a12 - a02 * a10,
          b02 = a00 * a13 - a03 * a10,
          b03 = a01 * a12 - a02 * a11,
          b04 = a01 * a13 - a03 * a11,
          b05 = a02 * a13 - a03 * a12,
          b06 = a20 * a31 - a21 * a30,
          b07 = a20 * a32 - a22 * a30,
          b08 = a20 * a33 - a23 * a30,
          b09 = a21 * a32 - a22 * a31,
          b10 = a21 * a33 - a23 * a31,
          b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; // Calculate the determinant

    out = out || m4Identity.slice();
    if( !det ) return out;
    det = 1.0 / det;

    out[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

// #endregion