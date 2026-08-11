// #region CONSTANTS
const icoSuccess = `<svg part="ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM438 209.7C427.3 201.9 412.3 204.3 404.5 215L285.1 379.2L233 327.1C223.6 317.7 208.4 317.7 199.1 327.1C189.8 336.5 189.7 351.7 199.1 361L271.1 433C276.1 438 282.9 440.5 289.9 440C296.9 439.5 303.3 435.9 307.4 430.2L443.3 243.2C451.1 232.5 448.7 217.5 438 209.7z"/></svg>`
const icoError   = `<svg part="ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384zM320 192C301.8 192 287.3 207.5 288.6 225.7L296 329.7C296.9 342.3 307.4 352 319.9 352C332.5 352 342.9 342.3 343.8 329.7L351.2 225.7C352.5 207.5 338.1 192 319.8 192z"/></svg>`;
// #endregion

/* EXAMPLE
<toast-stack style="position:fixed; bottom:10px; right:10px; width:300px;"/>
*/

export default class ToastStack extends HTMLElement{
    // #region MAIN
    constructor(){
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
            :host{
                display: flex; flex-direction: column; gap: 5px;
                box-sizing  : border-box;
                padding     : 20px;
                user-select : none;
            }

            :host svg{ height: 20px; shape-rendering: geometricPrecision; align-self: start; }


            .flexRow{ display:flex; flex-direction:row; align-items:center; }


            /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            BASIC TOAST */

            .grid{
                display: grid; gap: 5px; align-items: center;
                grid-template-columns : auto 1fr;
                grid-template-rows    : 1fr;
            }

            :host > section{
                box-sizing : border-box;
                cursor     : pointer;
                position   : relative;

                /* CLOSED STATE */
                opacity    : 0;
                transform  : translateY(50vh);
                transition-property : opacity translate transform;
                transition-duration : 0.5s;
                transition-behavior : allow-discrete;
                /*transition-timing-function: ease-in-out;*/
            }

            :host > section[open]{
                transform : translateY(0);
                opacity   : 1;
                @starting-style{
                    transform : translateY(50vh);
                    opacity   : 0;
                }
            }

            /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            PROGRESS TOAST */
            [part~="progress"]{ display: grid; }
            [part="progress-fill"]{ grid-area: 1 / 1; justify-self: start; height: 100%; }
            [part="progress-text"]{ grid-area: 1 / 1; z-index: 1; align-self: center; justify-self: start; }

            /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            INFINITE TOAST */
            .textLoading {
                color: black; font-size:15px;
                box-sizing: border-box;
                overflow: hidden; white-space: nowrap;
                border-right: var(--cursor-size, 12px) solid var(--cursor-col, black);
                animation:
                    typing 3s steps(30, end) infinite,
                    blink-caret 0.75s step-end infinite;
            }

            @keyframes typing {
                0% { width: 0 }
                50%, 100% { width:100%; }
            }

            @keyframes blink-caret {
                from, to { border-color: transparent }
                50% { border-color: var(--cursor-col, black); }
            }
        </style>`;
    }
    // #endregion

    // #region LIFECYCLE
    // connectedCallback(){}
    // disconnectedCallback(){} // Custom element removed from page
    // adoptedCallback(){} // Custom element moved to new page

    // called when attributes are changed
    // attributeChangedCallback( name, oldValue, newValue ){
        // console.log( `Attribute ${name} has changed.`, oldValue, newValue );
        // switch( name ){
        //     case 'value': this.value = parseFloat( newValue ); break;
        // }
    // }
    // #endregion

    // #region CREATE TOAST
    #createToast( msg, type ){
        let ico;
        switch( type ){
            case 'success' : ico = icoSuccess; break;
            case 'error'   : ico = icoError; break;
        }

        const frag = document.createRange().createContextualFragment(`
            <section part="toast ${type}" class="grid" open>
                ${ico}
                <span>${msg}</span>
            </section>
        `);

        return frag.children[0];
    }

    #createProgressToast( msg ){
        const frag = document.createRange().createContextualFragment(`
            <section part="toast progress" open>
                <div part="progress-fill" style="width:0%;"></div>
                <span part="progress-text">${msg}</span>
            </section>
        `);

        const fill = frag.querySelector( '[part="progress-fill"]');
        const txt  = frag.querySelector( '[part="progress-text"]');
        const elm  = frag.children[0];

        Object.defineProperty( elm, 'percent', {
            get(){ return parseFloat( fill.style.width ); },
            set( v ){ fill.style.width = `${v}%`; },
            configurable : false,
            enumerable   : true,
        });

        Object.defineProperty( elm, 'message', {
            get(){ return txt.textContent; },
            set( v ){ txt.textContent = v; },
            configurable : false,
            enumerable   : true,
        });

        Object.defineProperty( elm, 'dismiss', {
            value        : ()=>this.#dismiss( elm ),
            configurable : false,
            enumerable   : true,
        });

        return elm;
    }

    // TODO: https://codepen.io/stoepke/pen/QOOqGW
    #createInfiniteToast( msg ){
        const frag = document.createRange().createContextualFragment(`
            <section part="toast infinite" class="flexRow" open>
                <div part="infinite-text" class="textLoading">${msg}</div>
            </section>
        `);

        const elm  = frag.children[0];

        Object.defineProperty( elm, 'message', {
            get(){ return txt.textContent; },
            set( v ){ txt.textContent = v; },
            configurable : false,
            enumerable   : true,
        });

        Object.defineProperty( elm, 'dismiss', {
            value        : ()=>this.#dismiss( elm ),
            configurable : false,
            enumerable   : true,
        });

        return elm;
    }
    // #endregion

    // #region MANAGE TOAST
    #dismiss( elm ){
        // Set to remove after animation
        elm.addEventListener( 'transitionend', ()=>{
            elm.remove(); // this.shadowRoot.removeChild( elm );
        }, { once:true } );

        // Trigger transition
        elm.removeAttribute( 'open' );
    }

    msg( txt, type='success', sec=4 ){
        const elm  = this.#createToast( txt, type );

        if( sec > 0 ){
            elm._timer = setTimeout( ()=>this.#dismiss( elm ), sec * 1000 );
            elm.addEventListener( 'click', ()=>{
                clearTimeout( elm._timer );
                this.#dismiss( elm );
            }, { once:true } );
        }else{
          elm.addEventListener( 'click', ()=>this.#dismiss( elm ), { once:true } );
        }

        this.shadowRoot.appendChild( elm );
    }

    msgProgress( msg='Downloading...' ){
        const elm = this.#createProgressToast( msg );
        this.shadowRoot.appendChild( elm );
        return elm;
    }

    msgInfinite( msg='Downloading...' ){
        const elm = this.#createInfiniteToast( msg );
        this.shadowRoot.appendChild( elm );
        return elm;
    }
    // #endregion
}

customElements.define( 'toast-stack', ToastStack );
