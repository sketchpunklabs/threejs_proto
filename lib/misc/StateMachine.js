export default class StateMachines{
    // #region MAIN
    list  = {};   // Collection of registered state machines
    stack = [];   // Stack of active state machines
    obj   = null;

    constructor( obj ){
        this.obj = obj;
    }
    // #endregion

    // #region SETTERS / GETTERS

    // Register a state machine
    reg( ...ary ){
        for( const sm of ary ) this.list[ sm.name ] = sm;
        return this;
    }

    // Get the top most active state machine in the stack
    getCurrent(){ return this.stack.at(-1); }

    // Check if the named state machine is currently in the stack
    isActive( name ){
        for (const m of this.stack) {
            if( m.name === name ) return true;
        }
        return false;
    }

    get stackSize(){
        return this.stack.length;
    }

    getMachine( name ){
        const sm = this.list[name];
        return sm ? sm : null;
    }
    // #endregion

    // #region MANAGE STACK

    // Push a new machine to the top of the stack
    push( name ){
        const sm = this.list[ name ];
        if (sm) {
            if( !sm.validateStartup( this.obj ) ){
                console.log('Machine failed startup validation', sm.name);
                return this;
            }

            if( this.stack.length > 0 ){
                const prev = this.getCurrent();
                if( prev ) prev.onSuspend( this.obj ); // Pause active machine
            }

            sm.onInit( this.obj ); // Initialize new machine
            
            this.stack.push( sm ); // New machine is now the active one
        }else{
            console.error('State machine not found: ', name);
        }
        return this;
    }

    // Remove top active machine & reactivate previous one
    pop() {
        const idx = this.stack.length - 1;
        if( idx !== 0 ){
            let sm = this.stack.pop();
            if( sm ) sm.onRelease( this.obj ); // End existing machine

            sm = this.stack.at(-1);
            if( sm ) sm.onWakeup( this.obj ); // Reactivate previous machine
        }
        return this;
    }

    // Swop top active machine with a new one
    switch( name ){
        const sm = this.list[ name ];
        if( sm ){
            if( !sm.validateStartup( this.obj ) ){
                console.log('Machine failed startup validation', sm.name);
                return this;
            }

            const idx = this.stack.length - 1;
            this.stack[idx].onRelease( this.obj );  // End existing machine
            sm.onInit( this.obj );                  // Start new machine
            this.stack[ idx ] = sm;                 // Make it the most active
        }else{
            console.error('State machine not found: ', name);
        }
        return this;
    }

    // Exit all machines
    clear(){
        if( this.stack.length > 0 ){
            while( this.stack.length > 0 ){
                this.stack.pop()?.onRelease( this.obj );
            }
        }
        return this;
    }
    // #endregion
}


export class MachineBase {
    // #region MAIN
    name = 'base';
    // #endregion

    // #region STATE MACHINE INTERFACE
    onInit( obj ){}
    onRelease( obj ){}
    onSuspend( obj ){}
    onWakeup( obj ){}
    validateStartup( obj ){ return true; }
    // #endregion

    // #region GIZMO EVENTS
    onGizmoRotate( v ){}
    onGizmoTranslate( v ){}
    onGizmoDragStart(){}
    onGizmoDragEnd(){}
    onGizmoModeChange( mode ){}
    // #endregion

    // #region POINTER / MOUSE EVENTS
    onPointerDown( x, y, e, obj ){ console.log('onPointerDown', x, y, this.name ); return false; }
    onPointerMove( x, y, e, obj ){ console.log('onPointerMove', x, y, this.name ); }
    onPointerUp( e, obj ){ console.log('onPointerUp', this.name ); }
    onPointerCancel( e, obj ){ console.log('onPointerCancel', this.name ); }
    onDblClick( e, obj ){ console.log('onDblClick', this.name ); }
    onContextMenu( e, obj ){ console.log('onContextMenu', this.name ); }
    // #endregion

    // #region KEYBOARD EVENTS
    onKeyDown( e, obj ){ console.log('onKeyDown', e.key, this.name); }
    onKeyUp( e, obj ){ console.log('onKeyUp', e.key, this.name); }
    // #endregion
}