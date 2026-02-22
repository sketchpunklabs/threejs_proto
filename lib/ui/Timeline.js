/*
<time-line id="timeline" style="margin:20px;" value="3.2" />
window.addEventListener( 'load', async ()=>{
    const scrubber = document.getElementById('timeline');

    scrubber.addTrack( 'Layer1',[
        { name: 'Test One Two Three', start: 1, duration: 1 },
        { name: 'Clip', start: 4, duration: 10 }
    ]);

    // scrubber.addEventListener( 'input', e=>console.log( 'input', e.detail ) );
    // scrubber.addEventListener( 'change', e=>console.log( 'change', e.detail ) );
    // setTimeout( ()=>{ scrubber.value = 6.5 }, 1000 );
}
*/

export default class Timeline extends HTMLElement{
// #region MAIN
    static observedAttributes = [ 'value' ];

    #zoom       = 1;
    #isDragging = false;
    #value      = 0;
    #tracks     = [];

    #numMax     = 10;
    #numStep    = 1;
    #pxMajor    = 50;   // Pixels per Unit
    #pxDiv      = 5;    // Sub Divide per unit

    #obsResize  = null;

    #elmMain       = null;
    #elmSide       = null;
    #elmHead       = null;
    #elmContent    = null;
    #elmSvg        = null;
    #elmScrub      = null;
    #elmMainScroll = null;
    #elmHeadScroll = null;
    #elmValueLbl   = null;

    constructor(){
        super();
        this.attachShadow({ mode: 'open' });

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host{
                display:flex; flex-direction: column;
                box-sizing: border-box;
                background: #1a1a1a;
                position: relative;
                border-radius: 6px;
                border: 1px solid #505050;
                overflow: hidden;
                font-family: monospace;

                --side-width: 70px;
                --header-height: 25px;
            }

            ::-webkit-scrollbar{ width: 10px; height: 10px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb{ background: rgba(121, 121, 121, 0.4); }
            ::-webkit-scrollbar-thumb:hover{ background: rgba(100, 100, 100, 0.7); }
            ::-webkit-scrollbar-corner { background: transparent; }
            /* Firefox Support */
            * { scrollbar-width: thin; scrollbar-color: rgba(121, 121, 121, 0.4) transparent; }

            header{
                display:flex; flex-direction: row;
                overflow: hidden;
                z-index: 30;
                cursor: ew-resize;
                background: #222;
                border-bottom: 1px solid #555;
                flex: 0 0 var(--header-height);
            }

            header > div{ overflow: hidden; }
            header > aside{ display:flex; flex-direction:row; align-items:center; justify-content:center;
                color: white; font-size:13px;
            }

            svg{
                user-select: none; height: var(--header-height);
                display: block; box-sizing: border-box;
            }

            aside{
                min-width: var(--side-width);
                z-index: 30;
                background: #2a2a2a;
                border-right: 1px solid #555;
                overflow: hidden;
            }

            main{
                overflow: hidden;
                display: flex; flex-direction: row;
                flex: 1 1 auto;
            }

            section{
                box-sizing: border-box;
                display: flex; flex-direction: column;
                flex: 1 1 auto;
                overflow: auto;
            }

            #content{
                display:flex; flex-direction:column;
                width: 100%;
                width:max-content;
                min-width:100%;
            }

            .track{
                border-bottom: 1px solid #555;
                position: relative;
                box-sizing: border-box;
                min-height: 30px;
                position: relative;

                min-width: 100%;
                display: flex; flex-direction: row;
                align-items: center;
            }

            .track span{
                display:flex; flex-direction: row; align-items: center;
                position: absolute; top: 4px; bottom: 4px;
                background: #3498db;
                border-radius: 3px;
                user-select: none;
                min-width: 0px;
                min-height:0px;
            }

            .track span b{
                display:block;
                margin-left:5px;
                margin-right:5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-weight: 400;
                color: #eee;
            }

            .track label{
                color: #ddd;
                margin-left: 10px;
                user-select: none;
            }

            #scrub{
                position: absolute; top: 0; left: 0; bottom:0px;
                width: 1px;
                background: lime;
                z-index: 50;
                pointer-events: none;
            }

            .lnMinor{ stroke-width: 1px; stroke: #888; shape-rendering: crispedges; vector-effect: non-scaling-stroke; }
            .lnMajor{ stroke-width: 1px; stroke: #ddd; shape-rendering: crispedges; vector-effect: non-scaling-stroke; }
            .txtMajor{ fill: #aaa; font-size: 11px; font-family: monospace;
                text-rendering: optimizeLegibility;
                font-variant-numeric: tabular-nums;
                -webkit-font-smoothing: antialiased;
            }
        `);
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.innerHTML = `
            <header>
                <aside></aside>
                <div><svg/></div>
            </header>
            <main>
                <aside></aside>
                <section>
                    <div id="content"/>
                </section>
            </main>
            <div id="scrub"/>
        `;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.#elmMain       = this.shadowRoot.querySelector( 'main' );
        this.#elmSide       = this.shadowRoot.querySelector( 'main > aside' );
        this.#elmHead       = this.shadowRoot.querySelector( 'header' );
        this.#elmContent    = this.shadowRoot.querySelector( '#content' );
        this.#elmSvg        = this.shadowRoot.querySelector( 'svg' );
        this.#elmScrub      = this.shadowRoot.querySelector( '#scrub' );
        this.#elmMainScroll = this.shadowRoot.querySelector( 'main > section' );
        this.#elmHeadScroll = this.shadowRoot.querySelector( 'header > div' );
        this.#elmValueLbl   = this.shadowRoot.querySelector( 'header > aside' );

        this.#elmHead.addEventListener( 'pointerdown', this.onPointerDown );
        this.#elmHead.addEventListener( 'pointermove', this.onPointerMove );
        this.#elmHead.addEventListener( 'pointerup', this.onPointerUp );
        this.#elmHead.addEventListener( 'wheel', this.onWheel );

        this.#elmMainScroll.addEventListener( 'scroll', this.onScroll );

        this.#obsResize = new ResizeObserver( this.onResize );
        this.#obsResize.observe( this.#elmMain );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // if( this.hasAttribute( "value" ) )  this.#value = parseFloat( this.getAttribute( "value" ) );
        // this.renderScubber();
    }
// #endregion

// #region LIFECYCLE
    // Custom element added to page
    async connectedCallback(){
        this.renderTracks();
        this.renderTimeline();
        this.renderScubber();
    }

    // Custom element removed from page
    // disconnectedCallback(){}

    // called when attributes are changed
    attributeChangedCallback( name, oldValue, newValue ){
        // console.log( `Attribute ${name} has changed.`, oldValue, newValue );
        switch( name ){
            case 'value': this.value = parseFloat( newValue ); break;
        }
    }

    // Custom element moved to new page
    // adoptedCallback(){}
// #endregion

// #region EVENTS
    emit( evtName, evtData ){
        this.dispatchEvent( new CustomEvent( evtName, {
            detail      : evtData,
            bubbles     : true,
            cancelable  : true,
            composed    : false,
        } ) );
    }

    onScroll = ()=>{
        // Make timeline matchup with tracks
        this.#elmHeadScroll.scrollLeft = this.#elmMainScroll.scrollLeft;
        this.renderScubber();
    };

    onWheel = e=>{
        if( !e.shiftKey ) return;

        const tick = Math.sign( e.deltaY );
        this.#zoom = Math.max( 0.2, this.#zoom + ( 0.2 * tick ) );

        this.renderTimeline();
        this.renderScubber();
        this.renderTracks();
    };

    onPointerDown = e=>{
        this.#isDragging = true;
        this.#elmHead.setPointerCapture( e.pointerId );
    };

    onPointerMove = e=>{
        if( !this.#isDragging ) return;
        this.onScrub( e );
        this.emit( 'input', this.#value );
    };

    onPointerUp = e=>{
        this.#isDragging = false;
        this.#elmHead.releasePointerCapture( e.pointerId );
        this.onScrub( e );

        this.emit( 'input', this.#value );
        this.emit( 'change', this.#value );
    };

    onResize = ()=>{
        // Resize to match main of content's scroll width
        const w = Math.max( this.#elmMain.clientWidth, this.#elmContent.scrollWidth );

        if( this.#elmSvg.getAttribute('width') !== String(w) ){
            this.#elmSvg.setAttribute('width', w );
            this.renderTracks();
            this.renderTimeline();
            this.renderScubber();
        }
    };

    onScrub = e=>{
        const rect = this.#elmSvg.getBoundingClientRect();
        const x    = Math.max( 0, e.clientX - rect.left + this.#elmHead.scrollLeft );
        const v    = Math.min( x / ( this.#pxMajor * this.#zoom ), this.#numMax );

        this.#value = v;
        this.renderScubber();
        // console.log( v );
    };
// #endregion

// #region RENDERING
    renderTimeline(){
        const svg   = this.#elmSvg;
        const width = parseInt( svg.getAttribute( 'width' ) );
        const major = this.#pxMajor * this.#zoom;
        let px, ln, txt;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // MAJOR LINES
        svg.innerHTML = '';
        for( let i=1; i <= this.#numMax; i+= this.#numStep ){
            px = Math.round( i * major ) + 0.5;

            ln = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );
            ln.setAttribute( 'x1', px );
            ln.setAttribute( 'y1', 5 );
            ln.setAttribute( 'x2', px );
            ln.setAttribute( 'y2', 25 );
            ln.setAttribute( 'class', 'lnMajor' ); // ln.classList.add( 'lnMajor' );
            svg.appendChild( ln );


            txt = document.createElementNS( 'http://www.w3.org/2000/svg', 'text' );
            txt.setAttribute( 'x', px + 4 );
            txt.setAttribute( 'y', 13 );
            txt.setAttribute( 'class', 'txtMajor' );
            txt.textContent = i;
            svg.appendChild( txt );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // MINOR LINES
        const pxInc = major / this.#pxDiv;
        const iMax  = this.#numMax * this.#pxDiv;
        for( let i=1; i < iMax; i++ ){
            px = Math.round( i * pxInc ) + 0.5;
            if( (i % this.#pxDiv) === 0 ) continue;

            ln = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );
            ln.setAttribute( 'x1', px );
            ln.setAttribute( 'y1', 16 );
            ln.setAttribute( 'x2', px );
            ln.setAttribute( 'y2', 25 );
            ln.setAttribute( 'class', 'lnMinor' );
            svg.appendChild( ln );
        }
    }

    renderScubber(){
        const scroll = this.#elmHeadScroll.scrollLeft;
        const rect   = this.#elmSide.getBoundingClientRect();
        const x      = rect.width + this.#value * ( this.#pxMajor * this.#zoom ) - scroll;

        this.#elmScrub.style.transform = `translateX(${x}px)`;
        this.#elmValueLbl.innerHTML    = this.#value.toFixed(2);
    }

    renderTracks(){
        const major = this.#pxMajor * this.#zoom;
        let p, w, wMax = 0;

        this.#elmContent.innerHTML = '';
        this.#elmSide.innerHTML    = '';

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=0; i < this.#tracks.length; i++ ){
            // -------------------------------------
            // Build track container
            const trk = this.#tracks[ i ];
            const div = document.createElement( 'div' );
            div.classList.add( 'track' );
            this.#elmContent.appendChild( div );

            const div2 = document.createElement( 'div' );
            div2.classList.add( 'track' );
            this.#elmSide.appendChild( div2 );

            const lbl = document.createElement( 'label' );
            lbl.innerHTML = trk.name;
            div2.appendChild( lbl );

            // -------------------------------------
            // Build Clips
            for( let c of trk.clips ){
                const span = document.createElement( 'span' );
                const b    = document.createElement( 'b' );
                p                = c.start * major;
                w                = c.duration * major;
                // span.innerText   = c.name;
                span.style.left  = `${p}px`;
                span.style.width = `${w}px`;
                b.innerText      = c.name;
                span.appendChild( b );
                div.appendChild( span );

                wMax = Math.max( wMax, p+w );
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( const c of this.#elmContent.children ){
            c.style.width = `${wMax}px`;
        }

        // Need to set width to make timeline scrollable with the tracks
        this.#elmSvg.style.width = `${Math.max( major * this.#numMax + 20, wMax )}`;
    }
// #endregion

// #region METHODS
    addTrack( name, clips ){
        const ary = [];

        for( const c of clips ){
            ary.push({
                name        : '',
                start       : 0,
                duration    : 1,
                ...c,
            });
        }

        this.#tracks.push( { name, clips:ary } );
        this.renderTracks();
        return this;
    }
// #endregion

// #regin GETTER / SETTER
    set value( v ){ this.#value = v; this.renderScubber(); }
    get value(){ return this.#value; }

    set max( v ){ this.#numMax = v; this.renderTimeline(); }
// #endregion

}

customElements.define( 'time-line', Timeline );
