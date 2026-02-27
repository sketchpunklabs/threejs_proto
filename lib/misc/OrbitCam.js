import { PerspectiveCamera, OrthographicCamera } from 'three';
import CameraMaths      from '../maths/CameraMaths.js';
import PointerHandlers  from './PointerHanders.js';

export default class OrbitCam{
// #region MAIN
    camera      = null;
    canvas      = null;
    pointer     = null;     // Mouse event handler

    panScale    = 1.0;      // Stepping scale
    zoomScale   = 0.8;      // Zoom scale for scroll wheel

    _target     = [0,0,0];  // Target position
    _initTarget = null;     // On mouse down cached data
    _initPos    = null;
    _initRot    = null;
    _initBtn    = 0;

    _camPersp   = new PerspectiveCamera( 45, 1, 0.01, 1000 );
    _camOrtho   = new OrthographicCamera( -1, 1, 1, -1, -10, 1000 );

    _followObj  = null;
    _followDamp = null;
    _followOff  = null;

    constructor( renderer=null ){
        this.camera = this._camPersp;
        this._camPersp.rotation.reorder('YXZ');
        this._camOrtho.rotation.reorder('YXZ');

        if( renderer ) this.init( renderer );
    }

    init( renderer ){
        this.canvas = renderer.domElement;

        // Setup Perspective Camera
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();

        // Setup Mouse Events
        this.pointer = new PointerHandlers( this.canvas ).enable();
        this.pointer.onPointerDown  = this.onPointerDown;
        this.pointer.onPointerMove  = this.onPointerMove;
        this.pointer.onPointerWheel = this.onPointerWheel;

        return this;
    }

    static use( App ){
        const cam = new OrbitCam( App.renderer );
        App.camera = cam.camera;
        return cam;
    }
// #endregion

// #region GETTERS / SETTERS
    set enabled( b ){
        if( b ) this.pointer.enabled();
        else    this.pointer.disable();
    }

    _updateLook(){ this.rot = CameraMaths.lookAt( this.pos, this._target, [0,1,0] ); }

    get pos(){ return this.camera.position.toArray(); }
    set pos( v ){ this.camera.position.fromArray( v ); this._updateLook(); }

    get rot(){ return this.camera.quaternion.toArray(); }
    set rot( v ){ this.camera.quaternion.fromArray( v ); }

    get target(){ return this._target.slice(); }
    set target( v ){
        // Delta target change
        const delta = [
            v[0] - this._target[0],
            v[1] - this._target[1],
            v[2] - this._target[2],
        ];

        // Apply delta to camera
        this.camera.position.x += delta[0];
        this.camera.position.y += delta[1];
        this.camera.position.z += delta[2];

        // Save
        this._target[0] = v[0];
        this._target[1] = v[1];
        this._target[2] = v[2];
    }

    set distance( v ){ this.camera.position.fromArray( CameraMaths.zoomTarget( this.pos, this._target, v ) ); }

    get canvasSize(){ return [this.canvas.clientWidth,this.canvas.clientHeight]; }
// #endregion

// #region PERSPECTIVE / ORTHO
    getProjDistScale( startPos=null ){
        // Camera Distance = length( cameraPos - targetPos )
        // Camera distance * Focal Length / Viewport Height
        const a    = this.pos;
        const b    = startPos || this.target;
        const dist = Math.sqrt(
            ( a[0] - b[0] ) ** 2 +
            ( a[1] - b[1] ) ** 2 +
            ( a[2] - b[2] ) ** 2 );

        return dist * Math.tan( ( this._camPersp.getEffectiveFOV() * 0.5 ) * 0.01745329251 ) / this.canvas.clientHeight;
    }

    get isOrtho(){ return !!this.camera.isOrthographicCamera; }
    get orthoHScale(){ return ( this.camera.top - this.camera.bottom ) / this.camera.zoom / this.canvas.clientHeight; }
    get orthoWScale(){ return ( this.camera.right - this.camera.left ) / this.camera.zoom / this.canvas.clientWidth; }

    // useOrtho( turnOn ){
    //     if( turnOn && !this.camera.isOrthographicCamera ){
    //         CameraMaths.perp2orth( this._camPersp, this._camOrtho, this._target, this.canvasSize );
    //         this.camera = this._camOrtho;

    //     }else if( !turnOn && this.camera.isOrthographicCamera ){
    //         CameraMaths.orth2perp( this._camOrtho, this._camPersp, this._target );
    //         this.camera = this._camPersp;
    //     }
    //     return this;
    // }
// #endregion

// #region EVENTS
    onPointerWheel = ( e, dx, dy )=>{ this.stepZoom( this.zoomScale * Math.sign(dy) ); };

    onPointerDown = ( e, coord )=>{
        this._initPos    = this.pos;
        this._initRot    = this.rot;
        this._initTarget = this.target;
        this._initBtn    = e.button; // Can't get button number during pointer_move, save it on down
        return true;
    };

    onPointerMove = ( e, coord, delta, vel )=>{
        switch( this._initBtn ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Left Click
            case 0:
                if( e.shiftKey ){
                    // Screen Panning
                    this.stepScreenPan( -delta[0], delta[1], this._initTarget );
                }else{
                    // Orbit around the target
                    this.stepOrbit( -delta[0], delta[1], 1.0, 1.0, this._initPos );
                }
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Right Click
            case 2:
                break;
        }
    };
// #endregion

// #region CAMERA OPERATIONS
    sphericalLook( lon, lat, radius, target=null ){
        if( target ){
            this._target[0] = target[0];
            this._target[1] = target[1];
            this._target[2] = target[2];
        }

        const [ pos, rot ] = CameraMaths.sphericalLook( lon, lat, radius, this._target );
        this.camera.position.fromArray( pos );      // Dont use Setter as it'll update rotation
        this.camera.quaternion.fromArray( rot );

        return this;
    };

    stepOrbit( dx, dy, sx=1, sy=1, startPos=this.pos ){ // deltaXY, scaleXY, Current Camera Position
        // Delta * Degrees then scaled by canvas height, this makes it possible
        // to rotate a whole X degrees from center to edge of screen
        const rx  = ( dx * Math.PI * sx ) / this.canvas.clientHeight;
        const ry  = ( dy * Math.PI * sy ) / this.canvas.clientHeight;
        this.pos  = CameraMaths.orbitStep( rx, ry, startPos, this._target );
        return this;
    }

    stepScreenPan( dx, dy, startPos=this.target ){
        let x = 0;
        let y = 0;
        if( !this.camera.isOrthographicCamera ){
            const scl = this.getProjDistScale( startPos );
            x = dx * this.panScale * scl;
            y = dy * this.panScale * scl;
        }else{
            x = dx * this.orthoWScale;
            y = dy * this.orthoHScale;
        }

        this.target = CameraMaths.screenPan( startPos, this.rot, x, y );
        return this;
    }

    stepZoom( t ){
        if( !this.camera.isOrthographicCamera ){
            const tick = Math.sign( t );
            const scl  = Math.abs( t );
            const pos  = this.pos;
            const dist = Math.sqrt(
                ( pos[0] - this._target[0] )**2 +
                ( pos[1] - this._target[1] )**2 +
                ( pos[2] - this._target[2] )**2
            );

            // Zoom In : dist * scl,  Zoom out : dist / scl
            this.distance = ( tick === -1 )? dist * scl : dist / scl;
        }else{
            const c     = this.camera;
            const scl   = Math.abs( t );
            const z     = ( t < 0 )? c.zoom / scl : c.zoom * scl;
            c.zoom = Math.max( 0.000001, z );
            c.updateProjectionMatrix();
        }
    }
// #endregion

// #region FOLLOW OBJ
    async followObj( obj, prop={} ){
        const mod = await import('../maths/springs/VImplicitEuler.js');

        this._followObj  = obj;
        this._followDamp = new mod.default( prop );
        this._followOff  = prop.offset ?? [0,0,0];

        // Set iniitial value to start with
        const val = this._followDamp.value;
        val[0]    = this._followObj.position.x + this._followOff[0];
        val[1]    = this._followObj.position.y + this._followOff[1];
        val[2]    = this._followObj.position.z + this._followOff[2];
    }

    follow( dt ){
        if( !this._followObj ) return;

        // avoiding a vec3/array object, get target reference and update data directly
        const tar = this._followDamp.target;
        tar[0]    = this._followObj.position.x + this._followOff[0];
        tar[1]    = this._followObj.position.y + this._followOff[1];
        tar[2]    = this._followObj.position.z + this._followOff[2];

        this._followDamp.update( dt );
        this.target = this._followDamp.value; // There is jitter at times
        // this.target = tar;  // NO JITTER when not using a spring
    }
// #endregion

}
