import { PrimitiveType }    from './consts.js';

export default class Plane{
    type    = PrimitiveType.Plane;
    pos     = [0,0,0];
    norm    = [0,1,0];
    k       = 0;

    setPos( v ){
        this.pos[0] = v[0];
        this.pos[1] = v[1];
        this.pos[2] = v[2];
        this._calc();
        return this;
    }

    setNorm( v ){
        this.norm[0] = v[0];
        this.norm[1] = v[1];
        this.norm[2] = v[2];
        this._calc();
        return this;
    }

    _calc(){
        const p = this.pos;
        const n = this.norm;
        this.k  = -( n[0]*p[0] + n[1]*p[1] + n[2]*p[2] );
    }
}
