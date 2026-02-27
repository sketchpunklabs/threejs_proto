const toRad = Math.PI / 180;
const toDeg = 180 / Math.PI;

export default class CameraMaths{

// #region COORDINATE SYSTEMS
    static spherical2cartesian( lonRad, latRad, radius=1, out=[0,0,0] ){
        const theta = ( lonRad + Math.PI );
        let   phi   = ( 1.5707963267948966 - latRad ); // PI HALF
              phi   = Math.max( 0.000001, Math.min( Math.PI - 0.000001, phi ) );
        const sPhi  = Math.sin( phi );

        out[0] = -(radius * sPhi * Math.sin( theta ));
        out[1] = radius * Math.cos( phi );
        out[2] = -(radius * sPhi * Math.cos( theta ));

        return out;
    }

    static cartesian2spherical( v ){ // returns radians
        const len = Math.sqrt( v[0]**2 + v[2]**2 );
        return [
            Math.atan2( v[0], v[2] ),
            Math.atan2( v[1], len ),
        ];
    }
// #endregion

// #region ORBIT
    static orbitStep( rx, ry, startPos, targetPos=[0,0,0] ){
        // Offset position from target
        const pos = [
            startPos[0] - targetPos[0],
            startPos[1] - targetPos[1],
            startPos[2] - targetPos[2],
        ];
        const dist = Math.sqrt( pos[0]**2 + pos[1]**2 + pos[2]**2 );

        // Convert radians to Degrees to use with spherical coordinates
        // Clamp lat so it doesn't roll to the other side
        const polar = this.cartesian2spherical( pos );
        polar[ 0 ]  = polar[0] * toDeg + rx * 57.2957795131;
        polar[ 1 ]  = Math.min( 89.9999, Math.max( -89.9999, polar[1] * toDeg + ry * 57.2957795131 ) );

        this.spherical2cartesian(
            polar[0] * toRad,
            polar[1] * toRad,
            dist, pos
        );

        // Position from target pos
        pos[0] += targetPos[0];
        pos[1] += targetPos[1];
        pos[2] += targetPos[2];

        return pos;
    }
// #endregion

// #region ZOOM
    /** Set a position from a distance to a target */
    static zoomTarget( pos, target, distance ){
        const dir = [
            pos[0] - target[0],
            pos[1] - target[1],
            pos[2] - target[2],
        ];

        // Normalize direction
        const m = Math.sqrt( dir[0]**2 + dir[1]**2 + dir[2]**2 );
        dir[0] /= m;
        dir[1] /= m;
        dir[2] /= m;

        // Scale direction vector & add to get final zoomed position
        dir[0] = dir[0] * distance + target[0];
        dir[1] = dir[1] * distance + target[1];
        dir[2] = dir[2] * distance + target[2];
        return dir;
    }
// #endregion

// #region LOOK
    /** Use spherical coordinates to set position/rotation of orbit camera */
    static sphericalLook( lon, lat, radius, target=[0,0,0] ){
        const pos   = [0, 0, 0];
        const phi   = ((90 - lat) * Math.PI) / 180;
        const theta = ((lon + 180) * Math.PI) / 180;
        const sPhi  = Math.sin( phi );

        pos[0] = -( radius * sPhi * Math.sin( theta ));
        pos[1] = radius * Math.cos( phi );
        pos[2] = -( radius * sPhi * Math.cos( theta ) );

        const rot = [0,0,0,1];
        if( target ){
            // 1. Rotate camera to look directly at the target
            // 2. Shift position so its aligned to the target
            pos[0] += target[0];
            pos[1] += target[1];
            pos[2] += target[2];
            this.lookAt( pos, target, [0,1,0], rot );
        }

        return [ pos, rot ];
    }

    /** Create a rotation from eye & target position */
    static lookAt( eye, target=[0,0,0], up=[0,1,0], out=[0,0,0,1] ){
        // Forward is inverted, will face correct direction when converted
        // to a ViewMatrix as it'll invert the Forward direction anyway
        const z = vSub( eye, target );
        const x = vCross( up, z );
        const y = vCross( z, x );

        vNorm( x, x );
        vNorm( y, y );
        vNorm( z, z );

        qFromAxes( x, y, z, out );
        return qNorm( out, out );
    }

    /** Compute rotation from a look & up direction */
    static lookDir( dir, up=[0,1,0], out=[0,0,0,1] ){
        const z = dir.slice();
        const x = vCross( up, z );
        const y = vCross( z, x );

        vNorm( x, x );
        vNorm( y, y );
        vNorm( z, z );

        qFromAxes( x, y, z, out );
        return qNorm( out, out );
    }

    // BETTER LOOK FUNCTION, FIX UP TO BE FUNCTIONAL
    // static lookDir( dir, up=[0,1,0], out=[0,0,0,1] ){
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Orthogonal axes to make a mat3x3
    //     const zAxis	= new Vec3( dir );
    //     const xAxis = new Vec3().fromCross( up, zAxis ).norm() // Right

    //     // Z & UP are parallel
    //     if( xAxis.lenSqr === 0 ){
    //         if( Math.abs( up[2] ) === 1 ) zAxis[0] += 0.0001;  // shift x when Fwd or Bak
    //         else                          zAxis[2] += 0.0001;  // shift z

    //         zAxis.norm();                        // ReNormalize
    //         xAxis.fromCross( up, zAxis ).norm(); // Redo Right
    //     }

    //     const yAxis = new Vec3().fromCross( zAxis, xAxis ).norm(); // Up
    //     const m     = [...xAxis, ...yAxis, ...zAxis];

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Mat3 to Quat
    //     // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    //     // article "Quat Calculus and Fast Animation".
    //     let fRoot;
    //     const fTrace = m[0] + m[4] + m[8]; // Diagonal axis

    //     if( fTrace > 0.0 ){
    //         // |w| > 1/2, may as well choose w > 1/2
    //         fRoot	= Math.sqrt( fTrace + 1.0 );  // 2w
    //         this[3]	= 0.5 * fRoot;

    //         fRoot	= 0.5 / fRoot;  // 1/(4w)
    //         this[0]	= (m[5]-m[7])*fRoot;
    //         this[1]	= (m[6]-m[2])*fRoot;
    //         this[2]	= (m[1]-m[3])*fRoot;
    //     }else{
    //         // |w| <= 1/2
    //         let i = 0;
    //         if ( m[4] > m[0] )		i = 1;
    //         if ( m[8] > m[i*3+i] )	i = 2;

    //         const j = (i+1) % 3;
    //         const k = (i+2) % 3;

    //         fRoot	    = Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0);
    //         this[ i ]	= 0.5 * fRoot;
    //         fRoot	    = 0.5 / fRoot;
    //         this[ 3 ]	= ( m[j*3+k] - m[k*3+j] ) * fRoot;
    //         this[ j ]	= ( m[j*3+i] + m[i*3+j] ) * fRoot;
    //         this[ k ]	= ( m[k*3+i] + m[i*3+k] ) * fRoot;
    //     }

    //     return this;
    // }
// #endregion

// #region PANNING
    /** Move camera based on view's UP and RIGHT Axis */
    static screenPan( cPos, cRot, xSteps, ySteps ){
        // Find the screen's UP and RIGHT Direction
        const rit = qTransform( cRot, [1,0,0] );
        const up  = qTransform( cRot, [0,1,0] );

        return [
            cPos[0] + (rit[0] * xSteps) + (up[0] * ySteps),
            cPos[1] + (rit[1] * xSteps) + (up[1] * ySteps),
            cPos[2] + (rit[2] * xSteps) + (up[2] * ySteps),
        ];
    }

    static screenPanStep( cRot, xSteps, ySteps ){
        // Find the screen's UP and RIGHT Direction
        const rit = qTransform( cRot, [1,0,0] );
        const up  = qTransform( cRot, [0,1,0] );

        rit[0] *= xSteps;
        rit[1] *= xSteps;
        rit[2] *= xSteps;

        up[0]  *= ySteps;
        up[1]  *= ySteps;
        up[2]  *= ySteps;

        return [ rit, up ];
    }

    static panStepXZ( cPos, cRot, xSteps, zSteps ){
        const rit = [0, 0, 0];
        const fwd = qTransform( cRot, [0,0,-1] ); // Rotation Forward Axis

        if( Math.abs( vDot( fwd, [0,1,0] ) ) < 0.9999 ){
            vCross( fwd, [0,1,0], rit ); // Right axis clamped to XZ plane
            vCross( [0,1,0], rit, fwd ); // Clamp forward so it XZ plane
        } else {
            // Over at the poles, just compute the UP and Right axes of the camera's rotation
            qTransform( cRot, [0,1,0], fwd );
            qTransform( cRot, [1,0,0], rit );
        }

        // Scale directions & add starting position
        return [
            cPos[0] + fwd[0] * zSteps + rit[0] * xSteps,
            cPos[1] + fwd[1] * zSteps + rit[1] * xSteps,
            cPos[2] + fwd[2] * zSteps + rit[2] * xSteps,
        ];
    }
// #endregion

// #region ROUND AXIS LOOK ( ALIGN LOOK TO NEAREST WORLD AXIS)
    // static roundAxisLook( lookDir, out=[0,0,0] ){
    //     // Get spherical coordinates of the look rotation in radians
    //     const coord = this.cartesian2spherical( lookDir );

    //     // Round the angles to the nearest half pi
    //     const step = Math.PI * 0.5;
    //     coord[ 0 ] = Math.round( coord[ 0 ] / step ) * step;
    //     coord[ 1 ] = Math.round( coord[ 1 ] / step ) * step;

    //     // Convert coords back to a direction then to a rotation
    //     return this.spherical2cartesian( coord[0], coord[1], 1, out );
    // }

    // static roundQuatAxis( q, out=[0,0,0,1] ){
    //     const lookDir = qTransform( q, [0,0,1] );
    //     this.axisDir  = this.roundAxisLook( lookDir );
    //     return this.lookDir( axisDir, out );
    // }
// #endregion

// #region CAMERA SWITCHING
    // Switch from perspective to orthographic
    // static perp2orth( pCam, oCam, targetPos, size ){
    //     const toRad     = Math.PI / 180;
    //     const aspect    = size[0] / size[1];
    //     const camPos    = pCam.position.toArray();

    //     const height    = 2 * Math.tan( pCam.fov * 0.5 * toRad ) * vDist( camPos, targetPos ); // originall vLen( camPos )
    //     const width     = height * aspect;

    //     oCam.left       = -width  * 0.5;
    //     oCam.right      =  width  * 0.5;
    //     oCam.top        =  height * 0.5;
    //     oCam.bottom     = -height * 0.5;
    //     oCam.near       = -10; // There is some clipping, -1 works ok, -10 better
    //     oCam.far        = pCam.far;
    //     oCam.zoom       = 1;

    //     oCam.position.copy( pCam.position );
    //     oCam.quaternion.copy( pCam.quaternion );
    //     oCam.updateProjectionMatrix();
    // }

    // Switch from orthographic to perspective
    // static orth2perp( oCam, pCam, targetPos ){
    //     const camPos    = oCam.position.toArray();
    //     const dir       = vSub( camPos, targetPos );
    //     const dist      = vLen( dir ) * ( 1 / oCam.zoom ); // Original code is just len( camPos ). dir is for target

    //     vNorm( dir, dir );
    //     camPos[0]       = dir[0] * dist + targetPos[0]; // Original code didnt have + targetPos
    //     camPos[1]       = dir[1] * dist + targetPos[1];
    //     camPos[2]       = dir[2] * dist + targetPos[2];

    //     pCam.position.fromArray( camPos );
    //     pCam.quaternion.copy( oCam.quaternion );
    // }
// #endregion

// #region FITTING
    // static fitBoxPerspectiveDistance( camera, width, height, depth, cover=false ){
    //     // Cover tries to fill width more then height
    //     const fov      = camera.getEffectiveFOV() * 0.01745329251; // FOV in Radians
    //     const camRatio = camera.aspect;
    //     const boxRatio = width / height;

    //     const fitSize  = ( cover ? boxRatio > camRatio : boxRatio < camRatio ) ? height : width / camRatio;
    //     return fitSize * 0.5 / Math.tan( fov * 0.5 ) + depth * 0.5;
    // }

    // static fitSpherePerspectiveDistance( camera, radius ){
    //     // https://stackoverflow.com/a/44849975
    //     const vFOV = camera.getEffectiveFOV() * 0.01745329251;
    //     const fov  = ( 1 < camera.aspect )?
    //         vFOV :
    //         Math.atan( Math.tan( vFOV * 0.5 ) * camera.aspect ) * 2; // Horizontal FOV

    //     return radius / Math.sin( fov * 0.5 );
    // }

    // static fitBoxOrthographicZoom( camera, width, height, cover=false ){
    //     const w      = camera.right - camera.left;
    //     const h      = camera.top   - camera.bottom;
    //     return cover ? Math.max( w / width, h / height ) : Math.min( w / width, h / height );
    // }

    // static fitSphereOrthographicZoom( camera, radius ){
    //     const w        = camera.right - camera.left;
    //     const h        = camera.top   - camera.bottom;
    //     const diameter = 2 * radius;
    //     return Math.min( w / diameter, h / diameter );
    // }

    // static fitBox( pos, bMin, bMax, cam, scl=1.2 ){
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     const box  = new AABB( bMin, bMax )
    //         .scale( scl )
    //         .translate( pos );

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     const center = box.getCenter();
    //     const size   = box.getSize();
    //     const dist   = this.fitBoxPerspectiveDistance( cam, size[0], size[1], size[2], false )
    //     const p      = [ // center + fwd * dist
    //         center[0],
    //         center[1],
    //         center[2] + dist,
    //     ];

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     return [ p, center ]; // Camera Pos + Target Pos
    // }

    // static fitSphere( mesh, cam ){
    //     const mSph   = mesh.geometry.boundingSphere;

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     const dist   = fitSpherePerspectiveDistance( cam, mSph.radius );
    //     const center = vAdd( mSph.center.toArray(), mesh.position.toArray() );
    //     const pos    = vScaleThenAdd( dist, [0,0,1], center );
    //     // Debug.pnt.add( p, 0x00ff00, 4 );

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Apply Position & Look roation
    //     cam.position.fromArray( pos );
    //     cam.lookAt( new THREE.Vector3().fromArray( center ) );

    //     App.camCtrl.target.fromArray( center );
    //     App.camCtrl.update();
    // }
// #endregion

// #region MISC
    /** Compute new camera position when switching FOV */
    static switchFov( camPos, targetPos, fromFov, toFov ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const toRad = Math.PI / 180;
        const scl   = Math.tan( fromFov * 0.5 * toRad ) /
                      Math.tan( toFov   * 0.5 * toRad );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // norm( camPos - targetPos )
        const dir = [
            camPos[0] - targetPos[0],
            camPos[1] - targetPos[1],
            camPos[2] - targetPos[2],
        ];

        const dist = Math.sqrt( dir[0]**2 + dir[1]**2 + dir[1]**2 );
        dir[0] /= dist;
        dir[1] /= dist;
        dir[2] /= dist;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const pos = [
            targetPos[0] + dir[0] * dist * scl,
            targetPos[1] + dir[1] * dist * scl,
            targetPos[2] + dir[2] * dist * scl,
        ];

        return [ pos, scl ];
    }
// #endregion

}

// #region VECTOR MATH
    function vCopy( a, out ){
        out[ 0 ] = a[ 0 ];
        out[ 1 ] = a[ 1 ];
        out[ 2 ] = a[ 2 ];
        return out;
    }

    function vSub( a, b, out=[0,0,0] ){
        out[ 0 ] = a[ 0 ] - b[ 0 ];
        out[ 1 ] = a[ 1 ] - b[ 1 ];
        out[ 2 ] = a[ 2 ] - b[ 2 ];
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

    function vDot( a, b ) { return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ]; }

    function vCross( a, b, out=[0,0,0] ){
        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];

        out[ 0 ] = ay * bz - az * by;
        out[ 1 ] = az * bx - ax * bz;
        out[ 2 ] = ax * by - ay * bx;
        return out;
    }
// #endregion

// #region QUATERNION MATH
    function qNorm( a, out=[0,0,0,1] ){
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

    function qFromAxes( xAxis, yAxis, zAxis, out=[0,0,0,1] ){
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
// #endregion
