// #region IMPORTS
    import { EventType, LerpType }  from './consts.js';
    import { TrackVec3, TrackQuat } from './Tracks.js';
// #endregion

export default class Clip {
// #region MAIN
    name        = '';          // Clip Name
    frameCount  = 0;           // Total frames in animation
    duration    = 0;           // Total animation time
    timeStamps  = [];          // Different sets of shared time stamps
    tracks      = [];          // Collection of animations broke out as Rotation, Position & Scale
    events      = undefined;   // Collection of animation events
    constructor( name = '' ){ this.name = name; }
// #endregion

// #region EVENTS
    addEvent( name, start, eventType=EventType.Frame, duration=-1 ){
        if( !this.events ) this.events = [];
        this.events.push( new AnimationEvent( name, start, eventType, duration ) );
        return this;
    }
// #endregion

// #region GETTERS / SETTERS
    get fps(){ return Math.round( this.frameCount / this.duration ); }

    fromClip3JS( clip, pose, doFilter=true ){
        let jnt, trk;
        let li, jn, prop, tsIdx;

        this.name = clip.name;

        for( let t of clip.tracks ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            li   = t.name.lastIndexOf( '.' );
            prop = t.name.substr( li+1 );       // property name;
            jn   = t.name.substr( 0, li );      // joint name
            jnt  = pose.getJoint( jn );

            if( !jnt ){
                console.log( `Warning : Clip.fromClip3JS - Track/Joint name not found in pose, ${jn}` );
                continue;
            }

            // Keep a unique list of timestamps for optimization
            tsIdx = this.timeStamps.indexOf( t.times );
            if( tsIdx === -1 ){
                tsIdx = this.timeStamps.length;
                this.timeStamps.push( t.times );
                this.duration   = Math.max( this.duration, t.times[ t.times.length-1 ] );
                this.frameCount = Math.max( this.frameCount, t.times.length );
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Create Track Object
            switch( prop ){
                case 'quaternion' :
                    trk = new TrackQuat(); break;
                case 'position' :
                    if( doFilter && !jnt.isRoot ) continue;
                    trk = new TrackVec3( 'pos' );
                    break;
                case 'scale' :
                    if( doFilter ) continue;
                    trk = new TrackVec3( 'scl' );
                    break;
                default:
                    console.log( `Warning : Clip.fromClip3JS - Track prop name unknown, ${prop}` );
                    continue;
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Set Track Data
            trk.jointIndex = jnt.index;
            trk.timeIndex  = tsIdx;
            trk.values     = t.values;

            switch( t.getInterpolation() ){
                case 2300: trk.lerpType = LerpType.Step; break;     // InterpolateDiscrete
                case 2301: trk.lerpType = LerpType.Linear; break;   // InterpolateLinear
                case 2302: trk.lerpType = LerpType.Cubic; break;    // InterpolateSmooth = CubicInterpolan
                // case 2303: break; // InterpolateBezier
                default:
                    console.log( `Warning : Clip.fromClip3JS - Unknown Lerp Type, ${t.getInterpolation()}` );
                    break;
            }

            this.tracks.push( trk );
        }

        return this;
    }
// #endregion

// #region METHODS
    timeAtFrame( f ){
        // Since there is a chance to have more then one time stamp,
        // use the first one that matches up with the max frame count
        if( f >=0 && f < this.frameCount ){
            for( const ts of this.timeStamps ){
                if( ts.length === this.frameCount ) return ts[ f ];
            }
        }

        return -1;
    }
// #endregion

// #region DEBUG
    debugInfo( pose ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const lerpKeys      = Object.keys( LerpType );
        const getLerpName   = v => lerpKeys.find( k=>LerpType[k] === v );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let bName     = '';
        let trackType = '';

        console.log( 'Clip Name [ %s ] \t Track Count [ %d ] \t Max frames [ %d ]'
            , this.name
            , this.tracks.length
            , this.frameCount
        );

        for( const t of this.tracks ){
            if( pose ) bName = pose.bones[ t.boneIndex ].name;
            if( t instanceof TrackQuat )        trackType = 'quat';
            else if( t instanceof TrackVec3 )   trackType = 'vec3';
            else                                trackType = 'Unknown';

            // console.log( bName, trackType, this.timeStamps[ t.timeIndex ].length, getLerpName( t.lerpType ), t );

            console.log( 'Bone [ %s ] \t Type [ %s ] \t Lerp Type [ %s ] \t Frames [ %d ]'
                , bName
                , trackType
                , getLerpName( t.lerpType )
                , this.timeStamps[ t.timeIndex ].length
            );
        }
    }
// #endregion
}

export class AnimationEvent{
    name     = '';
    type     = EventType.Frame;
    start    = -1;   // Starting Frame or Time
    duration = -1;   // How many frames or seconds this event lasts
    constructor( name, start=0, eventType=EventType.Frame, duration=-1 ){
        this.name     = name;
        this.start    = start;
        this.duration = duration;
        this.type     = eventType;
    }
}
