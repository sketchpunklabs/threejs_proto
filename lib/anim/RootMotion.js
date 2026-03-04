import Vec3 from '../maths/Vec3.js';

export default class RootMotion{
// #region MAIN
    posFirst = [0,0,0];     // Position of First Frame, Used for Wrap Around Velocity Math
    posLast  = [0,0,0];     // Position of Last Frame
    posPrev  = new Vec3();  // Prev Local Position
    posCurr  = new Vec3();  // Current Local Position
    delta    = new Vec3();   // Local delta since last update position

    prevTime   = -Infinity;   // Last action time
    idxJoint   = -1;          // Index to pose joint of motion
    trackIndex = -1;          // Track index of the clip that contains root motion
    rootName   = '';          // Name of root motion joint

    constructor(){}
// #endregion

// #region GETTERS/SETTERS
    forClip( clip, pose, rName=null ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the joint and track that holds the root motion
        const jnt = rName? pose.getJoint( rName ) : pose.getRootJoint();
        if( !jnt ){ console.log( 'Error RootMotion.useClip - Root joint name not found', rName ); return this; }

        const tIdx = clip.findTrackIndex( jnt.name, 'pos' );
        if( tIdx === -1 ){ console.log( 'Error RootMotion.useClip - Can not find root motion track for', jnt.name ); return this; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const trk       = clip.tracks[ tIdx ];
        this.idxJoint   = jnt.index;
        this.rootName   = jnt.name;
        this.trackIndex = tIdx;
        this.prevTime   = -Infinity;

        trk.atIndex(  0, this.posFirst );
        trk.atIndex( -1, this.posLast );
        this.posPrev.copy( this.posFirst );     // Start with no displacement

        // console.log( this.posFirst, this.posLast );
        return this;
    }
// #endregion

// #region METHODS
    // Reset object to start fresh
    reset(){
        this.prevTime = -Infinity;
        this.posPrev.copy( this.posFirst );
        this.posCurr.copy( this.posFirst );
        this.delta.xyz( 0, 0, 0 );
        return this;
    }

    fromSampler( samp ){
        const v = samp.clip.sampleTrackAt( this.trackIndex, samp.clock );
        this.posPrev.copy( v );
        this.posCurr.copy( v );
        this.prevTime = samp.clock;
        return this;
    }
// #endregion

// #region MAIN METHODS
    update( clock, pose ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Shift position data
        this.posPrev.copy( this.posCurr ); // Move to Previous
        this.posCurr.copy( pose.joints[ this.idxJoint ].local.pos );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Continue forward or wrap around
        if( clock < this.prevTime ){
            // NEW LOOP
            // wrap_around = ( curr - first ) + ( last - prev )

            // Delta between last pos in prev loop to last frame
            const deltaEnd = new Vec3();
            deltaEnd.fromSub( this.posLast, this.posPrev );

            // Delta between first pos of new loop from first frame
            this.delta
                .fromSub( this.posCurr, this.posFirst ) // Delta Between curr pos from first frame
                .add( deltaEnd );                       // Add End Delta
        }else{
            // CURRENT LOOP
            this.delta.fromSub( this.posCurr, this.posPrev );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.prevTime = clock; // Keep track of time to know when new loop starts
        return this;
    }

    // Apply delta to object & clear motion from bone
    apply( obj, skel ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Make sure we have the root bone
        if( this.idxJoint === -1 ) return this;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Remove root motion - Creates in place animation
        skel.bones[ this.idxJoint ].position.x = 0;
        skel.bones[ this.idxJoint ].position.z = 0;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Add velocity to 3D object
        obj.position.x += this.delta[0];
        obj.position.z += this.delta[2];

        return this;
    }
// #endregion
}
