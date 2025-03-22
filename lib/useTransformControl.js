import { AxesHelper }        from 'three';
import { TransformControls } from 'three/TransformControls.js';

export default function useTransformControl( tjs ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const ctrl = new TransformControls( tjs.camera, tjs.renderer.domElement );
    ctrl.setSpace( 'local' );
    tjs.scene.add( ctrl.getHelper() );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const self  = {
        o        : ctrl,
        onRotate : null,
        onMove   : null,
        onStart  : null,
        onStop   : null,

        attach      : o=>ctrl.attach( o ),
        detach      : ()=>{
            gizmo.detach();
            if( self.axes ) self.axes.visible = false;
        },

        toTranslate : ()=>{ ctrl.setMode( 'translate' ); return self; },
        toRotate    : ()=>{ ctrl.setMode( 'rotate' ); return self; },

        setPos      : p=>{
            if( ctrl.object ) ctrl.object.position.fromArray( p );
            return self;
        },

        useAxes     : ( s=0.5 )=>{
            if( !self.axes ){
                self.axes = new AxesHelper();
                self.axes.scale.setScalar( s );
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