// #region IMPORTS
    import Vec3         from '../maths/Vec3.js';
    import PoseSampler  from './PoseSampler.js';
    import RootMotion   from './RootMotion.js';
// #endregion

class BlendItem{
    constructor( clip, tOff=0 ){
        this.isActive    = false;
        this.weight      = 1;
        this.timeOffset  = tOff;
        this.clip        = clip;
        this.sampler     = new PoseSampler( clip );
        this.motion      = null;
    }

    set scale( v ){ this.sampler.scale = v; }
    get scale(){ return this.sampler.scale; }

    useRootMotion( pose, rName=null ){
        this.motion = new RootMotion().forClip( this.clip, pose, rName );
        return this;
    }

    // Reset the whole blend item to a fresh start
    reset(){
        this.sampler.clock = this.timeOffset;
        this.motion?.reset();
        return this;
    }

    // Reset root motion to match the clock & position it will be at that time
    resetMotionClock(){ this.motion?.fromSampler( this.sampler ); }

    // Sync this clock to another sampler's clock
    syncClock( bi ){
        // how much time has passed in the other sampler
        const time = ( bi.sampler.clock - bi.timeOffset ) % bi.clip.duration;

        // Normalize the time passed
        const t    = time / bi.clip.duration;

        // Create a time that syncs this clock to the other's sampler's clock.
        this.sampler.clock = this.clip.duration * t + this.timeOffset;
        return this;
    }

    updatePose( pose ){
        this.sampler.updatePose( pose );
        this.motion?.update( this.sampler.clock, pose );
    }
}

export default class BlendSpace1D{
    items       = new Array();  // Animation Stack
    #blend      = 0;            // Blend value

    #pose0      = null;         // 1D sampling maxs out at 2 poses generated.
    #pose1      = null;
    #rootName   = null;         // Joint that will contain motion datra

    #idx0       = 0;            // From index
    #idx1       = 1;            // To index

    delta       = new Vec3();   // Delta distance since last update

    constructor( pose, props={} ){
        // Prepare options
        const opt = { rootName:'', rootMotion:false, ...props };

        // Clone pose for using in sampling
        this.#pose0 = pose.clone();
        this.#pose1 = pose.clone();

        // Setup root motion if its enabled
        if( opt.rootMotion ){
            const jnt = opt.rootName
                ? pose.getJoint( opt.rootName )
                : pose.getRootJoint();

            if( !jnt ){
                console.log( 'Error : BlendSpace1D - Root joint not found, can not enable root motion : ', opt.rootName );
            }else{
                this.#rootName = jnt.name;
            }
        }
    }

    addClip( clip, timeOffset=0 ){
        const itm = new BlendItem( clip, timeOffset );
        this.items.push( itm );

        if( this.#rootName ) itm.useRootMotion( this.#pose0, this.#rootName );

        // Once there are 2 clips, do a blend set to create a starting configuration
        if( this.items.length == 2 ) this.blend = this.#blend;
        return this;
    }

    // #region GETTERS / SETTERS
    set blend( v ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Which samplers top use
        const max   = this.items.length - 1;
        this.#idx0  = Math.min( Math.floor( v ), max ); // Index to starting clip
        this.#idx1  = Math.min( this.#idx0+1, max );    // Index to ending clip
        this.#blend = v;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the overall weight between the samplers
        const a  = this.items[ this.#idx0 ];
        const b  = this.items[ this.#idx1 ];

        b.weight = ( this.#idx0 === this.#idx1 )? 1 : v -  this.#idx0;
        a.weight = 1 - b.weight;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Handle extremes and manage activating samplers

        if( this.#idx0 === this.#idx1 ){
            a.scale     = 1;
            a.weight    = 1;
            a.isActive  = true;
            a.resetMotionClock();

        }else{
            // Set time for newly activated items
            if( a.isActive && !b.isActive ){
                // -----------------------------
                // Blend B into A
                b.reset().syncClock( a );
                console.log( 'B to A' );

            }else if( !a.isActive && b.isActive ){
                // -----------------------------
                // Blend A Into B
                a.reset().syncClock( b );
                console.log( 'A to B' );

            }else if( !a.isActive && !b.isActive ){
                // -----------------------------
                // No syncing, start both at the same time
                a.reset();
                b.reset();
                console.log( 'RESET BOTH' );
            }

            // -----------------------------
            // Compute weight sync with time scale
            const dur  = a.clip.duration * a.weight + b.clip.duration * b.weight; // Get Weighted Duration

            // Scale animation speed to make the clips "duration" match based on the weighting
            a.scale    = a.clip.duration / dur;
            b.scale    = b.clip.duration / dur;

            // Set items as active
            a.isActive = true;
            b.isActive = true;

            // -----------------------------
            // Need to reset root motions if enabled
            if( this.#rootName != null ){
                a.resetMotionClock()
                b.resetMotionClock();
            }
        }

        // console.log( 'Blend', v, 'Idx0', this.#idx0, 'Idx1', this.#idx1, 'aWgt', a.weight, 'bWgt', b.weight, 'aScl', a.scale, 'bScl', b.scale );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Disable items not beiing blended
        for( const [i,e] of this.items.entries() ){
            if( i !== this.#idx0 && i !== this.#idx1 ) e.isActive = false;
        }
    }
    // #endregion

    // #region SAME CONTROL API AS SAMPLER
    // Move Animation forward
    timeStep( dt ){
        this.items[ this.#idx0 ].sampler.timeStep( dt );

        // Avoid running extremes else it will run the sampler twice
        if( this.#idx0 != this.#idx1 ) this.items[ this.#idx1 ].sampler.timeStep( dt );

        return this;
    }

    // Compute a blended pose between two active samplers
    updatePose( pose ){
        if( this.#idx0 === this.#idx1 ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // NO BLENDING : At Extreme, only need to run a single sampler & no blending
            const a = this.items[ this.#idx0 ];
            a.updatePose( pose );

            // Run motion if available
            if( a.motion ) this.delta.copy( a.motion.delta );

        }else{
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // BLENDING

            // Two samplers selected, compute two poses & blend them
            const a = this.items[ this.#idx0 ];
            const b = this.items[ this.#idx1 ];

            a.updatePose( this.#pose0 );
            b.updatePose( this.#pose1 );

            pose.fromLerp( this.#pose0, this.#pose1, b.weight );

            // Run motion if available
            if( a.motion && b.motion ){
                this.delta.fromLerp( a.motion.delta, b.motion.delta, b.weight );
            }
        }

        return pose;
    }
}
