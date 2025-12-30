import Vec3 from './Vec3.js';

export default class Quat extends Array{
    constructor( v=null ){
        super( 4 );
        if( v?.length === 4 ) this.copy( v );
        else                  this.identity();
    }

    // #region SETTERS
    identity(){
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this[3] = 1;
        return this;
    }

    copy( v ){
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        this[3] = v[3];
        return this;
    }

    copyTo( v ){
        v[0] = this[0];
        v[1] = this[1];
        v[2] = this[2];
        v[3] = this[3];
        return this;
    }

    copyObj( o ){
        this[0] = o.x;
        this[1] = o.y;
        this[2] = o.z;
        this[3] = o.w;
        return this;
    }
    // #endregion

    // #region GETTERS
    clone(){ return new Quat( this ); }
    // #endregion

    // #region OPERATIONS
    /** Multiple Quaternion onto this Quaternion */
    mul( q ){
        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bx = q[0],    by = q[1],    bz = q[2],    bw = q[3];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    /** PreMultiple Quaternions onto this Quaternion */
    pmul( q ){
        const ax = q[0],    ay  = q[1],     az = q[2],    aw = q[3],
              bx = this[0], by  = this[1],  bz = this[2], bw = this[3];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    norm(){
        let len =  this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2;
        if( len > 0 ){
            len = 1 / Math.sqrt( len );
            this[ 0 ] *= len;
            this[ 1 ] *= len;
            this[ 2 ] *= len;
            this[ 3 ] *= len;
        }
        return this;
    }

    invert(){
        const a0  = this[ 0 ],
              a1  = this[ 1 ],
              a2  = this[ 2 ],
              a3  = this[ 3 ],
              dot = a0*a0 + a1*a1 + a2*a2 + a3*a3;
        
        if(dot == 0){ this[0] = this[1] = this[2] = this[3] = 0; return this }

        const invDot = 1.0 / dot; // let invDot = dot ? 1.0/dot : 0;
        this[ 0 ]    = -a0 * invDot;
        this[ 1 ]    = -a1 * invDot;
        this[ 2 ]    = -a2 * invDot;
        this[ 3 ]    =  a3 * invDot;
        return this;
    }
    // #endregion

    // #region SPECIAL OPERATORS
    /** Inverts the quaternion passed in, then pre multiplies to this quaternion. */
    pmulInvert( q ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // q.invert()
        let ax = q[ 0 ],	
            ay = q[ 1 ],
            az = q[ 2 ],
            aw = q[ 3 ];

        const dot = ax*ax + ay*ay + az*az + aw*aw;

        if( dot === 0 ){
            ax = ay = az = aw = 0;
        }else{
            const dot_inv = 1.0 / dot;
            ax = -ax * dot_inv;
            ay = -ay * dot_inv;
            az = -az * dot_inv;
            aw =  aw * dot_inv;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.mul( a, b );
        const bx = this[ 0 ],	
              by = this[ 1 ],
              bz = this[ 2 ],
              bw = this[ 3 ];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }


    pmulAxisAngle( axis, rad ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.AxisAngle()
        const half = rad * 0.5;
        const s    = Math.sin( half );
        const ax   = axis[ 0 ] * s;
        const ay   = axis[ 1 ] * s;
        const az   = axis[ 2 ] * s;
        const aw   = Math.cos( half );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.mul( a, b );
        const bx = this[ 0 ],	
              by = this[ 1 ],
              bz = this[ 2 ],
              bw = this[ 3 ];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    pmulSwing( a, b ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // fromSwing
        const dot = Vec3.dot( a, b );
        if( dot < -0.999999 ){ // 180 opposites
            const tmp = new Vec3().fromCross( [-1,0,0], a );

            if( tmp.len < 0.000001 ) tmp.fromCross( [0,1,0], a );
            this.pmulAxisAngle( tmp.norm(), Math.PI );
            return this;

        }else if( dot > 0.999999 ){ // Same Direction
            return this; // Creates identity, so exist early
        }

        const v = Vec3.cross( a, b, [0,0,0] );
        let ax  = v[0];	
        let ay  = v[1];
        let az  = v[2];
        let aw  = 1 + dot;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Normalize
        let len =  ax**2 + ay**2 + az**2 + aw**2;
        if( len > 0 ){
            len = 1 / Math.sqrt( len );
            ax *= len;
            ay *= len;
            az *= len;
            aw *= len;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Dot Negate
        const dot2 = this[0] * ax + this[1] * ay + this[2] * az + this[3] * aw;
        if( dot2 < 0 ){
            ax = -ax;
            ay = -ay;
            az = -az;
            aw = -aw;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.mul( a, b );
        const bx = this[ 0 ],	
              by = this[ 1 ],
              bz = this[ 2 ],
              bw = this[ 3 ];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;

        return this;
    }

    dotNegate( chk ){
        // quat.dot
        const dot = this[0] * chk[0] + 
                    this[1] * chk[1] + 
                    this[2] * chk[2] + 
                    this[3] * chk[3];

        if( dot < 0 ){
            // quat.negate
            this[0] = -this[0];
            this[1] = -this[1];
            this[2] = -this[2];
            this[3] = -this[3];
        }
        
        return this;
    }
    // #endregion

    // #region FROM OPS
    fromMul( a, b ){
        const ax = a[0], ay = a[1], az = a[2], aw = a[3],
              bx = b[0], by = b[1], bz = b[2], bw = b[3];

        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    fromInvert( q ){
        const a0  = q[ 0 ],
              a1  = q[ 1 ],
              a2  = q[ 2 ],
              a3  = q[ 3 ],
              dot = a0*a0 + a1*a1 + a2*a2 + a3*a3;
        
        if(dot == 0){ this[0] = this[1] = this[2] = this[3] = 0; return this }

        const invDot = 1.0 / dot; // let invDot = dot ? 1.0/dot : 0;
        this[ 0 ]    = -a0 * invDot;
        this[ 1 ]    = -a1 * invDot;
        this[ 2 ]    = -a2 * invDot;
        this[ 3 ]    =  a3 * invDot;
        return this;
    }

    fromPolar( lon, lat, up=null ){
        lat = Math.max( Math.min( lat, 89.999999 ), -89.999999 ); // Clamp lat, going to 90+ makes things spring around.

        const phi   = ( 90 - lat ) * 0.01745329251, // PI / 180
              theta = lon * 0.01745329251,
              phi_s	= Math.sin( phi ),
              v    = [
                -( phi_s * Math.sin( theta ) ),
                Math.cos( phi ),
                phi_s * Math.cos( theta )
            ];

        this.fromLook( v, up || [0,1,0] );
        return this;
    }

    fromLookOLD( dir, up = [0,1,0] ){
        // Ported to JS from C# example at https://pastebin.com/ubATCxJY
        // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
        const zAxis	= new Vec3( dir ).norm();                       // Forward
        const xAxis = new Vec3().fromCross( up, zAxis ).norm();     // Right
        const yAxis = new Vec3().fromCross( zAxis, xAxis ).norm();  // Up

        // fromAxis - Mat3 to Quat
        const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2],
              m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2],
              m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2],
              t   = m00 + m11 + m22;

        let x, y, z, w, s;

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

        this[ 0 ] = x;
        this[ 1 ] = y;
        this[ 2 ] = z;
        this[ 3 ] = w;
        return this;
    }

    fromLook( fwd, up=[0,1,0] ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Orthogonal axes to make a mat3x3
        const zAxis	= new Vec3( fwd );
        const xAxis = new Vec3().fromCross( up, zAxis ).norm() // Right

        // Z & UP are parallel
        if( xAxis.lenSqr === 0 ){
            if( Math.abs( up[2] ) === 1 ) zAxis[0] += 0.0001;  // shift x when Fwd or Bak
            else                          zAxis[2] += 0.0001;  // shift z

            zAxis.norm();                        // ReNormalize
            xAxis.fromCross( up, zAxis ).norm(); // Redo Right
        }
        
        const yAxis = new Vec3().fromCross( zAxis, xAxis ).norm(); // Up
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
            this[3]	= 0.5 * fRoot;
            
            fRoot	= 0.5 / fRoot;  // 1/(4w)
            this[0]	= (m[5]-m[7])*fRoot;
            this[1]	= (m[6]-m[2])*fRoot;
            this[2]	= (m[1]-m[3])*fRoot;
        }else{
            // |w| <= 1/2
            let i = 0;
            if ( m[4] > m[0] )		i = 1;
            if ( m[8] > m[i*3+i] )	i = 2;
            
            const j = (i+1) % 3;
            const k = (i+2) % 3;

            fRoot	    = Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0);
            this[ i ]	= 0.5 * fRoot;
            fRoot	    = 0.5 / fRoot;
            this[ 3 ]	= ( m[j*3+k] - m[k*3+j] ) * fRoot;
            this[ j ]	= ( m[j*3+i] + m[i*3+j] ) * fRoot;
            this[ k ]	= ( m[k*3+i] + m[i*3+k] ) * fRoot;
        }

        return this;
    }

    /** Using unit vectors, Shortest swing rotation from Direction A to Direction B  */
    fromSwing( a, b ){
        // http://physicsforgames.blogspot.com/2010/03/Quat-tricks.html
        const dot = Vec3.dot( a, b );

        if( dot < -0.999999 ){ // 180 opposites
            const tmp = new Vec3().fromCross( [-1,0,0], a );

            if( tmp.len < 0.000001 ) tmp.fromCross( [0,1,0], a );
            this.fromAxisAngle( tmp.norm(), Math.PI );

        }else if( dot > 0.999999 ){ // Same Direction
            this[ 0 ] = 0;
            this[ 1 ] = 0;
            this[ 2 ] = 0;
            this[ 3 ] = 1;

        }else{
            const v   = Vec3.cross( a, b, [0,0,0] );
            this[ 0 ] = v[ 0 ];
            this[ 1 ] = v[ 1 ];
            this[ 2 ] = v[ 2 ];
            this[ 3 ] = 1 + dot;
            this.norm();
        }

        return this;
    }

    /** Axis must be normlized, Angle in Radians  */
    fromAxisAngle( axis, rad ){ 
        const half = rad * 0.5;
        const s    = Math.sin( half );
        this[ 0 ]  = axis[ 0 ] * s;
        this[ 1 ]  = axis[ 1 ] * s;
        this[ 2 ]  = axis[ 2 ] * s;
        this[ 3 ]  = Math.cos( half );
        return this;
    }

    fromAxes( xAxis, yAxis, zAxis ){
        const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2],
              m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2],
              m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2],
              t = m00 + m11 + m22;
        let x, y, z, w, s;

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

        this[ 0 ] = x;
        this[ 1 ] = y;
        this[ 2 ] = z;
        this[ 3 ] = w;
        return this;
    }
    // #endregion

    // #region ROTATIONS
    rotX( rad ){
        //https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bx = Math.sin(rad), bw = Math.cos(rad);

        this[0] = ax * bw + aw * bx;
        this[1] = ay * bw + az * bx;
        this[2] = az * bw - ay * bx;
        this[3] = aw * bw - ax * bx;
        return this;
    }

    rotY( rad ){
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              by = Math.sin(rad), bw = Math.cos(rad);

        this[0] = ax * bw - az * by;
        this[1] = ay * bw + aw * by;
        this[2] = az * bw + ax * by;
        this[3] = aw * bw - ay * by;
        return this;
    }

    rotZ( rad ){
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bz = Math.sin(rad),
              bw = Math.cos(rad);

        this[0] = ax * bw + ay * bz;
        this[1] = ay * bw - ax * bz;
        this[2] = az * bw + aw * bz;
        this[3] = aw * bw - az * bz;
        return this;
    }
    // #endregion

    // #region CONVERT
    fromMat3( m ){
        // https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js#L305
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quat Calculus and Fast Animation".
        let fRoot;
        const fTrace = m[0] + m[4] + m[8];

        if( fTrace > 0.0 ){
            // |w| > 1/2, may as well choose w > 1/2
            fRoot	= Math.sqrt( fTrace + 1.0 );  // 2w
            this[3]	= 0.5 * fRoot;
            
            fRoot	= 0.5 / fRoot;  // 1/(4w)
            this[0]	= (m[5]-m[7])*fRoot;
            this[1]	= (m[6]-m[2])*fRoot;
            this[2]	= (m[1]-m[3])*fRoot;
        }else{
            // |w| <= 1/2
            let i = 0;

            if ( m[4] > m[0] )		i = 1;
            if ( m[8] > m[i*3+i] )	i = 2;
            
            const j = (i+1) % 3;
            const k = (i+2) % 3;

            fRoot	= Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0);
            this[ i ]	= 0.5 * fRoot;

            fRoot	= 0.5 / fRoot;
            this[ 3 ]	= ( m[j*3+k] - m[k*3+j] ) * fRoot;
            this[ j ]	= ( m[j*3+i] + m[i*3+j] ) * fRoot;
            this[ k ]	= ( m[k*3+i] + m[i*3+k] ) * fRoot;
        }
        return this;
    }
    // #endregion
}
