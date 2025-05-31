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
        onRotate : null,
        onMove   : null,
        onStart  : null,
        onStop   : null,

        show        : ()=>{ ctrl.enabled = true; cHelper.visible = true; return self; },
        hide        : ()=>{ ctrl.enabled = false; cHelper.visible = false; return self; },

        attach      : o=>ctrl.attach( o ),
        detach      : ()=>ctrl.detach(),

        toTranslate : ()=>{ ctrl.setMode( 'translate' ); return self; },
        toRotate    : ()=>{ ctrl.setMode( 'rotate' ); return self; },

        setPos      : p=>{
            if( ctrl.object ) ctrl.object.position.fromArray( p );
            return self;
        },

        useAxes     : ()=>{
            if( !self.axes ){
                self.axes = new Object3D();
                tjs.scene.add( self.axes );
            }

            self.axes.visible = true;
            ctrl.attach( self.axes );
            return self;
        },
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
        }
    };

    ctrl.addEventListener( 'dragging-changed', onDragChange );
    ctrl.addEventListener( 'change', onChange );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return self;
}