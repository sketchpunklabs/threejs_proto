// #region IMPORTS
// NOTE: "three" must map to three.webgpu.js or .min.js globally to prevent 
// certain errors/warnings from showing up
import * as THREE           from 'three';
import { OrbitControls }    from 'OrbitControls';
export { THREE };
// #endregion

// #region OPTIONS
export function useDarkScene( tjs, props={} ){
    const pp = Object.assign( { ambient:0x404040, grid:true }, props );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set( 4, 10, 1 );
    tjs.scene.add( light );
    
    tjs.scene.add( new THREE.AmbientLight( pp.ambient ) );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Floor : For grid to work correctly, need import from three needs to globally point to gpu version
    // else there will be errors about grid material not supporting NodeMaterial
    if( pp.grid ) tjs.scene.add( new THREE.GridHelper( 20, 20, 0x0c610c, 0x444444 ) );        

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Renderer
    tjs.renderer.setClearColor( 0x3a3a3a, 1 );
    return tjs;
};
// #endregion

export default function useForcedWebGL( props ){
    props = Object.assign( {
        // colorMode       : false,
        // shadows         : false,
        preserverBuffer : false,
        power           : '',
    }, props );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // RENDERER
    const options = {
        forceWebGL              : true, 
        antialias               : true,
        preserveDrawingBuffer   : props.preserverBuffer,
        powerPreference         : ( props.power === '')      ? 'default' : 
                                  ( props.power === 'high' ) ? 'high-performance' : 'low-power',
    };

    const canvas    = document.createElement( 'canvas' );
    options.canvas  = canvas;
    options.context = canvas.getContext( 'webgl2',  { preserveDrawingBuffer: props.preserverBuffer } );

    const renderer  = new THREE.WebGPURenderer( options );
    renderer.setPixelRatio( Math.max( 1, window.devicePixelRatio ) );
    renderer.setClearColor( 0x3a3a3a, 1 );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.setAnimationLoop( animation );

    document.body.appendChild( renderer.domElement );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // CORE
    const scene   = new THREE.Scene();    
    const clock   = new THREE.Clock();
    clock.start();

    const camera  = new THREE.PerspectiveCamera( 45, 1.0, 0.01, 1000 );
    camera.position.set( 0, 5, 20 );

    const camCtrl = new OrbitControls( camera, renderer.domElement );
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METHODS
    let self;   // Need to declare before methods for it to be useable

    const render = ( onPreRender=null, onPostRender=null ) =>{
        const deltaTime   = clock.getDelta();
        const ellapseTime = clock.getElapsedTime();

        if( onPreRender )  onPreRender( deltaTime, ellapseTime );
        renderer.render( scene, camera );
        if( onPostRender ) onPostRender( deltaTime, ellapseTime );
        return self;
    };

    const renderLoop = ()=>{
        window.requestAnimationFrame( renderLoop );
        render();
        return self;
    };

    const createRenderLoop = ( fnPreRender=null, fnPostRender=null )=>{
        let   reqId = 0;
        const rLoop = {
            stop        : ()=>window.cancelAnimationFrame( reqId ),
            start       : ()=>rLoop.onRender(),
            onRender    : ()=>{
                render( fnPreRender, fnPostRender );
                reqId = window.requestAnimationFrame( rLoop.onRender );
            },
        };
        return rLoop;
    };

    const sphericalLook = ( lon, lat, radius, target=null )=>{
        const phi 	= ( 90 - lat )  * Math.PI / 180;
        const theta = ( lon + 180 ) * Math.PI / 180;

        camera.position.set(
            -(radius * Math.sin( phi ) * Math.sin(theta)),
            radius * Math.cos( phi ),
            -(radius * Math.sin( phi ) * Math.cos(theta))
        );

        if( target ) camCtrl.target.fromArray( target );
        camCtrl.update();
        return self;
    };

    const resize = ( w=0, h=0 )=>{
        const W = w || window.innerWidth;
        const H = h || window.innerHeight;

        renderer.setSize( W, H );           // Update Renderer

        camera.aspect = W / H;              // Update Camera
        camera.updateProjectionMatrix();
        return self;
    };

    const getBufferSize = ()=>{ return renderer.getDrawingBufferSize( new THREE.Vector2() ).toArray(); };

    const debugMaterial = ( mesh )=>{ return renderer.debug.getShaderAsync( scene, camera, mesh ); }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    window.addEventListener( 'resize', ()=>resize() );
    resize();

    return self = {
        renderer,
        scene,
        camera,
        camCtrl,

        render,
        renderLoop,
        createRenderLoop,
        sphericalLook,
        resize,
        getBufferSize,
        debugMaterial,
    };
}