import { Object3D }          from 'three';
import { TransformControls } from 'three/TransformControls.js';

export default function useTransformControl( tjs ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const ctrl    = new TransformControls( tjs.camera, tjs.renderer.domElement );
    const cHelper = ctrl.getHelper();

    ctrl.setSpace( 'local' );
    tjs.scene.add( cHelper );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const self  = {
        o        : ctrl,
        mode     : 'translate',
        onRotate : null,
        onMove   : null,
        onScale  : null,
        onStart  : null,
        onStop   : null,

        show        : ()=>{ ctrl.enabled = true;  cHelper.visible = true;  return self; },
        hide        : ()=>{ ctrl.enabled = false; cHelper.visible = false; return self; },

        attach      : o=>ctrl.attach( o ),
        detach      : ()=>ctrl.detach(),

        setSize     : v=>{ ctrl.setSize( v ); return self; },
        setMode     : m=>{
            switch( m ){
                case 'ztwist':
                    ctrl.setMode( 'rotate' );
                    ctrl.showX = false;
                    ctrl.showY = false;
                    ctrl.showZ = true;
                    break;
                case 'yscale':
                    ctrl.setMode( 'scale' );
                    ctrl.showX = false;
                    ctrl.showY = true;
                    ctrl.showZ = false;
                    break;
                default:
                    ctrl.setMode( m );
                    ctrl.showX = true;
                    ctrl.showY = true;
                    ctrl.showZ = true;
                    break;
            }

            self.mode = m;
            return this;
        },

        toTranslate : ()=>{ ctrl.setMode( 'translate' ); return self; },
        toRotate    : ()=>{ ctrl.setMode( 'rotate' ); return self; },

        toLocal     : ()=>{ ctrl.setSpace( 'local' ); return self; },
        toWorld     : ()=>{ ctrl.setSpace( 'world' ); return self; },

        getPos      : p=>{ return ( ctrl.object )? ctrl.object.position.toArray() : [0,0,0]; },
        setPos      : p=>{
            if( ctrl.object ) ctrl.object.position.fromArray( p );
            return self;
        },

        show        : ( pos=null, quat=null )=>{
            if( ctrl.object ){
                if( pos ) ctrl.object.position.fromArray( pos );
                if( quat ) ctrl.object.quaternion.fromArray( quat );
            }

            cHelper.visible = true;
            ctrl.enabled    = true;
        },

        hide        : ()=>{ 
            cHelper.visible = false;
            ctrl.enabled    = false;
            return self;
        },

        reset       : ( pos=null, quat=null, scl=null )=>{
            if( ctrl.object ){
                ctrl.object.position.fromArray( pos ?? [0,0,0] );
                ctrl.object.quaternion.fromArray( quat ?? [0,0,0,1] );
                ctrl.object.scale.fromArray( scl ?? [1,1,1] );
            }
            return this;
        },

        useDetachless : ()=>{
            if( !self.obj ){
                self.obj = new Object3D(); 
                tjs.scene.add( self.obj ); // Object must be in scene to avoid errors
            }

            ctrl.attach( self.obj );
            return self;
        },

        get dragging(){ return ctrl.dragging; },
        get visible(){ return cHelper.visible; }
    };

    const onDragChange = e=>{
        if( tjs.camCtrl ) tjs.camCtrl.enabled = !e.value;

        if( e.value && self.onStart )      self.onStart();
        else if( !e.value && self.onStop ) self.onStop();
    };

    const onChange = ()=>{
        const o = ctrl.object;
        if( !( o && ctrl.dragging ) ) return;

        switch( ctrl.mode ){
            case 'translate':
                if( self.onMove )   self.onMove( o.position.toArray() );
                break;

            case 'rotate':
                if( self.onRotate ) self.onRotate( o.quaternion.toArray() );
                break;

            case 'scale':
                if( self.onScale ) self.onScale( o.scale.toArray() );
                break;
        }
    };

    ctrl.addEventListener( 'dragging-changed', onDragChange );
    ctrl.addEventListener( 'change', onChange );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return self;
}