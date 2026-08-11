/*
<vec3-input value="[1,2,3]" label='["R:","G:","B:"]' step="0.1"></vec3-input>
*/
export default class Vec3Input extends HTMLElement{
    // #region MAIN
    static observedAttributes = [ 'value', 'mode', 'fixed', 'label', 'step' ];

    #mode       = "";      // How to handle Input/Display Data : [ radian ]
    #fixedSize  = 0;       // Crop decimal places when displaying data
    #value      = [0,0,0]; // internal value state

    #inpX; // References to the 3 input fields
    #inpY;
    #inpZ;

    constructor(){
        super();
        this.attachShadow({ mode: 'open' });

        // Build UI
        this.shadowRoot.innerHTML = `
            <style>
                :host{ display:flex; flex-direction:row; gap:5px; overflow:hidden; }

                div{
                    flex            : 1 1 auto;
                    min-width       : 0px;
                    display         : flex;
                    flex-direction  : row;
                    align-items     : center;
                    padding-left    : 4px;

                    &:has(input:focus) label{ color: var(--txt-col-focus); }

                    /* &:has(input:focus){ border:1px solid red; } */
                }

                input, label{
                    color       : var(--txt-col);
                    font-family : var(--txt-fam);
                    font-size   : var(--txt-size);
                }

                label{ user-select: none; }

                input{
                    flex             : 1 1 auto;
                    min-width        : 0px;
                    border           : none;
                    background-color : transparent;
                    &:focus{
                        outline : none;
                        color   : var( --txt-col-focus );
                    }
                }

                /*
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                */

                input[type="number"] { -moz-appearance: textfield; }
            </style>
            <div part="box">
                <label for="inpX">X:</label>
                <input type="number" part="inp" name="inpX" data-idx="0" value="0">
            </div>
            <div part="box">
                <label for="inpY">Y:</label>
                <input type="number" part="inp" name="inpY" data-idx="1" value="0">
            </div>
            <div part="box">
                <label for="inpZ">Z:</label>
                <input type="number" part="inp" name="inpZ" data-idx="2" value="0">
            </div>
        `;

        this.#inpX = this.shadowRoot.querySelector('input[name="inpX"]');
        this.#inpY = this.shadowRoot.querySelector('input[name="inpY"]');
        this.#inpZ = this.shadowRoot.querySelector('input[name="inpZ"]');

        // Bind Events
        this.#inpX.addEventListener( 'input', this.onHandler );
        this.#inpY.addEventListener( 'input', this.onHandler );
        this.#inpZ.addEventListener( 'input', this.onHandler );

        this.#inpX.addEventListener( 'change', this.onHandler );
        this.#inpY.addEventListener( 'change', this.onHandler );
        this.#inpZ.addEventListener( 'change', this.onHandler );
    }
    // #endregion

    // #region BASE OVERRIDES
    // Handle changes to element attributes
    attributeChangedCallback( name, oldValue, newValue ){
        switch( name ){
            case 'mode'  : this.#mode = newValue; break;
            case 'fixed' : this.#fixedSize = parseInt( newValue ); break;
            case 'value' :{
                try{
                    const ary = JSON.parse( newValue );
                    if( !Array.isArray(ary) || ary.length !== 3 ) throw new Error( 'Invalid value for Vec3Input. Must be a JSON array of 3 numbers.');

                    this.value = ary;
                }catch(e){
                    console.error( 'Invalid value for Vec3Input. Must be a JSON array of 3 numbers.', newValue );
                }
                break;
            }

            case 'label':{
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                // Hide Labels
                if( !newValue ){ this.labels = null; return; }

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                try{
                    this.labels = JSON.parse( newValue );
                }catch(e){
                    console.error( 'Invalid label for Vec3Input. Must be a JSON array of 3 strings or empty', newValue );
                    console.log( e.message );
                }
                break;
            }

            case 'step':{
                for( let n of this.shadowRoot.querySelectorAll('input') ){
                    n.setAttribute( 'step', newValue );
                }
                break;
            }
        }
    }
    // #endregion

    // #region GETTERS / SETTERS
    get value(){
        let [x,y,z] = this.#value;
        switch( this.#mode ){
           // Display data is in degrees, switch to radians for output
           case 'radian':
               x = x * ( Math.PI / 180 );
               y = y * ( Math.PI / 180 );
               z = z * ( Math.PI / 180 );
               break;
        }

        return [x,y,z];
    }

    set value( v ){
        if( !Array.isArray(v) || v.length !== 3 ) throw new Error( 'Value must be an array of 3 numbers.' );

        let [x,y,z] = v;
        switch( this.#mode ){
            // Input data is in radians, switch to degrees for display
            case 'radian':
                x = x * ( 180 / Math.PI );
                y = y * ( 180 / Math.PI );
                z = z * ( 180 / Math.PI );
                break;
        }

        if( this.#fixedSize > 0 ){
            x = parseFloat( x.toFixed( this.#fixedSize ) );
            y = parseFloat( y.toFixed( this.#fixedSize ) );
            z = parseFloat( z.toFixed( this.#fixedSize ) );
        }

        this.#inpX.value = this.#value[0] = x;
        this.#inpY.value = this.#value[1] = y;
        this.#inpZ.value = this.#value[2] = z;
    }

    set labels( v ){
        if( !v ){
            for( let n of this.shadowRoot.querySelectorAll('label') ) n.style.display = 'none';
        }else{
            let i=0;
            for( let n of this.shadowRoot.querySelectorAll('label') ){
                n.style.display = '';
                n.textContent   = v[i++];
            }
        }
    }
    // #endregion

    // #region EVENT HANDLERS
    onHandler = e =>{
        e.preventDefault();
        e.stopPropagation();

        // Save change to internal value
        const idx        = parseInt( e.target.dataset.idx );
        const v          = parseFloat( e.target.value );

        // handle empty or invalid input as 0
        if( isNaN(v) ){
            if( e.type === 'input' ) return;
            if( e.type === 'change' ) e.target.value = 0;
            this.#value[idx] = 0;
        }else{
            this.#value[idx] = v;
        }

        // Emit event with updated vector data
        this.dispatchEvent( new CustomEvent( e.type, {
            bubbles    : true,
            cancelable : true,
            detail     : {
                value  : this.value,
                target : this,
            },
        } ) );
    }
    // #endregion
}

window.customElements.define( 'vec3-input', Vec3Input );
