/*

// EXAMPLES
<toggle-btn-bar value="week">
    <button data-value="day">A</button>
    <button data-value="week">Week</button>
    <button data-value="month">Month1234567</button>
    <button data-value="year">Year</button>
</toggle-btn-bar>

*/
export default class ToggleBtnBar extends HTMLElement{
    // #region MAIN
    static observedAttributes = [ 'value', 'disabled' ];

    #elmTrack = null;
    #elmSlot  = null;
    #buttons  = [];

    #value          = null;
    #disabled       = false;
    #resizeObserver = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display     : inline-block;
                user-select : none;
                min-width   : 20px;

                --height            : 2.0rem;
                --padding           : 3px;
                --col-bg            : #202020;
                --col-active        : #1a9a89;
                --txt-col           : #a1a1aa;
                --txt-active-col    : #ffffff;
                --txt-hover-col     : #ffffff;
                --duration          : 300ms;
                --ease              : cubic-bezier( 0.4, 0, 0.2, 1 );

                /* Dynamic variables set via JavaScript */
                --knob-left     : 0px;
                --knob-width    : 0px;
            }

            .track {
                display         : flex;
                position        : relative;
                height          : var(--height);
                background      : var(--col-bg);
                border-radius   : 6px;
                padding         : var(--padding);
                box-sizing      : border-box;
            }

            .track.disabled {
                opacity         : 0.38;
                pointer-events  : none;
                cursor          : not-allowed;
            }

            .knob {
                position        : absolute;
                top             : var(--padding);
                bottom          : var(--padding);
                left            : var(--knob-left);
                width           : var(--knob-width);
                background      : var(--col-active);
                border-radius   : 4px;

                /* Modern CSS transition for size and position movement */
                transition:
                    left  var(--duration) var(--ease),
                    width var(--duration) var(--ease);
                /* will-change     : left, width; */
                pointer-events  : none;
            }

            /* #region BUTTONS */
            ::slotted( button ){
                flex        : 1 1 0px;
                height      : 100%;
                background  : transparent;
                border      : none;
                outline     : none;
                cursor      : pointer;
                z-index     : 1;

                font-family : monospace;
                font-size   : 0.9rem;
                font-weight : 500;
                color       : var(--txt-col);
                white-space : nowrap;

                transition  : color var(--duration) var(--ease);
                padding     : 0 12px;
            }

            ::slotted( button.active ){ color : var(--txt-active-col); }
            ::slotted( button:hover ){  color : var(--txt-hover-col); }
            /* #endregion */
        </style>

        <div class="track" part="track">
            <div class="knob" part="knob"></div>
            <slot></slot>
        </div>
        `;

        this.#elmTrack       = this.shadowRoot.querySelector('.track');
        this.#elmSlot        = this.shadowRoot.querySelector('slot');
        this.#resizeObserver = new ResizeObserver( ()=>this.#updateKnobPosition() );
    }
    // #endregion

    // #region LIFECYCLE
    connectedCallback(){
        this.#elmSlot.addEventListener( 'slotchange', this.#onSlotChange );
        this.shadowRoot.addEventListener( 'click', this.#onClick );
        this.#resizeObserver.observe( this );
    }

    disconnectedCallback(){ this.#resizeObserver.disconnect(); }

    attributeChangedCallback(name, oldVal, newVal) {
        if( oldVal === newVal ) return;
        switch( name ){
            case 'value'    : this.value    = newVal; break;
            case 'disabled' : this.disabled = newVal !== null; break;
        }
    }
    // #endregion

    // #region EVENTS
    #onSlotChange = ()=>{
        this.#buttons = Array.from( this.querySelectorAll('button') );

        if( this.#buttons.length > 0 && !this.#value ){
            // Set default value if not available
            this.value = this.#buttons[ 0 ].dataset?.value;
        }else{
            this.#updateKnobPosition();
        }
    }

    #onClick = e=>{
        if( this.#disabled ) return;

        const btn = e.target.closest( 'button' );
        if( !btn || !this.#buttons.includes(btn) ) return;
        if( this.#value === btn.dataset?.value ) return;

        this.value = btn.dataset.value;
        this.dispatchEvent( new CustomEvent( 'change', {
            bubbles     : true,
            composed    : true,
            cancelable  : true,
            detail      : { value: this.#value, target: this },
        }));
    }
    // #endregion

    // #region GETTERS / SETTERS
    get value(){ return this.#value; }
    set value( v ){ this.#value = v; this.#updateKnobPosition(); }

    get disabled(){ return this.#disabled; }
    set disabled( v ){ this.#elmTrack.classList.toggle( 'disabled', ( this.#disabled = Boolean(v) ) ); }
    // #endregion

    // #region HELPERS
    #updateKnobPosition(){
        const activeBtn = this.#buttons.find( btn=>( btn.dataset?.value === this.#value ) );

        if( !activeBtn ){ this.style.setProperty( '--knob-width', '0px' ); return; }

        // Reset active class on the buttons
        for( const btn of this.#buttons ) btn.classList.toggle( 'active', btn === activeBtn );

        // Calculate offset relative to the track inner bounds
        const trackRect = this.#elmTrack.getBoundingClientRect();
        const btnRect   = activeBtn.getBoundingClientRect();
        const left      = btnRect.left - trackRect.left;
        const width     = btnRect.width;

        this.style.setProperty( '--knob-left',  `${left}px` );
        this.style.setProperty( '--knob-width', `${width}px` );
    }
    // #endregion
}

customElements.define( 'toggle-btn-bar', ToggleBtnBar );
