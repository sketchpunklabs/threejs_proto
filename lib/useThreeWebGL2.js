// #region IMPORTS
import * as THREE        from 'three';
import { OrbitControls } from 'OrbitControls'; // 'three/examples/jsm/controls/OrbitControls.js';
export { THREE };
// #endregion

/*
<style>
    body, html { padding:0px; margin:0px; width:100%; height:100%; }
    canvas{ display:block; }
</style>

const App = useThreeWebGL2();
App.scene.add( facedCube( [0,3,0], 6 ) );
App
    .sphericalLook( 45, 35, 40 )
    .renderLoop();
*/


// #region OPTIONS
export function useDarkScene( tjs, props={} ){
    const pp = Object.assign( { ambient:0x404040, grid:true }, props );

    // Light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set( 4, 10, 1 );
    tjs.scene.add( light );
    
    tjs.scene.add( new THREE.AmbientLight( pp.ambient ) );
    
    // Floor
    if( pp.grid ){
        const grid = new THREE.GridHelper( 20, 20, 0x0c610c, 0x444444 );
        tjs.scene.add( grid );
    }

    // Renderer
    tjs.renderer.setClearColor( 0x3a3a3a, 1 );
    return tjs;
};

export async function useVisualDebug( tjs ){
    const ary = await Promise.all([
        import( './meshes/DynLineMesh.js' ),
        import( './meshes/ShapePointsMesh.js' ),
    ]);

    const o = {
        reset: ()=>{
            o.ln.reset();
            o.pnt.reset();
        },
    };

    tjs.scene.add( ( o.ln  = new ary[ 0 ].default ) );
    tjs.scene.add( ( o.pnt = new ary[ 1 ].default ) );

    o.ln.renderOrder    = 1000;
    o.ln.frustumCulled  = false;
    o.pnt.renderOrder   = 1001;
    o.pnt.frustumCulled = false;

    o.ln.material.depthTest  = false;
    o.pnt.material.depthTest = false;
    return o;
}
// #endregion

// #region MAIN
export default function useThreeWebGL2( props ){
    props = Object.assign( {
        colorMode       : false,
        shadows         : false,
        preserverBuffer : false,
        power           : '',
    }, props );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // RENDERER
    const options = { 
        antialias               : true, 
        alpha                   : true,
        stencil                 : true,
        depth                   : true,
        preserveDrawingBuffer   : props.preserverBuffer,
        powerPreference         : ( props.power === '')      ? 'default' : 
                                  ( props.power === 'high' ) ? 'high-performance' : 'low-power',
    };

    const canvas    = document.createElement( 'canvas' );
    options.canvas  = canvas;
    options.context = canvas.getContext( 'webgl2',  { preserveDrawingBuffer: props.preserverBuffer, stencil: true } );

    const renderer = new THREE.WebGLRenderer( options );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x3a3a3a, 1 );
    //if( props.preserveDrawingBuffer ){
    // renderer.autoClearColor = false;
    // renderer.autoClearDepth = false;
    // Manual clearing : r.clearColor(); r.clearDepth();
    //}

    if( props.colorMode ){
        // React-Fiber changes the default settings, the defaults can cause issues trying to map colors 1:1
        // https://docs.pmnd.rs/react-three-fiber/api/canvas#render-defaults
        // https://threejs.org/docs/#manual/en/introduction/Color-management

        renderer.outputEncoding = THREE.sRGBEncoding;           // Turns on sRGB Encoding & Gamma Correction :: THREE.LinearEncoding
        renderer.toneMapping    = THREE.ACESFilmicToneMapping;  // Try to make it close to HDR :: THREE.NoToneMapping
        THREE.ColorManagement.legacyMode = false;               // Turns off 3JS's old color manager  :: true
    }

    if( props.shadows ){
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type    = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    }

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
        renderer.render( scene, self.camera );
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
    const getSize = ()=>{ return renderer.getSize( new THREE.Vector2() ).toArray(); };

    // getRenderSize(){
    //     //let w = 0, h = 0, v = { set:(ww,hh)=>{ w=ww; h=hh; } }; // Hacky Three.Vector2
    //     let v = new THREE.Vector2();
    //     this.renderer.getSize( v );
    //     //return [w,h];
    //     return v.toArray();
    // }

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
        getSize,
    };
}
// #endregion