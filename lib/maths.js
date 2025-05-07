// #region QUATERNION
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
// #endregion

// #region VECTOR3
export function vLen( a ){ return Math.sqrt( a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2 ); }
export function vLenSq( a ){ return a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2; }
export function vDist( a, b ){ return Math.sqrt( (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2 ); }
export function vDistSq( a, b ){ return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2; }
    
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

export function vScaleThenAdd( s, v, a, out=[0,0,0] ){
    out[0] = v[0] * s + a[0];
    out[1] = v[1] * s + a[1];
    out[2] = v[2] * s + a[2];
    return out;
}
// #endregion