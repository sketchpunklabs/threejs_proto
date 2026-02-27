export default class PointerHandlers{
// #region MAIN
    _pointerId     = 0;         // Pointer ID to continue receiving events when mouse leaves canvas or window
    _initCoord     = [ 0, 0 ];  // mouse XY position on mouse down
    _prevCoord     = [ 0, 0 ];  // mouse XY position on last move
    _elm           = null;

    onPointerUp    = null;
    onPointerDown  = null;
    onPointerMove  = null;
    onPointerWheel = null;

    constructor( elm ){ this._elm = elm; }
// #endregion

// #region HELPERS
    /** Compute mouse XY position over the canvas */
    mouseCoord( e, out=[0,0] ){
        // need canvas sceen location & size
        const rect = this._elm.getBoundingClientRect();
        out[ 0 ]   = e.clientX - rect.x;
        out[ 1 ]   = e.clientY - rect.y;
        return out;
    }
// #endregion

// #region EVENT HANDLERS
    _onWheel = e => {
        e.preventDefault();
        e.stopPropagation();
        if( this.onPointerWheel ) this.onPointerWheel( e, e.deltaX, e.deltaY );
    };

    _onPointerDown = e => {
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this._pointerId = e.pointerId;

        this.mouseCoord( e, this._initCoord );
        this._prevCoord[0] = this._initCoord[0];
        this._prevCoord[1] = this._initCoord[1];

        if( this.onPointerDown && !this.onPointerDown( e, this._initCoord ) ) return;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        e.preventDefault();
        e.stopPropagation();
        this._elm.addEventListener( 'pointermove', this._onPointerMove, true );
        this._elm.addEventListener( 'pointerup',   this._onPointerUp,   true );
    };

    _onPointerUp = e => {
        this._elm.releasePointerCapture( this._pointerId );
        this._elm.removeEventListener( 'pointermove', this._onPointerMove, true );
        this._elm.removeEventListener( 'pointerup',   this._onPointerUp,   true );

        if( this.onPointerUp ) this.onPointerUp( e );
    };

    _onPointerMove = e => {
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        e.preventDefault();
        e.stopPropagation();
        this._elm.setPointerCapture( this._pointerId ); // Keep receiving events

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Figure out the current position, change since initial position & velocity of from previous pos.
        const coord = this.mouseCoord( e );
        const delta = [ coord[ 0 ] - this._initCoord[ 0 ], coord[ 1 ] - this._initCoord[ 1 ] ];
        const vel   = [ coord[ 0 ] - this._prevCoord[ 0 ], coord[ 1 ] - this._prevCoord[ 1 ] ];

        this._prevCoord[0] = coord[0];
        this._prevCoord[1] = coord[1];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this.onPointerMove ) this.onPointerMove( e, coord, delta, vel, this._initCoord );
    };

    _onContextMenu = e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
// #endregion

// #region CONTROL LISTENERS
    enable(){
        this._elm.addEventListener( 'wheel',       this._onWheel,       true );
        this._elm.addEventListener( 'pointerdown', this._onPointerDown, true );
        this._elm.addEventListener( 'contextmenu', this._onContextMenu, true );
        // this._elm.addEventListener( 'pointermove', (e)=>{console.log( e )}, true );
        return this;
    }

    disable(){
        if( this._pointerId ) this._elm.releasePointerCapture( this._pointerId );

        this._elm.removeEventListener( 'wheel',       this._onWheel,       true );
        this._elm.removeEventListener( 'pointerdown', this._onPointerDown, true );
        this._elm.removeEventListener( 'pointermove', this._onPointerMove, true );
        this._elm.removeEventListener( 'pointerup',   this._onPointerUp,   true );
        this._elm.removeEventListener( 'contextmenu', this._onContextMenu, true );
        return this;
    }
// #endregion
}
