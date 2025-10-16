// https://gabormakesgames.com/blog_transforms_transforms.html
// https://gabormakesgames.com/blog_transforms_transform_world.html

export default class Transform{
    // #region MAIN
    rot	= [0,0,0,1];
    pos	= [0,0,0];
    scl = [1,1,1];
    constructor( rot, pos, scl ){
        if( rot instanceof Transform )  this.copy( rot );
        else if( rot && pos && scl )    this.set( rot, pos, scl );
    }
    // #endregion

    // #region SETTERS / GETTERS
    copy( t ){
        this.rot[0] = t.rot[0];
        this.rot[1] = t.rot[1];
        this.rot[2] = t.rot[2];
        this.rot[3] = t.rot[3];

        this.pos[0] = t.pos[0];
        this.pos[1] = t.pos[1];
        this.pos[2] = t.pos[2];
        
        this.scl[0] = t.scl[0];
        this.scl[1] = t.scl[1];
        this.scl[2] = t.scl[2];
        return this;
    }

    set( r, p, s ){
        if( r ){
            this.rot[0] = r[0];
            this.rot[1] = r[1];
            this.rot[2] = r[2];
            this.rot[3] = r[3];
        }
        if( p ){
            this.pos[0] = p[0];
            this.pos[1] = p[1];
            this.pos[2] = p[2];
        }
        if( s ){
            this.scl[0] = s[0];
            this.scl[1] = s[1];
            this.scl[2] = s[2];
        }
        return this;
    }

    clone(){ return new Transform( this ); }
    // #endregion

    // #region OPERATIONS
    mul( tran ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        const p = [
            this.scl[0] * tran.pos[0],  // Scale
            this.scl[1] * tran.pos[1],
            this.scl[2] * tran.pos[2],
        ];

        qTransform( this.rot, p, p );   // Rotation
        this.pos[0] += p[0];            // Translation
        this.pos[1] += p[1];
        this.pos[2] += p[2];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        this.scl[0] *= tran.scl[0];
        this.scl[1] *= tran.scl[1];
        this.scl[2] *= tran.scl[2];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        qMul( this.rot, tran.rot, this.rot );

        return this;
    }

    // mulInv( tran ){
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
    //     // const p = [
    //     //     tran.pos[0] * this.scl[0],        // Scale
    //     //     tran.pos[1] * this.scl[1],
    //     //     tran.pos[2] * this.scl[2],
    //     // ];

    //     // qTransform( this.rot, p );      // Rotation
    //     // this.pos[0] += p[0];            // Translation
    //     // this.pos[1] += p[1];
    //     // this.pos[2] += p[2];

    //     const p = [
    //         tran.pos[0] + this.pos[0],     
    //         tran.pos[1] + this.pos[1],
    //         tran.pos[2] + this.pos[2],
    //     ];

    //     qTransform( this.rot, p, this.pos );

    //     p[0] *= this.scl[0];
    //     p[1] *= this.scl[1];
    //     p[2] *= this.scl[2];

    //     // this.pos[0] /= this.scl[0];
    //     // this.pos[1] /= this.scl[1];
    //     // this.pos[2] /= this.scl[2];

    //     return this;
    // }

    // Computing Transforms in reverse, Child - > Parent
    pmul( tran ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        // The only difference for this func, We use the IN.scl & IN.rot instead of THIS.scl * THIS.rot
        // Consider that this Object is the child and the input is the Parent.
        
        // Scale
        this.pos[0] *= tran.scl[0];      
        this.pos[1] *= tran.scl[1];
        this.pos[2] *= tran.scl[2];
        
        // Rotation
        qTransform( tran.rot, this.pos, this.pos );  

        // Translation
        this.pos[0] += tran.pos[0];                 
        this.pos[1] += tran.pos[1];
        this.pos[2] += tran.pos[2];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        this.scl[0] *= tran.scl[0];
        this.scl[1] *= tran.scl[1];
        this.scl[2] *= tran.scl[2];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        qMul( tran.rot, this.rot, this.rot ); // Must Rotate from Parent->Child, need PMUL
        return this
    }
    // #endregion

    // #region FROM OPERATORS
    fromMul( tp, tc ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + (  ( parent.scale * child.position ) * parent.rotation )
        const v = [                         // parent.scale * child.position
            tp.scl[0] * tc.pos[0],
            tp.scl[1] * tc.pos[1],
            tp.scl[2] * tc.pos[2],
        ];

        qTransform( tp.rot, v, v );         // * parent.rotation
        this.pos[0] = tp.pos[0] + v[0];     // parent.position +
        this.pos[1] = tp.pos[1] + v[1];
        this.pos[2] = tp.pos[2] + v[2];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        this.scl[0] = tp.scl[0] * tc.scl[0];
        this.scl[1] = tp.scl[1] * tc.scl[1];
        this.scl[2] = tp.scl[2] * tc.scl[2];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        // this.rot.fromMul( tp.rot, tc.rot );
        qMul( tp.rot, tc.rot, this.rot );

        return this;
    }

    fromInvert( t ){
        // Invert Rotation
        qInvert( t.rot, this.rot );

        // Invert Scale
        this.scl[ 0 ] = 1 / t.scl[0];
        this.scl[ 1 ] = 1 / t.scl[1];
        this.scl[ 2 ] = 1 / t.scl[2];

        // NOTE: This doesn't seem to work in practice when 
        // dealing with scaling and dealing with vec3 transform
        // between world > local. Just negate pos seems to work

        // Invert Position : rotInv * ( invScl * -Pos )
        // this.pos
        //     .fromNegate( t.pos )
        //     .mul( this.scl )
        // //         // .transformQuat( this.rot );

        this.pos[0] = -t.pos[0] * this.scl[0];
        this.pos[1] = -t.pos[1] * this.scl[1];
        this.pos[2] = -t.pos[2] * this.scl[2];
        qTransform( this.rot, this.pos, this.pos );

        // this.pos[0] = -t.pos[0];
        // this.pos[1] = -t.pos[1];
        // this.pos[2] = -t.pos[2];

        return this;
    }
    // #endregion

    // #region TRANSFORMATION
    
    // Regular Applying transform, Does not work well for inversed transforms
    // when dealing with World to Local Transformation
    transformVec3( v, out=[0,0,0] ){
        // GLSL - vecQuatRotation(model.rotation, a_position.xyz * model.scale) + model.position;

        // Vector * Scale
        const vx = v[0] * this.scl[0];
        const vy = v[1] * this.scl[1];
        const vz = v[2] * this.scl[2];

        // ( Rotation * Vector3 ) + Translation
        const qx = this.rot[0];
        const qy = this.rot[1];
        const qz = this.rot[2];
        const qw = this.rot[3];
        const x1 = qy * vz - qz * vy;
        const y1 = qz * vx - qx * vz;
        const z1 = qx * vy - qy * vx;
        const x2 = qw * x1 + qy * z1 - qz * y1;
        const y2 = qw * y1 + qz * x1 - qx * z1;
        const z2 = qw * z1 + qx * y1 - qy * x1;

        out[ 0 ]  = ( vx + 2 * x2 ) + this.pos[0]; // + Translation
        out[ 1 ]  = ( vy + 2 * y2 ) + this.pos[1];
        out[ 2 ]  = ( vz + 2 * z2 ) + this.pos[2];

        return out;
    }

    // When using an inversed transform, use this to transform
    // WorldSpace vectors to local space
    transformVec3Rev( v, out=[0,0,0] ){
        // Translation
        const vx = v[0] + this.pos[0];
        const vy = v[1] + this.pos[1];
        const vz = v[2] + this.pos[2];

        // ( Rotation * Vector3 ) * scale
        const qx = this.rot[0];
        const qy = this.rot[1];
        const qz = this.rot[2];
        const qw = this.rot[3];
        const x1 = qy * vz - qz * vy;
        const y1 = qz * vx - qx * vz;
        const z1 = qx * vy - qy * vx;
        const x2 = qw * x1 + qy * z1 - qz * y1;
        const y2 = qw * y1 + qz * x1 - qx * z1;
        const z2 = qw * z1 + qx * y1 - qy * x1;

        out[0]   = ( vx + 2 * x2 ) * this.scl[0];
        out[1]   = ( vy + 2 * y2 ) * this.scl[1];
        out[2]   = ( vz + 2 * z2 ) * this.scl[2];
        return out;
    }

    toLocalPos( wp, out=[0,0,0] ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Invert Transform Rot & Scl
        const qi = qInvert( this.rot );
        const si = [
            1 / this.scl[0],
            1 / this.scl[1],
            1 / this.scl[2],
        ]

        // Invert Transform Pos
        const pi = [
            -this.pos[0] * si[0],
            -this.pos[1] * si[1],
            -this.pos[2] * si[2],
        ];
        qTransform( qi, pi, pi );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Invert Transform on WorldSpace Position
        // invertRot * ( invertScl * WPos ) + invertPos;
        
        const p = [
            si[0] * wp[0],
            si[1] * wp[1],
            si[2] * wp[2],
        ];

        qTransform( qi, p, p );     

        out[0] = pi[0] + p[0];
        out[1] = pi[1] + p[1];
        out[2] = pi[2] + p[2];
        return out;
    }

    toLocalRot( wq, out=[0,0,0,1] ){
        return qMul( qInvert( this.rot ), wq, out );
    }

    // #endregion
}

// #region INDEPENDANCE FROM VEC3/QUAT
function qTransform( q, v, out=[0,0,0] ){ 
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

function qInvert( q, out=[0,0,0,1] ){
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

function qMul( a, b, out=[0,0,0,1] ){
    const ax = a[0], ay = a[1], az = a[2], aw = a[3],
          bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
    out[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
    out[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
    out[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}
// #endregion