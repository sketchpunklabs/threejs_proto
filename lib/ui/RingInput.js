export default class RingInput extends HTMLElement {
    // #region MAIN
    static MODE_JOY = 'joy';
    static MODE_DIR = 'dir';
    static MODE_ARC = 'arc';

    static observedAttributes = ['mode', 'auto-center'];

    #svg;
    #grpBG;
    #grpPnt;
    #txtCenter;
    #elmPnt0;

    #resizeObs    = null;
    #paddingX     = 0;
    #paddingY     = 0;

    #pointerId    = null;
    #activeHandle = null;   // Active target in Mode 3 ('start' | 'end') or 'joystick'

    // State Data
    #mode        = RingInput.MODE_JOY;
    #autoCenter  = false;

    // Coordinates / Angles
    #xy          = [0, 0];      // Normalized [-1..1]
    #startAngle  = 0;           // Radians (0 to 2PI)
    #endAngle    = Math.PI / 2; // Radians (0 to 2PI)

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --ring-fill     : #1e222d;
                    --ring-stroke   : #31374a;
                    --ring-width    : 3;
                    --bg            : #11131a;

                    --pnt-fill      : #3b82f6;
                    --pnt-fill-on   : #ffffff;

                    display     : inline-block;
                    box-sizing  : border-box;
                    user-select : none;
                    background-color: var(--bg);
                    width       : 100px;
                    height      : 100px;
                }

                svg {
                    display: block; width: 100%; height: 100%;
                    min-width: 0px; min-height: 0px;
                    box-sizing: border-box;
                }

                .anchor{
                    cursor          : grab;
                    fill            : var(--pnt-fill);
                    r               : 6px;

                    &:active{ cursor: grabbing; }
                    &:hover{ fill: var(--pnt-fill-on) }
                }

                .ring-bg{
                    fill         : var(--ring-fill);
                    stroke       : var(--ring-stroke);
                    stroke-width : var(--ring-width);
                }

                .ring-arc{
                    fill            : none;
                    stroke          : #3b82f6;
                    stroke-width    : 14;
                    stroke-linecap  : round;
                }

                text{
                    font-family: monospace;
                    font-size: 14px;
                    fill: #ffffff;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                }
            </style>
            <svg part="svg" xmlns="http://www.w3.org/2000/svg">
                <g class="g-bg"></g>
                <text class="g-txt" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"></text>

                <g class="g-pnts">
                    <circle cx="76" cy="50.203125" class="anchor" id="pnt_start"></circle>
                </g>
            </svg>
        `;

        const sr = this.shadowRoot;
        this.#svg       = sr.querySelector('svg');
        this.#grpBG     = sr.querySelector('.g-bg');
        this.#grpPnt    = sr.querySelector('.g-pnts');
        this.#txtCenter = sr.querySelector('.g-txt');

        this.#elmPnt0   = sr.querySelector('[id=pnt_start]');

        // Event Listeners
        this.#svg.addEventListener( 'pointerdown', this.#onPointerDown );
        this.#svg.addEventListener( 'pointermove', this.#onPointerMove );
        this.#svg.addEventListener( 'pointerup',   this.#onPointerUp );
        // this.addEventListener('contextmenu', e => { e.preventDefault(); toClipboard(JSON.stringify(this.value)); });

        this.#mode       = this.getAttribute( 'mode' ) || RingInput.MODE_JOY;
        this.#autoCenter = this.hasAttribute( 'auto-center' );

        if( this.#mode === RingInput.MODE_DIR ) this.#xy[0] = 1;
    }
    // #endregion

    // #region BASE OVERRIDES
    connectedCallback(){
        this.#resizeObs = new ResizeObserver(() => this.#redraw());
        this.#resizeObs.observe(this);
        this.#redraw();
    }

    disconnectedCallback(){ this.#resizeObs?.disconnect(); }

    attributeChangedCallback( name, oldValue, newValue ){
        if (oldValue === newValue) return;
        switch (name) {
            case 'mode':
                this.#mode = newValue;
                this.#redraw();
                break;
            case 'auto-center':
                this.#autoCenter = newValue !== null;
                break;
        }
    }
    // #endregion

    // #region COORDINATE SYSTEM
    #getSize(){
        const r = this.#svg.getBoundingClientRect();
        return [r.width || 300, r.height || 300];
    }

    #evtPos( e ){
        const r = this.#svg.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    }

    #n2px( v ){
        const [nx,ny]  = v;
        const [w,h]    = this.#getSize();
        const px       = this.#paddingX;
        const py       = this.#paddingY;
        const ppx      = px * 2;
        const ppy      = py * 2;
        return [
            px + nx * ( w - ppx ),
            py + ( 1 - ny ) * ( h - ppy ),
        ];
    }

    #px2n( v ){
        const [x,y] = v;
        const [w,h] = this.#getSize();
        const px    = this.#paddingX;
        const py    = this.#paddingY;
        const ppx   = px * 2;
        const ppy   = py * 2;
        const nx    = (( x - px ) / ( w - ppx ));
        const ny    = 1 - (( y - py ) / ( h - ppy )); // Invert Y
        return [
            Math.max( 0, Math.min( 1, nx ) ),
            Math.max( 0, Math.min( 1, ny ) ),
        ];
    }
    // #endregion

    // #region MATH & UTILITIES
    #getCenterAndRadius() {
        const [p0x, p0y] = this.#n2px( [0, 0] );
        const [p1x, p1y] = this.#n2px( [1, 1] );
        const cx         = (p0x + p1x) / 2;
        const cy         = (p0y + p1y) / 2;
        const radius     = Math.min(
            Math.abs( p1x - p0x ),
            Math.abs( p1y - p0y )
        ) / 2 - 10;

        return { cx, cy, radius };
    }

    // #normToCartesian(nx, ny) {
    //     return [(nx - 0.5) * 2, (ny - 0.5) * 2];
    // }

    // #cartesianToNorm(cx, cy) {
    //     return [cx / 2 + 0.5, cy / 2 + 0.5];
    // }

    #getAngleFromCartesian( x, y ){
        let rad = Math.atan2( y, x );
        if (rad < 0) rad += 2 * Math.PI;
        return rad;
    }

    #polarToPx( angleRad, distancePx ){
        const { cx, cy } = this.#getCenterAndRadius();
        return [
            cx + Math.cos( angleRad ) * distancePx,
            cy - Math.sin( angleRad ) * distancePx
        ];
    }

    #pxToAngle( px, py ){
        const { cx, cy } = this.#getCenterAndRadius();
        return this.#getAngleFromCartesian( px - cx, cy - py );
    }
    // #endregion

    // #region RENDERING
    #redraw(){
        this.#redrawBG();
        this.#redrawPnts();
    }

    #redrawBG(){
        const { cx, cy, radius } = this.#getCenterAndRadius();
        this.#grpBG.innerHTML = '';

        // Base Outer Ring
        createElm('circle', {
            cx, cy, r: radius,
            class: 'ring-bg'
        }, this.#grpBG);

        // Render Fill Arc for Mode 3
        if (this.#mode === 'arc') {
            const arcPath = this.#describeArc(cx, cy, radius, this.#startAngle, this.#endAngle);
            createElm('path', {
                d: arcPath,
                class: 'ring-arc'
            }, this.#grpBG);
        }
    }

    #describeArc(x, y, radius, startAngle, endAngle) {
        const startPx = [ x + radius * Math.cos(startAngle), y - radius * Math.sin(startAngle) ];
        const endPx   = [ x + radius * Math.cos(endAngle),   y - radius * Math.sin(endAngle) ];

        let diff = endAngle - startAngle;
        if (diff < 0) diff += 2 * Math.PI;
        const largeArcFlag = diff > Math.PI ? 1 : 0;

        return [
            "M", startPx[0], startPx[1],
            "A", radius, radius, 0, largeArcFlag, 0, endPx[0], endPx[1]
        ].join(" ");
    }

    #redrawPnts(){
        // this.#grpPnt.innerHTML = '';
        const { cx, cy, radius } = this.#getCenterAndRadius();

        switch( this.#mode ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case RingInput.MODE_JOY:
            case RingInput.MODE_DIR:
                this.#elmPnt0.setAttribute( 'cx', cx + this.#xy[ 0 ] * radius );
                this.#elmPnt0.setAttribute( 'cy', cy - this.#xy[ 1 ] * radius );
                this.#updateText();
            break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case RingInput.MODE_ARC:
                // Start Handle (Red)
                // const [sX, sY] = this.#polarToPx(this.#startAngle, radius);
                // createElm('circle', {
                //     cx: sX, cy: sY, r: 8,
                //     fill: '#ef4444', class: 'anchor', id: 'pnt_start'
                // }, this.#grpPnt);

                // // End Handle (Green)
                // const [eX, eY] = this.#polarToPx(this.#endAngle, radius);
                // createElm('circle', {
                //     cx: eX, cy: eY, r: 8,
                //     fill: '#22c55e', class: 'anchor', id: 'pnt_end'
                // }, this.#grpPnt);
            break;
        }
    }

    #updateText(){
        switch( this.#mode ){
            case RingInput.MODE_DIR:{
                const deg = Math.round( this.angle );
                this.#txtCenter.textContent = `${deg}`; //°
            break; }

            case RingInput.MODE_JOY:{
                if( this.#pointerId !== null ){
                    const xStr = this.#xy[0].toFixed(1);
                    const yStr = this.#xy[1].toFixed(1);
                    this.#txtCenter.textContent = `${xStr}:${yStr}`;
                }else{
                    this.#txtCenter.textContent = '';
                }
            break; }
        }
    }
    // #endregion

    // #region EVENT HANDLERS
    #onPointerDown = e => {
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        e.preventDefault();
        const epos               = this.#evtPos( e );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this.#mode === RingInput.MODE_ARC ){
            // TODO FIX UP
            // if (e.target.id === 'pnt_start')    this.#activeHandle = 'start';
            // else if (e.target.id === 'pnt_end') this.#activeHandle = 'end';
            // else {
            //     // Point closest angle to start or end handle
            //     const clickAngle = this.#pxToAngle(epos[0], epos[1]);
            //     const diffS = Math.abs(clickAngle - this.#startAngle);
            //     const diffE = Math.abs(clickAngle - this.#endAngle);
            //     this.#activeHandle = (diffS < diffE) ? 'start' : 'end';
            //     this.#updatePositionFromPointer(epos);
            // }

        } else {
            this.#activeHandle = RingInput.MODE_JOY;
            this.#updatePositionFromPointer( epos );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.#svg.setPointerCapture( e.pointerId );
        this.#pointerId = e.pointerId;
        this.#emit('input');
    }

    #onPointerMove = e => {
        if( this.#pointerId === null ) return;
        const epos = this.#evtPos(e);
        this.#updatePositionFromPointer( epos );
        this.#emit( 'input' );
    }

    #onPointerUp = e => {
        if( this.#pointerId === null ) return;

        this.#svg.releasePointerCapture( this.#pointerId );
        this.#pointerId  = null;;

        if( this.#mode === RingInput.MODE_JOY && this.#autoCenter ){
            this.#xy[0] = 0;
            this.#xy[1] = 0;
        }

        this.#redrawPnts();
        this.#emit('input').#emit('change');
    }

    #updatePositionFromPointer( epos ){
        const { cx, cy, radius } = this.#getCenterAndRadius();
        const dx = epos[0] - cx;
        const dy = -(epos[1] - cy); // Invert SVG Y axis

        switch( this.#mode ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case RingInput.MODE_JOY:{
                const dist        = Math.hypot( dx, dy );
                const clampedDist = Math.min( dist, radius );
                const angle       = Math.atan2( dy, dx );

                this.#xy[0] = ( Math.cos( angle ) * clampedDist ) / radius;
                this.#xy[1] = ( Math.sin( angle ) * clampedDist ) / radius
            break; }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case RingInput.MODE_DIR:{
                const angle = Math.atan2( dy, dx );
                this.#xy[0] = Math.cos( angle );
                this.#xy[1] = Math.sin( angle );
            break; }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case RingInput.MODE_ARC:{
                const angle = this.#getAngleFromCartesian( dx, dy );
                switch( this.#activeHandle ){
                    case 'start' : this.#startAngle = angle; break;
                    case 'end'   : this.#endAngle   = angle; break;
                }
            break; }
        }

        this.#redrawPnts();
    }
    // #endregion

    // #region HELPERS
    #emit( evtType ){
        this.dispatchEvent( new CustomEvent( evtType, {
            bubbles    : true,
            cancelable : true,
            composed   : true,
            detail     : { target: this, value: this.value }
        }));
        return this;
    }
    // #endregion

    // #region GETTERS / SETTERS
    get angle(){
        const rad = Math.atan2( this.#xy[1], this.#xy[0] );
        const deg = rad * (180 / Math.PI);
        return deg < 0 ? deg + 360 : deg;
    }

    get radians(){
        const rad = Math.atan2( this.#xy[1], this.#xy[0] );
        return rad < 0 ? rad + 2 * Math.PI : rad;
    }

    get value() {
        if( this.#mode === RingInput.MODE_ARC ){
            const startDeg = this.#startAngle * (180 / Math.PI);
            const endDeg   = this.#endAngle * (180 / Math.PI);

            let arcAngle = endDeg - startDeg;
            if(arcAngle < 0) arcAngle += 360;

            return {
                startAngle : startDeg,
                endAngle   : endDeg,
                arcAngle   : arcAngle
            };
        }

        // if( this.#fixedSize > 0 ){
        //     x = parseFloat( x.toFixed( this.#fixedSize ) );
        //     y = parseFloat( y.toFixed( this.#fixedSize ) );
        //     z = parseFloat( z.toFixed( this.#fixedSize ) );
        // }

        return this.#xy.slice();
    }

    set value(v) {
        // if (this.#mode === 'arc' && typeof v === 'object') {
        //     if (v.startAngle !== undefined) this.#startAngle = v.startAngle * (Math.PI / 180);
        //     if (v.endAngle !== undefined) this.#endAngle = v.endAngle * (Math.PI / 180);
        // } else if (Array.isArray(v) && v.length >= 2) {
        //     this.#xy = [
        //         Math.max(-1, Math.min(1, parseFloat(v[0]) || 0)),
        //         Math.max(-1, Math.min(1, parseFloat(v[1]) || 0))
        //     ];
        // }
        // this.#redraw();
    }
    // #endregion
}

customElements.define('ring-input', RingInput);

function createElm(tag, attrib, parent = null) {
    const elm = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrib)) elm.setAttributeNS(null, k, v);
    parent?.appendChild(elm);
    return elm;
}
