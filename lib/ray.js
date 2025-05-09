import { vCopy, vSub, vNorm, vDot, mInvert, mMul, mTransformVec4 } from './maths.js';

export class Ray{
    // #region MAIN
    posStart    = [0,0,0];   // Origin
    posEnd      = [0,0,0];   // 
    direction   = [0,0,0];   // Direction from Start to End
    vecLength   = [0,0,0];   // Vector Length between start to end
    // #endregion

    // #region SETUP
    // fromEndPoints( a, b ){
    //     this.posStart.copy( a );                    // Starting Point of the Ray
    //     this.posEnd.copy( b );                      // The absolute end of the ray
    //     this.vecLength.fromSub( b, a );             // Vector Length
    //     this.direction.fromNorm( this.vecLength );  // Normalized Vector Length 
    //     return this;
    // }

    fromScreenProjection( x, y, w, h, projMatrix, camMatrix ){
        // http://antongerdelan.net/opengl/raycasting.html
        // Normalize Device Coordinate
        const nx  = x / w * 2 - 1;
        const ny  = 1 - y / h * 2;

        // inverseWorldMatrix = invert( ProjectionMatrix * ViewMatrix ) OR
        // inverseWorldMatrix = localMatrix * invert( ProjectionMatrix ) 
        // const invMatrix = new Mat4().fromInvert( projMatrix ).pmul( camMatrix );
        const invMatrix = mInvert( projMatrix );
        mMul( camMatrix, invMatrix, invMatrix );
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // https://stackoverflow.com/questions/20140711/picking-in-3d-with-ray-tracing-using-ninevehgl-or-opengl-i-phone/20143963#20143963
        // Clip Cords would be [nx,ny,-1,1];
        const clipNear   = [ nx, ny, -1, 1 ];
        const clipFar    = [ nx, ny, 1, 1 ];

        // using 4d Homogeneous Clip Coordinates
        // invMatrix.transformVec4( clipNear );
        // invMatrix.transformVec4( clipFar );
        mTransformVec4( invMatrix, clipNear, clipNear );
        mTransformVec4( invMatrix, clipFar, clipFar );

        // Normalize by using W component
        for( let i=0; i < 3; i++){
            clipNear[ i ] /= clipNear[ 3 ];
            clipFar [ i ] /= clipFar [ 3 ];
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Final Compute
        // this.posStart.copy( clipNear );                         // Starting Point of the Ray
        vCopy( clipNear, this.posStart );
        // this.posEnd.copy( clipFar );                            // The absolute end of the ray
        vCopy( clipFar, this.posEnd );
        // this.vecLength.fromSub( this.posEnd, this.posStart );   // Vector Length
        vSub( this.posEnd, this.posStart, this.vecLength );
        // this.direction.fromNorm( this.vecLength );              // Normalized Vector Length
        vNorm( this.vecLength, this.direction );
        return this;
    }

    fromAppEvent( App, e ){
        const size  = App.getSize();                           // Need Size of Canvas
        const mProj = App.camera.projectionMatrix.toArray();   // Need Projection Matrix
        const mCam  = App.camera.matrixWorld.toArray();        // World Space Transform of Camera
        this.fromScreenProjection( e.layerX, e.layerY, size[0], size[1], mProj, mCam );
        return this;
    }
    // #endregion

    // #region GETTERS / SETTERS
    /** Get position of the ray from T Scale of VecLen */
    posAt( t, out=[0,0,0] ){
        // RayVecLen * t + RayOrigin
        // also works lerp( RayOrigin, RayEnd, t )
        out[ 0 ] = this.vecLength[ 0 ] * t + this.posStart[ 0 ];
        out[ 1 ] = this.vecLength[ 1 ] * t + this.posStart[ 1 ];
        out[ 2 ] = this.vecLength[ 2 ] * t + this.posStart[ 2 ];
        return out;
    }

    /** Get position of the ray from distance from origin */
    directionAt( len, out=[0,0,0] ){
        out[ 0 ] = this.direction[ 0 ] * len + this.posStart[ 0 ];
        out[ 1 ] = this.direction[ 1 ] * len + this.posStart[ 1 ];
        out[ 2 ] = this.direction[ 2 ] * len + this.posStart[ 2 ];        
        return out;
    }

    // clone(): Ray{
    //     const r = new Ray();
    //     r.posStart.copy(  this.posStart );
    //     r.posEnd.copy(    this.posEnd );
    //     r.direction.copy( this.direction );
    //     r.vecLength.copy( this.vecLength );   
    //     return r;
    // }
    // #endregion

    // #region OPS
    // transformMat4( m: Mat4 ): this{
    //     this.fromEndPoints( 
    //         m.transformVec3( this.posStart, [0,0,0] ), 
    //         m.transformVec3( this.posEnd,   [0,0,0] ),
    //     );
    //     return this;
    // }
    // #endregion
}

// #region INTERSECTIONS

export function intersectPlane( ray, planePos, planeNorm ){
    // ((planePos - rayOrigin) dot planeNorm) / ( rayVecLen dot planeNorm )
    // pos = t * rayVecLen + rayOrigin;
    const denom = vDot( ray.vecLength, planeNorm );         // Dot product of ray Length and plane normal
    if( denom <= 0.000001 && denom >= -0.000001 ) return null;  // abs(denom) < epsilon, using && instead to not perform absolute.

    const offset = [
        planePos[0] - ray.posStart[0],
        planePos[1] - ray.posStart[1],
        planePos[2] - ray.posStart[2],
    ];

    // ray.posAt( t );
    const t = vDot( offset, planeNorm ) / denom;
    return ( t >= 0 )? t : null;
}

// #endregion