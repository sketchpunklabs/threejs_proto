export default class HotKeys{
    items = [];

    constructor(){ window.addEventListener( 'keydown', this.onKeyDown ); }
    dispose(){ window.removeEventListener( 'keydown', this.onKeyDown ); }

    reg( str, fn ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const parts = str.toLowerCase().split('+').filter( p => !!p );
        const itm   = {
            shift   : false,
            ctrl    : false,
            alt     : false,
            char    : '',
            fn      : fn,
        };

        // console.log( parts );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let p of parts ){
            p = p.trim();
            switch( p ){
                case 'shift' : itm.shift = true; break;
                case 'ctrl'  : itm.ctrl  = true; break;
                case 'alt'   : itm.alt   = true; break;
                case ''      : break;
                default      :
                    itm.char = p; break;
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // console.log( 'HotKey Reg: ', itm.char, 'Shift', itm.shift, 'Ctrl', itm.ctrl, 'Alt', itm.alt );
        // console.log( itm );
        this.items.push( itm );
        return this;
    }

    onKeyDown = e=>{
        if( e.target.matches( 'textarea, select, input:not([type="button"]):not([type="submit"])' ) ) return;

        const key = e.key.toLowerCase();
        // console.log( key, 'Shift', e.shiftKey, 'Ctrl', e.ctrlKey, 'Alt', e.altKey );

        for( const i of this.items ){
            if( key === i.char 
                && i.shift === e.shiftKey
                && i.ctrl  === e.ctrlKey
                && i.alt   === e.altKey
            ){
                e.preventDefault(); // Prevent Bowser Behavior
                i.fn( e );
                return;
            }
        }
    }
}
