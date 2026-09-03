// ▲ ▼ ◀ ▶ ⬡ ⬢ △ ▽ ◁ ▷ ⮝ ⮟ ⮜ ⮞ ↶ ↷ ↺ ↻ ︿ ﹀ ˄ ˅ ‹ › 〈 〉 ▴ ▾ ◂ ▸
// ⭗ ⯎ ⯏ ⬖ ⬗ ⬘ ⬙ ⬚ ◇ ◆ ◈ ⋄ ⬦ ⬥ ◌ ◎ ◍ ◙ ◐ ◑ ◒ ◓ ◔ ◕ ▢ ▣ ▤ ▥ ▦ ◘ ◙ ◚ ◛

/* EXAMPLE
<drop-down msg="pick item" value="">
    <option value="test">default</option>
    <option value="yo">Yo</option>
    <option value="x">Three</option>
    <option value="y">Four</option>
</drop-down>
*/

export default class DropDown extends HTMLElement{
    // #region MAIN
    static observedAttributes = [ 'value', 'msg' ];

    #input = null;

    constructor(){
        super();
        this.attachShadow({ mode: 'open' });

        // selectedcontent{ color:yellow; }
        this.shadowRoot.innerHTML = `
        <style>
            :host{ display:grid; }

            select{
                appearance    : base-select;
                box-sizing    : border-box;
                border-width  : 0px;
                border-radius : 0px;
                padding       : 0px 3px 0px 6px;
                cursor        : pointer;
                min-width     : 0px;

                & > button{
                    flex            : 1;
                    display         : flex;
                    flex-direction  : row;
                    justify-content : space-between;
                    align-items     : center;
                    min-width       : 0px;

                    & > selectedcontent{ white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
                    & > svg{ width: 1.2rem; height: 1.2rem; }
                }

                &:hover{ background-color:transparent; }

                &:has(option:is([hidden]):checked) { color: gray; }
                &:has(option:not([hidden]):checked) { color: var(--txt-col, #d0d0d0 ); }

                &::picker-icon{ display: none; }
                &::picker(select){
                    appearance      : base-select;
                    border          : 1px solid #e4e4e7;
                    border-radius   : calc(0.5rem - 2px);
                    box-shadow      : 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

                    transition       : opacity 200ms ease-in-out, transform 200ms ease-in-out;
                    transform-origin : top;
                    transform        : translateY(0.1rem) scale(1.0);
                    opacity          : 1;

                    @starting-style {
                        transform   : translateY(-0.25rem) scale(0.85);
                        opacity     : 0;
                    }
                }

                & option {
                    padding : 0.1rem 0.5rem;
                    outline : none;

                    &::checkmark { display: none; }
                   &:hover, &:focus-visible { background-color: #c0c0c0; }
                }
            }
        </style>
        <select>
            <button>
                <selectedcontent></selectedcontent>
                <svg part="ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6"></path>
                </svg>
            </button>
            <option value="" hidden disabled selected name="placeholder"></option>
            <slot></slot>
        </select>`;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Selecting being wrapped
        this.#input = this.shadowRoot.querySelector( 'select' );
        this.#input.addEventListener( 'change', e=>{
            this.dispatchEvent( new CustomEvent( 'change',{
                bubbles    : true, // Crawl up the dom
                composed   : true, // Allow to cross shadow dome
                cancelable : true,
                detail     : { target: this, value : e.target.value },
            }));
        });

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Move options into select box
        const slot = this.shadowRoot.querySelector('slot');
        const ary  = slot.assignedElements().filter( i => i.tagName === 'OPTION' );
        for( const i of ary ) this.#input.appendChild( i );
    }
    // #endregion

    // #region LIFECYCLE
    // async connectedCallback(){} // Custom element added to page
    // disconnectedCallback(){} // Custom element removed from page
    // adoptedCallback(){} // Custom element moved to new page

    // called when attributes are changed
    attributeChangedCallback( name, oldValue, newValue ){
        // console.log( `Attribute ${name} has changed.`, oldValue, newValue );
        switch( name ){
            case 'value': this.#input.value = newValue; break;
            case 'msg':
                this.#input.querySelector( 'option[name="placeholder"]').textContent = this.getAttribute( 'msg' );
                this.#input.querySelector( 'selectedcontent').textContent            = this.getAttribute( 'msg' );
                break;
        }
    }
    // #endregion

    // #region GETTERS / SETTERS
    get value(){ return this.#input.value; }
    set value( v ){ this.#input.value = v; }
    // #endregion

    // #region METHODS
    clear(){ this.#input.options.length = 0; return this; }

    loadDict( dict, initVal=null ){
        for( const [k,v] of Object.entries( dict ) ){
            // opt = document.createElement( 'option' );
            // opt.value       = k;
            // opt.textContent = v
            this.#input.appendChild( new Option( v, k ) );
        }

        if( initVal != null ) this.#input.value = initVal;

        return this;
    }

    loadArray( ary ){
        for( const i of ary ) this.#input.appendChild( new Option( i, i ) );
        return this;
    }
    // #endregion
}

customElements.define( 'drop-down', DropDown );
