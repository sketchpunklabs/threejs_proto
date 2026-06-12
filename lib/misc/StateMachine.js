export class StateMachine{
    // #region MAIN
    list  = {};   // Collection of registered state machines
    stack = [];   // Stack of active state machines
    obj   = null;

    constructor( obj ){
        this.obj = obj;
    }
    // #endregion

    // Register a state machine
    reg( ...ary ){
        for( const sm of ary ) this.list[ sm.name ] = sm;
        return this;
    }

    // #region SETTERS / GETTERS

    get stackSize(){ return this.stack.length; }
    get current(){ return this.stack.at( -1 ); }

    getMachine( name ){ return this.list[ name ] ?? null; }

    // Check if the named state machine is currently in the stack
    isActive( name ){
        for( const m of this.stack ){
            if( m.name === name ) return true;
        }
        return false;
    }

    // #endregion

    // #region MANAGE STACK

    /** Push a new machine to the top of the stack */
    push( name, props=null ){
        const sm = this.list[ name ];
        if( sm ){
            if( !sm.validateStartup( this.obj ) ){
                console.log('Machine failed startup validation', sm.name);
                return this;
            }

            // Pause active machine
            if( this.stack.length > 0 ) this.current?.onSuspend( this.obj );

            // Initialize new machine
            sm.onInit( this, props );

            // New machine is now the active one
            this.stack.push( sm );
        }else{
            console.error('State machine not found: ', name);
        }
        return this;
    }

    /** Remove top active machine & reactivate previous one */
    pop() {
        const idx = this.stack.length - 1;
        if( idx !== 0 ){
            // End existing machine
            let sm = this.stack.pop();
            sm?.onRelease( this );

            // Reactivate previous machine
            sm = this.stack.at( -1 );
            sm?.onWakeup( this );
        }
        return this;
    }

    /** Swop top active machine with a new one */
    switch( name, props=null ){
        const sm = this.list[ name ];
        if( sm ){
            if( !sm.validateStartup( this ) ){
                console.log( 'Machine failed startup validation', sm.name );
                return this;
            }

            const idx = this.stack.length - 1;
            this.stack[ idx ].onRelease( this );    // End existing machine
            sm.onInit( this, props );               // Start new machine
            this.stack[ idx ] = sm;                 // Make it the most active
        }else{
            console.error('State machine not found: ', name);
        }
        return this;
    }

    /** Exit all machines, option to auto launch a new root machine */
    clear( name=null, props=null ){
        // Clear out stack
        if( this.stack.length > 0 ){
            while( this.stack.length > 0 ){
                this.stack.pop()?.onRelease( this );
            }
        }

        // Start new machine if requested
        if( name ) this.push( name, props );
        return this;
    }

    // #endregion
}


export class MachineBase {
    // #region MAIN
    name = 'base';
    // #endregion

    // #region STATE MACHINE INTERFACE
    onInit( sm, props=null ){}
    onRelease( sm ){}
    onSuspend( sm ){}
    onWakeup( sm ){}
    validateStartup( sm ){ return true; }
    // #endregion

    // // #region GIZMO EVENTS
    // onGizmoRotate( v ){}
    // onGizmoTranslate( v ){}
    // onGizmoDragStart(){}
    // onGizmoDragEnd(){}
    // onGizmoModeChange( mode ){}
    // // #endregion

    // // #region POINTER / MOUSE EVENTS
    // onPointerDown( x, y, e, obj ){ console.log('onPointerDown', x, y, this.name ); return false; }
    // onPointerMove( x, y, e, obj ){ console.log('onPointerMove', x, y, this.name ); }
    // onPointerUp( e, obj ){ console.log('onPointerUp', this.name ); }
    // onPointerCancel( e, obj ){ console.log('onPointerCancel', this.name ); }
    // onDblClick( e, obj ){ console.log('onDblClick', this.name ); }
    // onContextMenu( e, obj ){ console.log('onContextMenu', this.name ); }
    // // #endregion

    // // #region KEYBOARD EVENTS
    // onKeyDown( e, obj ){ console.log('onKeyDown', e.key, this.name); }
    // onKeyUp( e, obj ){ console.log('onKeyUp', e.key, this.name); }
    // // #endregion
}
