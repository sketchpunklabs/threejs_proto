export default class KeyboardInput{
    // #region MAIN
    keys = new Map();
    constructor(){
        document.body.addEventListener( 'keydown', this.onKeyDown );
        document.body.addEventListener( 'keyup', this.onKeyUp );
    }
    // #endregion

    // #region METHODS
    isDown( key ){ return (this.keys.get( key ) === true); }

    getArrowState(){
        const up    = ( this.keys.get( 'ArrowUp' )    === true );
        const left  = ( this.keys.get( 'ArrowLeft' )  === true );
        const down  = ( this.keys.get( 'ArrowDown' )  === true );
        const right = ( this.keys.get( 'ArrowRight' ) === true );
        return {
            up, left, down, right,
            x : left? -1 : right? 1 : 0,
            y : down? -1 : up   ? 1 : 0,
        };
    }

    getWASD(){
        const up    = ( this.keys.get( 'w' ) === true )?  1 : 0;
        const left  = ( this.keys.get( 'a' ) === true )? -1 : 0;
        const down  = ( this.keys.get( 's' ) === true )? -1 : 0;
        const right = ( this.keys.get( 'd' ) === true )?  1 : 0;
        return { x: right + left, y: down + up };
    }
    // #endregion

    // #region EVENTSwwwwwwwwwww
    onKeyDown = ( e )=>{
        // console.log( 'down', e.key );
        this.keys.set( e.key.toLowerCase(), true );
    };

    onKeyUp = ( e )=>{
        //console.log( 'up', e );
        this.keys.set( e.key.toLowerCase(), false );
    };
    // #endregion
}
