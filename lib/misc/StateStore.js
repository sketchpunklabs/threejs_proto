/*
const store = new StateStore( { p:{x:0}, c:{x:0}, b:1, ary:[1,2,3] } );

const dispose = store.on( 'p.x', e=>console.log('ON p.x', e.detail ) );
store.on( 'p', e=>console.log('ON p', e.detail ) );
store.on( 'change', e=>console.log('ON change', e.detail ) );

store.state.p.x = 10;
dispose();
store.state.p.x = 5;
*/

export default class Store{
    // #region MAIN
    events = new EventTarget(); // Add Event Handling to the store
    cache  = new WeakMap();     // Cache sub proxies linked to object's reference
    state  = null;              // State access point

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
                const val = Reflect.get( target, prop, receiver );

                // Wrap in a proxy if its a plain object
                if( self.#isObject( val ) ){
                    // Use val as a key, and if val gets deleted from the target,
                    // so will the proxy in the cache.
                    if( self.cache.has( val ) ) return self.cache.get( val );

                    // Create new proxy for this object
                    const propPath = path ? `${path}.${prop}` : prop;
                    // console.log( 'NEW PROXY Sub Path', propPath );

                    // Cache it for later access
                    const propProxy = new Proxy( val, self.#createHandler( propPath ) );
                    self.cache.set( val, propProxy );

                    return propProxy;
                }

                return val;
            },

            set( target, prop, val, receiver ){
                const oldVal = target[ prop ];
                if( oldVal === val ) return true;

                const isOk = Reflect.set( target, prop, val, receiver );
                if( isOk ){
                    const propPath = path ? `${path}.${prop}` : prop;
                    self.emit( propPath, oldVal, val );              // a.b.c
                    self.emit( 'change', oldVal, val, propPath );
                    if( path ) self.emit( path, oldVal, val, prop ); // a.b
                }

                return isOk;
            },
        };
    }
    // #endregion

    // #region EVENT METHODS
    off( evtName, fn ){ this.events.removeEventListener( evtName, fn ); return this; }
    once( evtName, fn ){ this.events.addEventListener( evtName, fn, { once: true } ); return this; }
    on( evtName, fn ){
        this.events.addEventListener( evtName, fn );
        return () => events.removeEventListener( evtName, fn );
    }

    emit( evtName, oldValue, value, path ){
        const evt = path
            ? new CustomEvent( evtName, { detail: { path, oldValue, value } } )
            : new CustomEvent( evtName, { detail: { oldValue, value } } );
        this.events.dispatchEvent( evt );
        return this;
    }
    // #endregion
}
