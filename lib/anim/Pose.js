// #region IMPORT
    import Joint        from './Joint.js';
    import Vec3         from '../maths/Vec3.js';
    import Quat         from '../maths/Quat.js';
    import Transform    from '../maths/Transform.js';
    import { Vector3, Quaternion } from 'three';
// #endregion

export default class Pose{
// #region MAIN
    motionIdx   = -1;               // Index of where the root motion comes from
    srcPose     = null;             // Of cloned, original source pose
    nameIdx     = new Map();        // Joint Name to Index Mapping
    joints      = [];               // Collection of joints
    rootOffset  = new Transform();  // Absolute root transform
    poseOffset  = new Transform();  // Offset applied to pose
    constructor( skel=null, aryRoots=null ){
        if( skel ) this.fromSkeleton( skel, aryRoots );
    }
// #endregion

// #region GETTERS / SETTERS
    getJoint( o ){
        switch( typeof o ){
            case 'number': return this.joints[ o ];
            case 'string': {
                const idx = this.nameIdx.get( o );
                return ( idx !== undefined )? this.joints[ idx ] : null;
            }
        }
        return null;
    }

    clone(){
        const p = new Pose();
        p.rootOffset.copy( this.rootOffset );
        p.poseOffset.copy( this.poseOffset );

        for( const j of this.joints ) p.joints.push( j.clone() );

        p.srcPose   = this.srcPose ?? this;
        p.nameIdx   = this.nameIdx; // Ref copy, should never change
        p.motionIdx = this.motionIdx;
        return p;
    }

    copy( a, doAll=false ){
        this.rootOffset.copy( a.rootOffset );
        this.poseOffset.copy( a.poseOffset );

        let aa, oo;
        for( let i=0; i < this.joints.length; i++ ){
            aa = a.joints[ i ].local;
            oo = this.joints[ i ].local;

            oo.rot[0] = aa.rot[0];
            oo.rot[1] = aa.rot[1];
            oo.rot[2] = aa.rot[2];
            oo.rot[3] = aa.rot[3];

            if( doAll ){
                oo.scl[0] = aa.scl[0];
                oo.scl[1] = aa.scl[1];
                oo.scl[2] = aa.scl[2];
            }

            if( doAll || this.joints[ i ].isRoot ){
                oo.pos[0] = aa.pos[0];
                oo.pos[1] = aa.pos[1];
                oo.pos[2] = aa.pos[2];
            }
        }
    }

    setRot( i, rot ){
        const r = this.joints[ i ].local.rot;
        r[0]    = rot[0];
        r[1]    = rot[1];
        r[2]    = rot[2];
        r[3]    = rot[3];
        return this;
    }

    setPos( i, pos ){
        const p = this.joints[ i ].local.pos;
        p[0]    = pos[0];
        p[1]    = pos[1];
        p[2]    = pos[2];
        return this;
    }

    setScl( i, scl ){
        const p = this.joints[ i ].local.scl;
        p[0]    = scl[0];
        p[1]    = scl[1];
        p[2]    = scl[2];
        return this;
    }

    setScalar( i, s ){
        const p = this.joints[ i ].local.scl;
        p[0]    = s;
        p[1]    = s;
        p[2]    = s;
        return this;
    }
// #endregion

// #region METHODS
    reset(){
        if( !this.srcPose ){ console.log( 'Pose.reset - No source available for resetting' ); return; }

        for( let i=0; i < this.joints.length; i++ ){
            this.joints[i].local.copy( this.srcPose.joints[i].local );
        }

        return this;
    }

    // Build pose from threejs skeleton object
    fromSkeleton( skel, aryRoots=null ){
        this.nameIdx.clear();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let j;
        for( const [i, b] of skel.bones.entries() ){
            // console.log( i, b );
            // Create Joint
            j = new Joint().fromBone( b );
            j.index = i;

            // Map Name to Index
            this.nameIdx.set( j.name, j.index );

            // Set joint as root to enable animation on position
            if( aryRoots && aryRoots.includes( j.name ) ){
                j.isRoot = true;
                if( this.motionIdx === -1 ) this.motionIdx = i;
            }

            // Link up parent-child relationshop
            if( ( b.parent && b.parent.isBone ) ){
                j.pindex = this.nameIdx.get( b.parent.name );
                this.joints[ j.pindex ].children.push( j.index );
            }

            this.joints[ i ] = j;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get pose offset transform

        const b = skel.bones[0];
        if( b.parent ){
            const v = new Vector3();
            b.parent.getWorldPosition( v );
            this.poseOffset.pos[ 0 ] = v.x;
            this.poseOffset.pos[ 1 ] = v.y;
            this.poseOffset.pos[ 2 ] = v.z;

            b.parent.getWorldScale( v );
            this.poseOffset.scl[ 0 ] = v.x;
            this.poseOffset.scl[ 1 ] = v.y;
            this.poseOffset.scl[ 2 ] = v.z;

            const q = new Quaternion();
            b.parent.getWorldQuaternion( q );
            this.poseOffset.rot[ 0 ] = q.x;
            this.poseOffset.rot[ 1 ] = q.y;
            this.poseOffset.rot[ 2 ] = q.z;
            this.poseOffset.rot[ 3 ] = q.w;
        }

        this.updateWorld();
    }

    toSkeleton( skel, doFilter=true ){
        let j;
        for( const [i,b] of skel.bones.entries() ){
            j = this.joints[ i ];
            b.quaternion.fromArray( j.local.rot );
            if( !doFilter || j.isRoot ) b.position.fromArray( j.local.pos );
            if( !doFilter )             b.scale.fromArray( j.local.scl );
        }
    }

    fromLerp( a, b, t, doAll=false ){
        let aa, bb, oo;
        for( let i=0; i < a.joints.length; i++ ){
            aa = a.joints[ i ].local;
            bb = b.joints[ i ].local;
            oo = this.joints[ i ].local;

            Quat.nblend( aa.rot, bb.rot, t, oo.rot );
            // Quat.slerp( aa.rot, bb.rot, t, oo.rot );

            if( doAll ) Vec3.lerp( aa.scl, bb.scl, t, oo.scl );
            if( doAll || this.joints[ i ].isRoot ){
                Vec3.lerp( aa.pos, bb.pos, t, oo.pos );
            }
        }
    }
// #endregion

// #region COMPUTE
    updateWorld(){
        for( const j of this.joints ){
            if( j.pindex !== -1 ){
                // Parent Exists
                j.world.fromMul( this.joints[ j.pindex ].world, j.local );
            }else{
                // No Parent, apply any possible offset
                j.world
                    .fromMul( this.rootOffset, this.poseOffset )
                    .mul( j.local );
            }
        }

        return this;
    }

    getWorld( id, out=new Transform() ){
        let joint = this.getJoint( id );

        if( !joint ){
            if( id === -1 ) out.fromMul( this.rootOffset, this.poseOffset );
            else            console.error( 'Pose.getWorld - joint not found', id );
            return out;
        }

        // Work up the heirarchy till the root bone
        out.copy( joint.local );
        while( joint.pindex !== -1 ){
            joint = this.joints[ joint.pindex ];
            out.pmul( joint.local );
        }

        // Add offset
        out .pmul( this.poseOffset )
            .pmul( this.rootOffset );

        return out;
    }
// #endregion

// #region DEBUGGING
    debug( D ){
        const LN = 0x707070;
        const PT = 0x505050;

        let c;
        for( const j of this.joints ){
            D.pnt.add( j.world.pos, PT, 0.7 );
            for( const i of j.children ){
                c = this.joints[ i ];
                D.ln.add( j.world.pos, c.world.pos, LN );
            }
        }
        return this;
    }

    logHierarchy( obj=null, isLast=true, lnPrefix='' ){
        const ln = isLast ? '└─ •' : '├─ •';
        if( !obj ) obj = this.joints[ 0 ];
        console.log( `${lnPrefix}${lnPrefix ? ln : ''} ${obj.name || 'Unnamed'} :: [ ${obj.index} ]` );

        if( obj.children.length > 0 ){
            const cPrefix = lnPrefix + ( isLast ? '   ' : '│  ');
            const cLast   = obj.children.length - 1;

            // for( const [i,c] of obj.children.entries() ){
            for( let i=0; i <= cLast; i++ ){
                this.logHierarchy( this.joints[obj.children[i]], i === cLast, cPrefix );
            }
        }

        return this;
    }
// #endregion
}
