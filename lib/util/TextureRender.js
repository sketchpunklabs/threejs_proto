import * as THREE from 'three';

/*
const tRender = new TextureRender()
    .fromMaterial( new FBMMaterial( {texGrad:grad}) )
    .render( App.renderer );

const img = tRender.toImg( App.renderer, false );
document.body.appendChild( img );

const mesh = new THREE.Mesh( geo, new THREE.MeshBasicMaterial( { map: tRender.tex } ) );
 */

export default class TextureRender{
    // #region MAIN
    scene    = new THREE.Scene();                                     // Contain our quad
    camera   = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );    // Need a camera to render
    quad     = new THREE.Mesh( new THREE.PlaneGeometry(2, 2), null ); // Quad to render material to
    targ     = null;
    #isFloat = false;
    #render  = null;

    constructor( w=512, h=512, useFloat=false, isNear=false ){
        this.scene.add( this.quad );

        const opt = {
            minFilter   : THREE.LinearFilter,
            magFilter   : THREE.LinearFilter,
            format      : THREE.RGBAFormat,
            type        : THREE.UnsignedByteType,
            depthBuffer : false,
        };

        if( useFloat ){
            this.#isFloat   = true;
            opt.type        = THREE.HalfFloatType;
        }

        if( isNear ){
            opt.minFilter   = THREE.NearestFilter;
            opt.magFilter   = THREE.NearestFilter;
        }

        this.targ = new THREE.WebGLRenderTarget( w, h, opt );
        this.targ.texture.colorSpace = THREE.SRGBColorSpace;
    }
    // #endregion

    // #region GETTER / SETTER
    get tex(){ return this.targ.texture; }

    fromMaterial( mat ){ this.quad.material = mat; return this; }
    // #endregion

    // #region METHODS
    render( renderer ){
        if( !this.#render ) this.#render = renderer;
        if( !renderer )     renderer = this.#render;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Backup renderer's current settings
        const bakRatio = renderer.getPixelRatio();
        const bakSize  = renderer.getSize( new THREE.Vector2() );
        const bakTarg  = renderer.getRenderTarget();

        // Set Renderer up
        renderer.setPixelRatio( 1 );
        renderer.setSize( this.targ.width, this.targ.height, false ); // 'false' prevents canvas DOM element resizing
        renderer.setRenderTarget( this.targ );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Render & Cleanup
        renderer.render( this.scene, this.camera );

        renderer.setRenderTarget( bakTarg );
        renderer.setPixelRatio( bakRatio );
        renderer.setSize( bakSize.x, bakSize.y, false );

        this.targ.texture.needsUpdate = true;
        return this;
    }

    dispose( incTex=true ){
        this.quad.geometry.dispose();
        if( incTex ) this.targ.texture.dispose();
        this.targ.dispose();
    }
    // #endregion

    // #region CONVERSION
    toImg( renderer, flip=false ){
        if( this.#isFloat ){ console.error( 'TextureRender.toImg : Float support unimplemented' ); return null; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Allocate space & pull
        const w     = this.targ.width;
        const h     = this.targ.height;
        const pxBuf = new Uint8Array( w * h * 4 ); // Space for RGBA per pixel

        renderer.readRenderTargetPixels( this.targ, 0, 0, w, h, pxBuf );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create a temp canvas to turn draw data into an image
        const canImg  = document.createElement( 'canvas' );
        canImg.width  = w;
        canImg.height = h;
        const ctxImg  = canImg.getContext( '2d' );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If requested, do a yflip of the texture. Scale is only
        // works when drawing from a source & not raw pixel buffer
        if( flip ){
            // Create temp canvas to hold raw data & make a source of it
            const canFlip  = document.createElement( 'canvas' );
            canFlip.width  = w;
            canFlip.height = h;

            const ctxFlip = canFlip.getContext( '2d' );
            const id      = canFlip.createImageData( w, h );
            id.data.set( pxBuf )
            ctxFlip.putImageData( id, 0, 0 );

            // Redraw texture upside down into main canvas
            ctxImg.translate( 0, h );
            ctxImg.scale( 1, -1 );
            ctxImg.drawImage( canFlip, 0, 0 );

            // Cleanup
            canFlip.width  = 0;
            canFlip.height = 0;
        }else{
            // NO Flip, render as is
            const id = ctxImg.createImageData( w, h );
            id.data.set( pxBuf )
            ctxImg.putImageData( id, 0, 0 );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Cleanup
        const img = document.createElement( 'img' );
        img.src   = canImg.toDataURL( 'image/png' );

        canImg.width  = 0;
        canImg.height = 0;
        return img;
    }
    // #endregion
}
