// ▲ ▼ ◀ ▶ ⬡ ⬢ △ ▽ ◁ ▷ ⮝ ⮟ ⮜ ⮞ ↶ ↷ ↺ ↻ ︿ ﹀ ˄ ˅ ‹ › 〈 〉 ▴ ▾ ◂ ▸
// ⭗ ⯎ ⯏ ⬖ ⬗ ⬘ ⬙ ⬚ ◇ ◆ ◈ ⋄ ⬦ ⬥ ◌ ◎ ◍ ◙ ◐ ◑ ◒ ◓ ◔ ◕ ▢ ▣ ▤ ▥ ▦ ◘ ◙ ◚ ◛

/* EXAMPLE
<group-panel title="Controls" float close style="position:fixed; left:calc(100vw - 210px); top:10px; width:200px;">
    <section class="grpItem">
        <label>Upper Body</label>
        <input type="text"/>
    </section>
</group-panel>
*/

export default class GroupPanel extends HTMLElement{
    // #region MAIN
    static observedAttributes = [ 'close', 'title', 'float' ];

    #dragOffsetX = 0;   // Inital pos of pointer on down
    #dragOffsetY = 0;
    #dragPointer = 0;   // Pointer ID

    constructor(){
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
            :host{
                display:flex; flex-direction:column; box-sizing:border-box;
                interpolate-size: allow-keywords;
            }

            :host > header{
                display:flex; flex-direction: row; gap:5px;
                user-select:none;
            }

            :host > header > span{ flex:1 1 auto; display:block; cursor:grab; }
            :host > header > div{ margin-right:2px; }
            :host > header i{ cursor:pointer; display:inline-block; width:20px; text-align:right; }

            slot{
                display: block; box-sizing: border-box;
                min-height: 0px; height: auto;
                overflow: clip;

                transition          : height 0.25s ease, display 0.25s;
                transition-behavior : allow-discrete;

                @starting-style{ height: 0px; }
            }

            :host([close]) slot{ height:0px; display:none; }

            :host([close]) > header i[name="toggle"]:after{ content:'▲'; }
            :host > header i[name="toggle"]:after{ content:'▼'; }
        </style>
        <header part="header">
            <span>Header</span>
            <div>
                <i name="toggle"></i>
            </div>
        </header>
        <slot part="content"></slot>`;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.shadowRoot.querySelector( 'i[name="toggle"]').addEventListener( 'click', e=>{
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        if( this.hasAttribute('float') ){
            this.header = this.shadowRoot.querySelector( 'header > span' );
            this.header.addEventListener( 'pointerdown', this.onPointerDown );
        }
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
            case 'title': this.header.textContent = newValue; break;
        }
    }
    // #endregion

    // #region METHODS
    toggle(){
        if( this.hasAttribute( 'close' ) ) this.removeAttribute( 'close' );
        else                               this.setAttribute( 'close', '' );
    }
    // #endregion

    // #region POINTER EVENTS
    onPointerDown = e=>{
        e.preventDefault();
        e.stopPropagation();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const rect        = this.getBoundingClientRect();
        this.#dragOffsetX = e.clientX - rect.left;
        this.#dragOffsetY = e.clientY - rect.top;
        this.#dragPointer = e.pointerId;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        window.addEventListener('pointermove', this.onPointerMove );
        window.addEventListener('pointerup', this.onPointerUp, { once:true } );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.header.setPointerCapture( this.#dragPointer ); // Keep receiving events
        this.header.style.cursor = 'grabbing';
    };

    onPointerMove = e=>{
        this.style.left = (e.clientX - this.#dragOffsetX) + 'px';
        this.style.top  = (e.clientY - this.#dragOffsetY) + 'px';
    };

    onPointerUp = e=>{
        window.removeEventListener( 'pointermove', this.onPointerMove );

        this.header.releasePointerCapture( this.#dragPointer );
        this.header.style.cursor = 'grab';
    };
    // #endregion
}

customElements.define( 'group-panel', GroupPanel );
