import Vec3                 from '../Vec3.js';
import { PrimitiveType }    from './consts.js';

export default class Capsule{
    type    = PrimitiveType.Capsule;
    posA    = [0,0,0];
    posB    = [0,1,0];
    radius  = 0.5;
    constructor(){}

    // #region GETTERS / SETTERS
    fromGround( radius=0.5, height=1 ){
        // Zero out XZ
        this.posA[0] = this.posB[0] = 0;
        this.posA[2] = this.posB[2] = 0;

        // Points set vertically
        this.radius  = radius;
        this.posA[1] = radius;
        this.posB[1] = height - radius;
        return this;
    }

    clone(){
        const o     = new Capsule();
        o.posA      = this.posA.slice();
        o.posB      = this.posB.slice();
        o.radius    = this.radius;
        return o;
    }
    // #endregion

    // #region TRANSFORM
    translate( v ){
        this.posA[0] += v[0];
        this.posA[1] += v[1];
        this.posA[2] += v[2];
        this.posB[0] += v[0];
        this.posB[1] += v[1];
        this.posB[2] += v[2];
        return this;
    }

    quat( q ){
        Vec3.applyQuat( this.posA, q, this.posA );
        Vec3.applyQuat( this.posB, q, this.posB );
        return this;
    }
    // #endregion
}
