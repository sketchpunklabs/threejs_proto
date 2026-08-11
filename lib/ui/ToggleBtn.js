export default class ToggleBtn extends HTMLElement{
    // #region MAIN
    static observedAttributes = [ 'value', 'checked', 'label', 'labeloff', 'disabled' ];
    #elmTrack = null;
    #elmLabel = null;

    #value    = false;
    #disabled = false;
    #label    = '';
    #labeloff = '';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Bright Green color: #22c55e, bright cyan : #22c5b0
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display               : grid;
                grid-template-columns : 1fr;
                grid-template-rows    : 1fr;
                user-select           : none;
                cursor                : pointer;
                min-width             : 80px;

                --height       : 1.6rem;
                --knob-size    : calc(var(--height) - 6px);
                --knob-width   : 10px;
                --knob-inset   : 3px;
                --col-off      : #202020;
                --col-on       : #1a9a89;
                --col-on-glow  : rgba( 34,197,94,.4 );
                --txt-col      : #e4e4e7;
                --duration     : 340ms;
                --ease         : cubic-bezier( .4, 0, .2, 1 );
            }

            .track{
                position        : relative;
                height          : var(--height);
                overflow        : hidden;

                border-radius   : 4px;
                background      : var(--col-off);

                transition      : background var(--duration) var(--ease);
                pointer-events  : none;
            }

            .track.disabled{ opacity: .38; cursor: not-allowed; }

            .track.on{
                background : var( --col-on );
                /* box-shadow : 0 0 14px 2px var(--col-on-glow); GLOW EFFECT */
            }

            .track.on .knob{
                left       : calc( 100% - var(--knob-width) - var(--knob-inset) );
                background : #e0e0e0;
            }

            .label{
                position        : absolute;
                inset           : 0;
                display         : flex;
                align-items     : center;
                justify-content : center;

                font-family    : monospace;
                font-size      : 1.0rem;
                font-weight    : 400;
                letter-spacing : .06em;
                color          : var(--txt-col);
                white-space    : nowrap;

                transition     : opacity var(--duration) var(--ease);
            }

            .knob{
                position        : absolute;
                top             : var(--knob-inset);
                left            : var(--knob-inset);
                width           : var(--knob-width);
                height          : var(--knob-size);

                border-radius   : 3px;
                background      : #606060;

                transition      : left var(--duration) var(--ease);
                will-change     : left;
            }
        </style>
        <div class="track" part="track">
            <div  class="knob"  part="knob"></div>
            <span class="label" part="label"></span>
        </div>
        `;

        this.#elmTrack = this.shadowRoot.querySelector( '.track' );
        this.#elmLabel = this.shadowRoot.querySelector( '.label' );
        this.addEventListener( 'click', this.#toggle );
    }
    // #endregion

    // #region LIFECYCLE
    attributeChangedCallback( name, oldVal, newVal ){
        // console.log( name, newVal );
        switch( name ){
            case 'checked'  : this.value     = newVal != null; break;
            case 'value'    : this.value     = newVal === 'true'; break;

            case 'disabled' : this.disabled  = newVal !== null; break;
            case 'labeloff' : this.labeloff  = newVal; break;
            case 'label'    : this.label     = newVal; break;
        }
    }
    // #endregion

    // #region PRIVATE
    #toggle = ()=>{
        if( this.#disabled ) return;
        this.value = !this.#value;

        this.dispatchEvent( new CustomEvent( 'change', {
            bubbles    : true,
            composed   : true,
            cancelable : true,
            detail     : { value: this.#value, target: this, },
        }));
    }

    #updateLabel(){
        if( this.#labeloff ){
            this.#elmLabel.textContent = this.#value ? this.#label : this.#labeloff;
            return true;
        }
        return false;
    }
    // #endregion

    // #region GETTERS / SETTERS
    get value(){ return this.#value;  }
    set value( v ){
        this.#value = v;
        this.#elmTrack.classList.toggle( 'on', this.#value );
        this.#updateLabel();
    }

    get disabled(){ return this.#disabled; }
    set disabled( v ){
        this.#disabled = v;
        this.#elmTrack.classList.toggle( 'disabled', this.#disabled );
    }

    set labeloff( v ){ this.#labeloff = v; this.#updateLabel(); }
    set label( v ){
        this.#label = v;
        if( !this.#updateLabel() ) this.#elmLabel.textContent = v;
    }
    // #endregion
}

customElements.define( 'toggle-btn', ToggleBtn );
