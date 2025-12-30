export default class Vec3 extends Array{ 
    constructor( v=null ){
        super( 3 );
        if( v?.length === 3 ) this.copy( v );
        else                  this.zero();
    }

    // #region SETTERS
    zero(){
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        return this;
    }

    copy( v ){
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        return this;
    }

    copyTo( v ){
        v[0] = this[0];
        v[1] = this[1];
        v[2] = this[2];
        return this;
    }

    xyz( x, y, z ){
        this[0] = x;
        this[1] = y;
        this[2] = z;
        return this;
    }

    copyObj( o ){
        this[0] = o.x;
        this[1] = o.y;
        this[2] = o.z;
        return this;
    }
    // #endregion

    // #region GETTERS
    get len(){ return Math.sqrt( this[ 0 ]**2 + this[ 1 ]**2 + this[ 2 ]**2 ); }
    get lenSqr(){ return  this[ 0 ]**2 + this[ 1 ]**2 + this[ 2 ]**2; }

    clone(){ return new Vec3( this ); }
    // #endregion

    // #region FROM OPS
    fromAdd( a, b ){
        this[ 0 ] = a[ 0 ] + b[ 0 ];
        this[ 1 ] = a[ 1 ] + b[ 1 ];
        this[ 2 ] = a[ 2 ] + b[ 2 ];
        return this;
    }

    fromSub( a, b ){
        this[ 0 ] = a[ 0 ] - b[ 0 ];
        this[ 1 ] = a[ 1 ] - b[ 1 ];
        this[ 2 ] = a[ 2 ] - b[ 2 ];
        return this;
    }

    fromScale( v, s ){
        this[ 0 ] = v[0] * s;
        this[ 1 ] = v[1] * s;
        this[ 2 ] = v[2] * s;
        return this;
    }

    fromScaleThenAdd( scale, a, b ){
        this[0] = a[0] * scale + b[0];
        this[1] = a[1] * scale + b[1];
        this[2] = a[2] * scale + b[2];
        return this;
    }

    fromNorm( v ){
        let mag = Math.sqrt( v[ 0 ]**2 + v[ 1 ]**2 + v[ 2 ]**2 );
        if( mag == 0 ) return this;

        mag       = 1 / mag;
        this[ 0 ] = v[ 0 ] * mag;
        this[ 1 ] = v[ 1 ] * mag;
        this[ 2 ] = v[ 2 ] * mag;
        return this;
    }

    fromCross( a, b ){
        const ax = a[0], ay = a[1], az = a[2],
              bx = b[0], by = b[1], bz = b[2];

        this[ 0 ] = ay * bz - az * by;
        this[ 1 ] = az * bx - ax * bz;
        this[ 2 ] = ax * by - ay * bx;
        return this;
    }

    fromQuat( q, v=[0,0,1] ){
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3],
              vx = v[0], vy = v[1], vz = v[2],
              x1 = qy * vz - qz * vy,
              y1 = qz * vx - qx * vz,
              z1 = qx * vy - qy * vx,
              x2 = qw * x1 + qy * z1 - qz * y1,
              y2 = qw * y1 + qz * x1 - qx * z1,
              z2 = qw * z1 + qx * y1 - qy * x1;
        this[ 0 ] = vx + 2 * x2;
        this[ 1 ] = vy + 2 * y2;
        this[ 2 ] = vz + 2 * z2;
        return this;
    }

    fromLerp( a, b, t ){
        const ti  = 1 - t;
        this[ 0 ] = a[ 0 ] * ti + b[ 0 ] * t;
        this[ 1 ] = a[ 1 ] * ti + b[ 1 ] * t;
        this[ 2 ] = a[ 2 ] * ti + b[ 2 ] * t;
        return this;
    }

    fromPlaneSnap( pnt, planeNorm, planePos=[0,0,0] ) {
        if( !pnt ) pnt = this;

        // Dot Product between pnt vector & normal
        const dot = 
            ( pnt[0] - planePos[0] ) * planeNorm[0] + 
            ( pnt[1] - planePos[1] ) * planeNorm[1] + 
            ( pnt[2] - planePos[2] ) * planeNorm[2];
    
        // Snap point to plane
        this[0] = pnt[0] - dot * planeNorm[0];
        this[1] = pnt[1] - dot * planeNorm[1];
        this[2] = pnt[2] - dot * planeNorm[2];
    
        return this;
    }

    // #endregion

    // #region OPERATORS
    add( a ){
        this[ 0 ] += a[ 0 ];
        this[ 1 ] += a[ 1 ];
        this[ 2 ] += a[ 2 ];
        return this;
    }

    sub( v ){
        this[ 0 ] -= v[ 0 ];
        this[ 1 ] -= v[ 1 ];
        this[ 2 ] -= v[ 2 ];
        return this;
    }

    mul( v ){
        this[ 0 ] *= v[ 0 ];
        this[ 1 ] *= v[ 1 ];
        this[ 2 ] *= v[ 2 ];
        return this;
    }

    scale( v ){
        this[ 0 ] *= v;
        this[ 1 ] *= v;
        this[ 2 ] *= v;
        return this;
    }

    invScale( v ){
        this[ 0 ] /= v;
        this[ 1 ] /= v;
        this[ 2 ] /= v;
        return this;
    }

    scaleThenAdd( s, v ){
        this[ 0 ] += v[0] * s;
        this[ 1 ] += v[1] * s;
        this[ 2 ] += v[2] * s;
        return this;
    }

    cross( b ){
        const ax = this[0], ay = this[1], az = this[2],
              bx = b[0],    by = b[1],    bz = b[2];

        this[ 0 ] = ay * bz - az * by;
        this[ 1 ] = az * bx - ax * bz;
        this[ 2 ] = ax * by - ay * bx;
        return this;
    }
    
    norm(){
        let mag = Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 );
        if( mag != 0 ){
            mag        = 1 / mag;
            this[ 0 ] *= mag;
            this[ 1 ] *= mag;
            this[ 2 ] *= mag;
        }
        return this;
    }

    negate(){
        this[ 0 ] = -this[ 0 ];
        this[ 1 ] = -this[ 1 ];
        this[ 2 ] = -this[ 2 ];
        return this;
    }

    transformQuat( q ){ 
        const qx = q[ 0 ],    qy = q[ 1 ],    qz = q[ 2 ], qw = q[ 3 ],
              vx = this[ 0 ], vy = this[ 1 ], vz = this[ 2 ],
              x1 = qy * vz - qz * vy,
              y1 = qz * vx - qx * vz,
              z1 = qx * vy - qy * vx,
              x2 = qw * x1 + qy * z1 - qz * y1,
              y2 = qw * y1 + qz * x1 - qx * z1,
              z2 = qw * z1 + qx * y1 - qy * x1;
        this[ 0 ] = vx + 2 * x2;
        this[ 1 ] = vy + 2 * y2;
        this[ 2 ] = vz + 2 * z2;
        return this;
    }

    axisAngle( axis, rad ){
        // Rodrigues Rotation formula:
        // v_rot = v * cos(theta) + cross( axis, v ) * sin(theta) + axis * dot( axis, v) * (1-cos(theta))
        const cp  = new Vec3().fromCross( axis, this ),
              dot = Vec3.dot( axis, this ),
              s   = Math.sin(rad),
              c   = Math.cos(rad),
              ci  = 1 - c;

        this[ 0 ] = this[ 0 ] * c + cp[ 0 ] * s + axis[ 0 ] * dot * ci;
        this[ 1 ] = this[ 1 ] * c + cp[ 1 ] * s + axis[ 1 ] * dot * ci;
        this[ 2 ] = this[ 2 ] * c + cp[ 2 ] * s + axis[ 2 ] * dot * ci;
        return this;
    }
    // #endregion

    // #region STATIC OPS
    static len( a ){ return Math.sqrt( a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2 ); }
    static lenSqr( a ){ return a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2; }

    static dist( a, b ){ return Math.sqrt( (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2 ); }
    static distSqr( a, b ){ return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2; }

    static dot( a, b ) { return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ]; }
    static cross( a, b, out=new Vec3() ){
        const ax = a[0], ay = a[1], az = a[2],
              bx = b[0], by = b[1], bz = b[2];

        out[ 0 ] = ay * bz - az * by;
        out[ 1 ] = az * bx - ax * bz;
        out[ 2 ] = ax * by - ay * bx;
        return out;
    }

    static angle( a, b ){
        //acos(dot(a,b)/(len(a)*len(b))) 
        // const theta = this.dot( a, b ) / ( Math.sqrt( Vec3.lenSqr(a) * Vec3.lenSqr(b) ) );
        // return Math.acos( Math.max( -1, Math.min( 1, theta ) ) ); // clamp ( t, -1, 1 )

        // atan2(len(cross(a,b)),dot(a,b))
        const d = this.dot( a, b ),
              c = this.cross( a, b );
        return Math.atan2( Vec3.len(c), d );

        // This also works, but requires more LEN / SQRT Calls
        // 2 * atan2( ( u * v.len - v * u.len ).len, ( u * v.len + v * u.len ).len );

        //https://math.stackexchange.com/questions/1143354/numerically-stable-method-for-angle-between-3d-vectors/1782769
        // θ=2 atan2(|| ||v||u−||u||v ||, || ||v||u+||u||v ||)

        //let cosine = this.dot( a, b );
        //if(cosine > 1.0) return 0;
        //else if(cosine < -1.0) return Math.PI;
        //else return Math.acos( cosine / ( Math.sqrt( a.lenSqr * b.lenSqr() ) ) );
    }
    
    static look( fwd, up=[0,1,0] ){
        const zAxis	= new Vec3( fwd ).norm()
        const xAxis = new Vec3().fromCross( up, zAxis ).norm() // Right

        // Z & UP are parallel
        if( xAxis.lenSqr === 0 ){
            if( Math.abs( up[2] ) === 1 ){ zAxis[0] += 0.0001; } // shift x when Fwd or Bak
            else{                          zAxis[2] += 0.0001; } // shift z

            zAxis.norm();                        // ReNormalize
            xAxis.fromCross( up, zAxis ).norm(); // Redo Right
        }
        
        const yAxis = new Vec3().fromCross( zAxis, xAxis ).norm(); // Up
        return [ xAxis, yAxis, zAxis ];
    }

    // #endregion
}
