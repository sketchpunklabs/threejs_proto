import Vec3 from '../maths/Vec3.js';

export default class RootMotion{
// #region MAIN
    posFirst = [0,0,0];     // Position of First Frame, Used for Wrap Around Velocity Math
    posLast  = [0,0,0];     // Position of Last Frame
    posPrev  = new Vec3();  // Prev Local Position
    posCurr  = new Vec3();  // Current Local Position
    delta    = new Vec3();   // Local delta since last update position

    prevTime = -Infinity;   // Last action time
    idxJoint = -1;          // Index to skeleton joint of motion

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
        this.prevTime   = -Infinity;

        trk.atIndex(  0, this.posFirst );
        trk.atIndex( -1, this.posLast );
        this.posPrev.copy( this.posFirst );     // Start with no displacement

        // console.log( this.posFirst, this.posLast );
        return this;
    }
// #endregion

// #region METHODS
    // Reset object to start fresh with the action that has been reset as well.
    // reset(){
    //     this.prevTime = -Infinity;
    //     this.posPrev.copy( this.posFirst );
    //     this.posCurr.copy( this.posFirst );
    //     this.delta.xyz( 0, 0, 0 );
    //     return this;
    // }

    // resetPos(){
    //     // NOTE: resultBuffer can't be trusted when there is weight on the action
    //     // this.posCurr.copy( this.action._interpolants[ this.idxTrack ].resultBuffer );

    //     // actionFramePosition( this.action, this.idxTrack, this.posCurr );
    //     // this.posPrev.copy( this.posCurr );
    //     // this.prevTime = this.action.time;

    //     console.log( 'RESETPOS NOT IMPLEMENTED');
    //     return this;
    // }
// #endregion

// #region MAIN METHODS
    // Compute the current local position & velocity since last update
    // update(){
    //     // if( Ref.i == 86 ) console.log( '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', this.action._clip.name, this.idxTrack );
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     const time = this.action.time;
    //     this.posPrev.copy( this.posCurr );      // Move to Prev
    //     actionFramePosition( this.action, this.idxTrack, this.posCurr );

    //     // this.posCurr.copy( this.action          // Get current pos created by mixer
    //     //     ._interpolants[ this.idxTrack ]
    //     //     .resultBuffer );

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     if( time < this.prevTime ){
    //         // NEW LOOP
    //         // wrap_around = ( curr - first ) + ( last - prev )

    //         // Delta between last pos in prev loop to last frame
    //         const delta = new Vec3();
    //         delta.fromSub( this.posLast, this.posPrev );

    //         // Delta between first pos of new loop from first frame
    //         this.velocity
    //             .fromSub( this.posCurr, this.posFirst ) // Delta Between curr pos from first frame
    //             .add( delta );                          // Add End Delta

    //         // if( Ref.i == 86 ){
    //         //     console.log( 'WRAP-deltaA', delta[2] );
    //         //     console.log( 'WRAP-deltaB', new Vec3().fromSub( this.posCurr, this.posFirst )[2] );
    //         // }
    //     }else{
    //         // CURRENT LOOP
    //         this.velocity.fromSub( this.posCurr, this.posPrev );
    //     }

    //     // if( Ref.i == 86 ){
    //     //     console.log( this.velocity );

    //     //     console.log( 'prev', this.posPrev[2] );
    //     //     console.log( 'curr', this.posCurr[2] );
    //     //     console.log( 'ptime', this.prevTime );
    //     //     console.log( 'time', time );

    //     //     console.log( 'First', this.posFirst[2] );
    //     //     console.log( 'Last', this.posLast[2] );
    //     // }

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     this.prevTime = time;   // Keep track of time to know when new starts
    //     return this;
    // }

    update( clock, pose ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Shift position data
        this.posPrev.copy( this.posCurr ); // Move to Previous;
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
