import Transform from '../maths/Transform.js';

export default class Joint{
    name     = '';
    index    = -1;
    pindex   = -1;
    isRoot   = false;
    children = [];
    local    = new Transform();
    world    = new Transform();

    fromBone( b ){
        this.name = b.name;

        let v = b.position.toArray();
        this.local.pos[ 0 ] = v[ 0 ];
        this.local.pos[ 1 ] = v[ 1 ];
        this.local.pos[ 2 ] = v[ 2 ];

        v = b.quaternion.toArray();
        this.local.rot[ 0 ] = v[ 0 ];
        this.local.rot[ 1 ] = v[ 1 ];
        this.local.rot[ 2 ] = v[ 2 ];
        this.local.rot[ 3 ] = v[ 3 ];

        v = b.scale.toArray();
        this.local.scl[ 0 ] = v[ 0 ];
        this.local.scl[ 1 ] = v[ 1 ];
        this.local.scl[ 2 ] = v[ 2 ];

        return this;
    }

    clone(){
        const j     = new Joint();
        j.name      = this.name;
        j.index     = this.index;
        j.pindex    = this.pindex;
        j.isRoot    = this.isRoot;
        j.children  = [ ...this.children ];
        j.local.copy( this.local );
        j.world.copy( this.world );
        return j;
    }
}
