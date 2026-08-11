// #region EFFECTS
let GLOBAL_EFFECT = null;

export class Effect{
    signals = new Set();    // Known signals this effect uses
    fn      = null;         // Function the effect executes
    caller  = null;         // Have a caller execute function, ex: setTimeout
    store   = null;         // Contains data paths the effect uses from a store

    constructor( fn, caller=null, exec=true ){
        this.fn     = fn;
        this.caller = caller;
        if( exec ) this.exec();
    }

    // Run the caller or execute the function
    run( ...args ){
        if( this.caller ) this.caller( this );
        else              this.exec( ...args );
    }

    // Execute the function
    exec( ...args ){
        const prevEffect = GLOBAL_EFFECT;   // Save previous for stacked effect functions
        GLOBAL_EFFECT    = this;

        // Reset links between this effect & signals
        // This is just some basic house keeping incase
        // The effect function has an if condition that does
        // not call this signal the second time it runs
        this.clear();

        // Run effect and re-establish link to signals
        try{ this.fn( ...args ); }
        finally{
            GLOBAL_EFFECT = prevEffect; // Reset back to its original state
        }
    }

    // Reset connections
    clear(){
        // Remove this effect from signal's subscriptions
        for( let i of this.signals ) i.unreg( this );

        // Clear out all known signals
        this.signals.clear();
    }

    // #region ABSTRACT CALLERS

    // Create an effect but do not execute right away
    static init( fn, caller=null ){ return new Effect( fn, caller, false ); }

    // An effect that executes at a timeout
    static timeout( fn, ms=1000, exec=true ){
        return new Effect( fn, eff=>{ setTimeout( ()=>eff.exec(), ms ) }, exec );
    }

    // An effect that waits to execute to prevent to many calls
    static bounce( fn, lmt=50, exec=true ){
        let tOut   = null;
        let caller = eff =>{
            if( tOut != null ) clearTimeout( tOut );

            tOut = setTimeout( ()=>{
                tOut = null;
                eff.exec();
            }, lmt );
        };

        return new Effect( fn, caller, exec );
    }

    // An effect that executes when a requested animation frame runs
    static frame( fn, exec=true ){
        let isActive = false;
        const caller = eff =>{
            if( isActive ) return;  // Exit if already called but frame hasn't executed yet
            isActive = true;        // Now Active
            requestAnimationFrame( ()=>{
                isActive = false;
                eff.exec();
            });
        };

        return new Effect( fn, caller, exec );
    }

    // Make an effect into a function that can be called with parameters
    static fn( fn, caller=null ){
        const rtn  = (...args) => rtn.effect.run( ...args );
        rtn.effect = new Effect( fn, caller, false );
        return rtn;
    }
    // #endregion
}
// #endregion


/*
const count = new Signal( 0, 'cnt' );
const effect = new Effect( ()=>console.log( 'Effect', count.value ) );

Effect.timeout( ()=>console.log( 'DELAY', count.value ), 3000 );
Effect.bounce( ()=>console.log( 'BOUNCE', count.value ) );
Effect.frame( ()=>console.log( 'FRAME', count.value ) );

const eff = Effect.init( ()=>console.log( 'INIT', count.value ) );
count.reg( eff );

count.value = 5;
count.value = 2;
count.value = 1;
*/

// Simple Signal
export class Signal{
    // #region MAIN
    name    = '';           // Name of signal [Optional]
    #val    = null;         // Current value
    effects = new Set();    // List if effects using this signal

    constructor( v, n='' ){
        this.#val = v;
        this.name = n;
    }
    // #endregion

    // #region MANAGE EFFECTS

    /** Create link between signal & effect */
    reg( eff ){
        this.effects.add( eff );   // Add effect to signal subscribers
        eff.signals.add( this );   // Add signal to effect
        return this;
    }

    /** Clear out any link between signal & effect */
    unreg( eff ){
        this.effects.delete( eff );
        return this;
    }

    /** Evecute any registered effects */
    emit(){
        // Executing effects will modify subs, make a copy to loop without issues
        for( let eff of Array.from( this.effects ) ) eff.run();
    }
    // #endregion

    // #region GETTERS / SETTERS
    get value(){
        if( GLOBAL_EFFECT ) this.reg( GLOBAL_EFFECT );
        return this.#val;
    }

    set value( v ){
        if( Object.is( this.#val, v ) ) return; // value hasn't changed

        // Set new value & execute effects
        this.#val = v;
        this.emit();
    }
    // #endregion
}


/*
const count = new SignalTween( 0, 200 );

new Effect( ()=>{
    let cnt = count.value;
    console.log( 'EffectX', cnt );
    if( cnt == 10 ) count.value = 12;
});

count.reg( Effect.init( ()=>console.log( 'EffectX', count.value ) ) );
setTimeout( ()=>{ count.value=15 }, 2000 );

count.value = 10;

count.setRange( 20, 10 );
 */
// Signal that tweens between two numbers
export class SignalTween{
    // #region MAIN
    #value     = 0;
    #initValue = 0;
    #targValue = 0;
    #frame     = null;
    #initTime  = null;
    #duration  = 1000;

    effects    = new Set();    // List if effects using this signal

    constructor( v, dur=1000 ){
        this.#value     = v;
        this.#initValue = v;
        this.#targValue = v;
        this.#duration  = dur;
    }
    // #endregion

    // #region ANIMATOR
    tick = et => {
        if( this.#initTime == null ) this.#initTime = et;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const delta = et - this.#initTime;
        const t     = Math.min( delta / this.#duration, 1 );
        this.#value = this.#initValue * (1-t) + this.#targValue * t;

        this.emit();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( t < 1 ) this.#frame = requestAnimationFrame( this.tick );
        else{
            this.#value    = this.#targValue;
            this.#initTime = null;
            this.#frame   = null;
        }
    }
    // #endregion

    // #region GETTER / SETTER
    setRange( a, b ){
        this.#value = a;
        this.value  = b;
        return this;
    }

    get value(){
        if( GLOBAL_EFFECT ) this.reg( GLOBAL_EFFECT );
        return this.#value;
    }

    set value( v ){
        if( v === this.#targValue ) return;

        if( this.#frame ) cancelAnimationFrame( this.#frame );

        this.#initValue = this.#value;
        this.#targValue = v;
        this.#initTime  = null;

        this.#frame     = requestAnimationFrame( this.tick );
    }
    // #endregion

    // #region MANAGE EFFECTS
    reg( eff ){
        this.effects.add( eff );   // Add effect to signal subscribers
        eff.signals.add( this );   // Add signal to effect
        return this;
    }

    unreg( eff ){
        this.effects.delete( eff );
        return this;
    }

    emit(){
        // Executing effects will modify subs, make a copy to loop without issues
        for( let eff of Array.from( this.effects ) ) eff.run();
    }
    // #endregion

}


/*
const store = new Store( { p:{x:0}, c:{x:0}, b:1, ary:[1,2,3] } );

// Events
const dispose = store.on( 'p.x', e=>console.log('ON p.x', e.detail ) );
store.on( 'p', e=>console.log('ON p', e.detail ) );
store.on( 'change', e=>console.log('ON change', e.detail ) );

store.state.p.x = 10;
dispose();
store.state.p.x = 5;

// Effects
const store = new Store( { x:0, a:{ b:0, c:0 } } );

new Effect( ()=>console.log( 'EffectX', store.state.x ) );
new Effect( ()=>console.log( 'EffectB', store.state.a.b ) );

store.state.x = 1;
store.state.a.b = 2;
*/

// Proxy Store that supports Effects and Events
export class Store{
    // #region MAIN
    events  = new EventTarget(); // Add Event Handling to the store
    cache   = new WeakMap();     // Cache sub proxies linked to object's reference
    state   = null;              // State access point
    effects = {};                // < PathStr, Set<Effect> >

    constructor( obj=null ){ obj && this.init( obj ); }

    init( obj ){
        this.state = new Proxy( obj, this.#createHandler() );
        return this;
    }
    // #endregion

    // #region PRIVATE METHODS
    #isObject( v ){
        if( typeof v !== 'object' || v == null ) return false;

        // Returns true for {} or Object.create(null)
        const proto = Object.getPrototypeOf( v );
        return ( proto === Object.prototype || proto === null || !Array.isArray( v ) );
    }

    #createHandler( path='' ){
        const self = this;
        return {
            get( target, prop, receiver ){
                // console.log( 'get', 'PATH', path, 'Prop', prop, 'Target', target );
                const val      = Reflect.get( target, prop, receiver );
                const propPath = path ? `${path}.${prop}` : prop;
                // console.log( 'GET', propPath, val );

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                // Wrap in a proxy if its a plain object
                if( self.#isObject( val ) ){
                    // Use val as a key, and if val gets deleted from the target,
                    // so will the proxy in the cache.
                    if( self.cache.has( val ) ) return self.cache.get( val );

                    // Create new proxy for this object, Cache it for later access
                    const propProxy = new Proxy( val, self.#createHandler( propPath ) );
                    self.cache.set( val, propProxy );

                    return propProxy;
                }

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                // Handle linking effect if one is active
                if( GLOBAL_EFFECT ) self.reg( GLOBAL_EFFECT, propPath );

                return val;
            },

            set( target, prop, val, receiver ){
                const oldVal = target[ prop ];
                if( oldVal === val ) return true;

                const isOk = Reflect.set( target, prop, val, receiver );
                if( isOk ){
                    const propPath = path ? `${path}.${prop}` : prop;
                    // console.log( 'SET', propPath, val );
                    // console.log( '- PROP', prop );
                    // console.log( '- propPath', propPath );
                    // console.log( '- path', path );

                    // -------------------------------------------
                    // Execute Events
                    self.dispatch( propPath, oldVal, val, propPath );    // dispatch full path  : a.b.c
                    self.dispatch( 'change', oldVal, val, propPath );    // dispatch global change
                    if( path ) self.dispatch( path, oldVal, val, prop ); // dispatch parent path : a.b

                    // -------------------------------------------
                    // Execute Effects
                    self.emit( propPath );
                }

                return isOk;
            },
        };
    }
    // #endregion

    // #region MANAGE EFFECTS
    reg( eff, path ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let subs = this.effects[ path ];
        if( !subs ) subs = this.effects[ path ] = new Set();

        subs.add( eff );         // Add effect using data path
        eff.signals.add( this ); // Register store as a signal

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Store paths being accesses
        if( !eff.store ){
            eff.store = new WeakMap();
            eff.store.set( this, new Set() );
        }

        const paths = eff.store.get( this );
        paths.add( path );

        return this;
    }

    unreg( eff, path=null ){
        if( !path ){
            const paths = eff.store?.get( this );
            if( paths ){
                for( const i of paths ) this.effects[ i ]?.delete( eff );
            }else{
                console.log( 'NOT IMPLMENTED - Unreg eff from any path' );
            }
        }else{
            this.effects[ path ]?.delete( eff );
        }

        return this;
    }

    emit( path ){
        const set = this.effects[ path ];
        if( !set ) return;
        for( let eff of Array.from( set ) ) eff.run();
    }
    // #endregion

    // #region EVENT METHODS
    off( evtName, fn ){ this.events.removeEventListener( evtName, fn ); return this; }
    once( evtName, fn ){ this.events.addEventListener( evtName, fn, { once: true } ); return this; }
    on( evtName, fn ){
        this.events.addEventListener( evtName, fn );
        return () => events.removeEventListener( evtName, fn );
    }

    dispatch( evtName, oldValue, value, path ){
        // console.log( 'Dispatch', 'evt',evtName, 'old', oldValue, 'new', value, 'path', path );
        this.events.dispatchEvent(
            new CustomEvent( evtName, {
                detail      : { path, oldValue, value },
                bubbles     : true,
                cancelable  : true,
                composed    : false,
            })
        );
        return this;
    }
    // #endregion
}
