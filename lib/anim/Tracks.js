// #region IMPORTS
    import { LerpType } from './consts.js';
// #endregion


export class TrackVec3{
    // #region MAIN
    jointIndex = -1;            // Bine index in skeleton this track will animate
    timeIndex  = -1;            // Which timestamp array it uses.
    lerpType   = LerpType.Linear;
    values     = null;          // Flat data of animation
    propName   = "";
    constructor( pName="" ){ this.propName = pName; }
    // #endregion

    // #region SETTERS
    setData( data ){
        this.values = new Float32Array( data ); // Clone Data so its not bound to GLTF's BIN
        return this;
    }
    // #endregion

    // #region METHODS
    apply( pose, fi ){
        const jnt = pose.joints[ this.jointIndex ];

        switch( this.lerpType ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Step:
                const i = fi.kB * 3;
                jnt.local.pos[ 0 ] = this.values[ i+0 ];
                jnt.local.pos[ 1 ] = this.values[ i+1 ];
                jnt.local.pos[ 2 ] = this.values[ i+2 ];

                // console.log( jnt.name, fi.kB, this.values[ i+0 ], this.values[ i+1 ], this.values[ i+2 ] );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Linear:
                vbuf_lerp( this.values, fi.kB, fi.kC, fi.t, jnt.local.pos );
                // console.log( 'Linear', jnt.name );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_007_Animations.md#cubic-spline-interpolation
            // case LerpType.Cubic: break;
            default:
                console.log( 'Vec3Track - unknown lerp type', this.lerpType );
                break;
        }

        return this;
    }
    // #endregion
}


export class TrackQuat{
    // #region MAIN
    jointIndex = -1;            // Bine index in skeleton this track will animate
    timeIndex  = -1;            // Which timestamp array it uses.
    lerpType   = LerpType.Linear;
    values     = null;   // Flat data of animation
    constructor(){}
    // #endregion

    // #region SETTERS
    setData( data ){
        this.values = new Float32Array( data ); // Clone Data so its not bound to GLTF's BIN
        return this;
    }
    // #endregion

    // #region METHODS
    apply( pose, fi ){
        const jnt = pose.joints[ this.jointIndex ];

        switch( this.lerpType ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Step:
                const i = fi.kB * 4;
                jnt.local.rot[ 0 ] = this.values[ i+0 ];
                jnt.local.rot[ 1 ] = this.values[ i+1 ];
                jnt.local.rot[ 2 ] = this.values[ i+2 ];
                jnt.local.rot[ 3 ] = this.values[ i+3 ];
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Linear:
                qbuf_nblend( this.values, fi.kB, fi.kC, fi.t, jnt.local.rot );
                // qbuf_slerp( this.values, fi.kB, fi.kC, fi.t, jnt.local.rot );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_007_Animations.md#cubic-spline-interpolation
            // case LerpType.Cubic: break;
            default:
                console.log( 'QuatTrack - unknown lerp type' );
                break;
        }
        return this;
    }
    // #endregion
}

// #region BUFFER HELPERS
    function qbuf_nblend( buf, ai, bi, t, out ){
        ai *= 4;
        bi *= 4;

        // https://physicsforgames.blogspot.com/2010/02/quaternions.html
        const a_x = buf[ ai+0 ];	// Quaternion From
        const a_y = buf[ ai+1 ];
        const a_z = buf[ ai+2 ];
        const a_w = buf[ ai+3 ];
        const b_x = buf[ bi+0 ];	// Quaternion To
        const b_y = buf[ bi+1 ];
        const b_z = buf[ bi+2 ];
        const b_w = buf[ bi+3 ];
        const dot = a_x*b_x + a_y*b_y + a_z*b_z + a_w*b_w;
        const ti  = 1 - t;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // if Rotations with a dot less then 0 causes artifacts when lerping,
        // Can fix this by switching the sign of the To Quaternion.
        const s  = ( dot < 0 )? -1 : 1;

        out[ 0 ] = ti * a_x + t * b_x * s;
        out[ 1 ] = ti * a_y + t * b_y * s;
        out[ 2 ] = ti * a_z + t * b_z * s;
        out[ 3 ] = ti * a_w + t * b_w * s;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Normalize
        let len = out[0]**2 + out[1]**2 + out[2]**2 + out[3]**2;
        if( len > 0 ){
            len      = 1 / Math.sqrt( len );
            out[ 0 ] = out[ 0 ] * len;
            out[ 1 ] = out[ 1 ] * len;
            out[ 2 ] = out[ 2 ] * len;
            out[ 3 ] = out[ 3 ] * len;
        }
    }

    function qbuf_slerp( buf, ai, bi, t, out ){
        ai *= 4;
        bi *= 4;

        // benchmarks: http://jsperf.com/Quat-slerp-implementations
        const ax  = buf[ai+0], ay = buf[ai+1], az = buf[ai+2], aw = buf[ai+3];
        let   bx  = buf[bi+0], by = buf[bi+1], bz = buf[bi+2], bw = buf[bi+3];
        let omega, cosom, sinom, scale0, scale1;

        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;

        // adjust signs (if necessary)
        if ( cosom < 0.0 ) {
            cosom = -cosom;
            bx = - bx;
            by = - by;
            bz = - bz;
            bw = - bw;
        }

        // calculate coefficients
        if ( (1.0 - cosom) > 0.000001 ) {
            // standard case (slerp)
            omega  = Math.acos( cosom );
            sinom  = Math.sin( omega );
            scale0 = Math.sin( ( 1.0 - t ) * omega ) / sinom;
            scale1 = Math.sin( t * omega ) / sinom;
        }else{
            // "from" and "to" Quats are very close so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }

        // calculate final values
        out[ 0 ] = scale0 * ax + scale1 * bx;
        out[ 1 ] = scale0 * ay + scale1 * by;
        out[ 2 ] = scale0 * az + scale1 * bz;
        out[ 3 ] = scale0 * aw + scale1 * bw;
        return out;
    }

    function vbuf_lerp( buf, ai, bi, t, out ){
        const ti  = 1 - t;
        ai *= 3;
        bi *= 3;

        out[ 0 ] = ti * buf[ ai+0 ] + t * buf[ bi+0 ];
        out[ 1 ] = ti * buf[ ai+1 ] + t * buf[ bi+1 ];
        out[ 2 ] = ti * buf[ ai+2 ] + t * buf[ bi+2 ];
        return out;
    }
// #endregion
