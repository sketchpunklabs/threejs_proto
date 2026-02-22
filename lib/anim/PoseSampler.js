// #region IMPORTS
    // import Maths     from '../maths/Maths';
    // import { TVec3 } from '../maths/Vec3';
// #endregion

export default class PoseSampler{
// #region MAIN
    active          = true;
    clip            = undefined;    // Animation Clip
    clock           = 0;            // Animation Clock
    fInfo           = [];           // Clips can have multiple Timestamps
    scale           = 1;            // Scale the speed of the animation
    onEvent         = undefined;    //
    eventCache      = undefined;
    motionMask      = null;         // Used when inPlace is turned on. Set what to reset.
    looping         = true;

    constructor( clip=null ){
        if( clip ) this.setClip( clip );
    }
// #endregion

// #region SETTERS
    setClip( clip ){
        this.clip           = clip;
        this.clock          = 0;
        this.fInfo.length   = 0;

        // For each set of timesteps, create a frame info struct for it
        for( let i=0; i < clip.timeStamps.length; i++ ){
            this.fInfo.push( new FrameInfo() );
        }

        // Create an event cache if clip has events
        if( clip.events && !this.eventCache ){
            this.eventCache = new Map();
        }

        // Compute the times for the first frame
        this.computeFrameInfo();
        return this;
    }

    setMotionMask( x, y, z ){ this.motionMask = [ x, y, z ]; return this; }

    setScale( s ){ this.scale = s; return this; }
// #endregion

// #region FRAME CONTROLS
    timeStep( dt ){
        if( !this.clip || !this.active ) return true;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const tick      = dt * this.scale;
        let isComplete  = false;    // Did an animation cycle complete

        if( !this.looping && this.clock + tick >= this.clip.duration ){
            this.clock = this.clip.duration;
            isComplete = true;
        }else{
            // Clear event cache if restarting new loop
            if( ( this.clock + tick ) >= this.clip.duration ){
                this.eventCache?.clear();
                isComplete = true;
            }

            this.clock = ( this.clock + tick ) % this.clip.duration;
        }

        this.computeFrameInfo();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this.clip.events  && this.onEvent ) this.checkEvents();

        return isComplete;
    }

    atTime( t ){
        if( !this.clip ) return this;

        this.clock = t % this.clip.duration;
        this.computeFrameInfo();
        return this;
    }

    atFrame( n, t=0 ){
        // NOTE: Custom lerp t to allow half frame rendering by passing in 0.5, useful for debugging

        if( !this.clip ) return this;
        n = Math.max( 0, Math.min( this.clip.frameCount, n ) ); // Clamp frame number

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let tsLen; // TimeStamp Length
        let fi;
        let lastIdx;
        let idx;

        // for( let i=0; i < tsAry.length; i++ ){
        //     ts      = this.clip.timeStamps[ i ];
        //     fi      = this.fInfo[ i ];
        //     tsLen   = ts.length - 1;
        //     fi.t    = 0;
        //     fi.kA   = ( n <= tsLen )? n : tsLen;
        //     fi.kB   = fi.kA;
        //     fi.kC   = fi.kA;
        //     fi.kD   = fi.kA;
        // }

        this.clock = 0;

        for( let i=0; i < this.clip.timeStamps.length; i++ ){
            fi      = this.fInfo[ i ];
            tsLen   = this.clip.timeStamps[i].length;
            lastIdx = tsLen - 1;
            fi.t    = t;
            idx     = Math.min( n, lastIdx );

            switch( idx ){
                // FIRST FRAME ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                case 0:
                    fi.kA       = lastIdx
                    fi.kB       = 0;
                    fi.kC       = 1;
                    fi.kD       = 2;
                    this.clock  = 0;
                    break;
                // LAST FRAME ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                case lastIdx:
                    fi.kA       = mod( lastIdx-2, tsLen );
                    fi.kB       = mod( lastIdx-1, tsLen );
                    fi.kC       = lastIdx;
                    fi.kD       = 0;
                    fi.t        = 1; // Lerp to Final
                    this.clock  = this.clip.duration;
                    break;
                // ANY FRAME ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                default:
                    fi.kB       = idx;
                    fi.kC       = ( idx + 1 ) % tsLen;
                    fi.kA       = mod( fi.kB - 1, tsLen );
                    fi.kD       = ( fi.kC + 1 ) % tsLen;
                    this.clock  = Math.max( this.clock, this.clip.timeStamps[i][idx] );
                    break;
            }

            // console.log( i, fi, lastIdx );
        }

        return this;
    }

    stepFrame( s, t=0 ){
        const fi = self.fInfo[0];
        fIdx = fi.t === 1 ? fi.kC : fi.kB;
        fIdx = ( fIdx + s ) % this.clip.frameCount;
        this.atFrame( fIdx, t );
        return this;
    }
// #endregion

// #region METHODS
    usePlacementReset( mask=[ 0, 1, 0 ] ){ this.placementMask = mask; return this; }

    updatePose( pose ){
        if( !this.clip ) return this;

        let t;
        for( t of this.clip.tracks ){
            t.apply( pose, this.fInfo[ t.timeIndex ] );
        }

        // For inplace animation, reset motion joint
        if( this.motionMask && pose.motionIdx !== -1 ){
            const jnt = pose.joints[ pose.motionIdx ];
            jnt.local.pos[0] *= this.motionMask[0];
            jnt.local.pos[1] *= this.motionMask[1];
            jnt.local.pos[2] *= this.motionMask[2];
        }

        // pose.updateWorld();
        return this;
    }

    // getMotion(){
    //     const rm = this?.clip?.rootMotion;
    //     if( rm ){
    //         const fi = this.fInfo[ rm.timeStampIdx ];
    //         return rm.getBetweenFrames( fi.pkB, fi.pt, fi.kB, fi.t );
    //     }

    //     return null;
    // }
// #endregion

// #region INTERNAL METHODS
    computeFrameInfo(){
        if( !this.clip ) return;

        const time = this.clock;
        let fi;
        let ts;
        let imin;
        let imax;
        let imid;

        for( let i=0; i < this.fInfo.length; i++ ){
            fi = this.fInfo[ i ];

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // This timestamp has only 1 frame, set the default value & exit early
            if( this.clip.timeStamps[ i ].length === 0 ){
                fi.singleFrame();
                continue;
            }

            ts = this.clip.timeStamps[ i ];

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Save previous frame
            fi.pkB = Math.max( fi.kB, 0 ); // Might be -1 to denote animation hasn't started yet
            fi.pt  = fi.t;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // If the clock has moved passed the previous keyframe range, recompute new range
            if( time < ts[ fi.kB ] || time > ts[ fi.kC ] || fi.kB === -1 ){
                // Find the first frame that is greater then the clock time.
                // Do this by using a binary search by shrinking a range of indices
                imin = 0;
                imax = ts.length - 1;
                while( imin < imax ){                         // Once Min Crosses or Equals Max, Stop Loop.
                    imid = ( imin + imax ) >>> 1              // Compute Mid Index
                    if( time < ts[ imid ] ) imax = imid;      // Time is LT Timestamp, use mid as new Max Range
                    else                    imin = imid + 1;  // Time is GTE TimeStamp, move min to one after mid to make the cross fail happen
                }

                if( imax <= 0 ){  fi.kB = 0;      fi.kC = 1; }      // Can't go negative, set to first frame
                else{             fi.kB = imax-1; fi.kC = imax; }   // Our Frame range

                // Tangent keyframe indices need to loop around when dealing with cubic interpolation
                fi.kA = mod( fi.kB - 1, ts.length );
                fi.kD = mod( fi.kC + 1, ts.length );
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Lerp Time
            fi.t  = ( time - ts[ fi.kB ] ) / ( ts[ fi.kC ] - ts[ fi.kB ] ); // Map Time between the Two Time Stamps
        }
    }

    checkEvents(){
        // const fi = this.fInfo[ 0 ];
        if( !this?.clip?.events || !this.onEvent ) return;

        // For every timestamp set...
        for( const fi of this.fInfo ){

            // Check if a marker has been crossed.
            for( const evt of this.clip.events ){
                if( evt.start >= fi.pkB && evt.start < fi.kB && !this.eventCache?.get( evt.name ) ){
                    this.eventCache?.set( evt.name, true );     // Trigger only once per cycle
                    try{
                        this.onEvent( evt.name );
                    }catch( err ){
                        const msg = ( err instanceof Error )? err.message : String( err );
                        console.error( 'Error while calling animation event callback:', msg );
                    }
                    break;
                }
            }

        }
    }
// #endregion
}

export class FrameInfo {
    t   =  0; // Lerp Time
    kA  = -1; // Keyframe Pre Tangent
    kB  = -1; // Keyframe Lerp Start
    kC  = -1; // Keyframe Lerp End
    kD  = -1; // Keyframe Post Tangent

    pkB = 0;  // Previous Lerp Start
    pt  = 0;  // Previous Lerp Time

    // Set info for single frame timeStamp
    singleFrame(){
        this.t   =  1;
        this.kA  =  0;
        this.kB  = -1;
        this.kC  = -1;
        this.kD  =  0;

        this.pkB = 0;
        this.pt  = 0;
    }
}

function mod( a, b ){
    const v = a % b;
    return ( v < 0 )? b + v : v;
}
