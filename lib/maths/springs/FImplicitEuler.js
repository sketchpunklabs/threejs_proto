// http://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/
// https://gafferongames.com/post/spring_physics/
// Semi-Implicit Euler : http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
/*
Implicit Euler : http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/
x     - value             (input/output)
v     - velocity          (input/output)
xt    - target value      (input)
zeta  - damping ratio     (input)
omega - angular frequency (input) ::: Oscillation per sec
h     - time step         (input) ::: DeltaTime

void Spring( float &x, float &v, float xt, float zeta, float omega, float h ){
  const float f      = 1.0f + 2.0f * h * zeta * omega;
  const float oo     = omega * omega;
  const float hoo    = h * oo;
  const float hhoo   = h * hoo;
  const float detInv = 1.0f / (f + hhoo);
  const float detX   = f * x + h * v + hhoo * xt;
  const float detV   = v + hoo * (xt - x);
  x = detX * detInv;
  v = detV * detInv;
}
*/

export default class FImplicitEuler{
// #region MAIN
    #tar  = 0;          // Target Value
    #cur  = 0;          // Current Value
    #vel  = 0;          // Velocity
    #damp = 1;          // Damping Ratio
    #osc  = Math.PI*2;  // Oscillation Per Second ( Math.PI * 2 * i )
    #eps  = 0.001;      // Epsilon

    constructor( props={} ){
        const opt = Object.assign( { damp:1, osc:1 }, props );
        this.osc  = opt.osc;
        this.damp = opt.damp;
    }
// #endregion

// #region GETTER / SETTERS
    set osc( v ){ this.#osc = v * Math.PI * 2; }
    set damp( v ){ this.#damp = v; }
    set target( v ){ this.#tar = v; }
    get target(){ return this.#tar; }
    set value( v ){ this.#cur = v; }
    get value(){ return this.#cur; }

    get isDone(){ return ( Math.abs( this.#vel ) < this.#eps && Math.abs( this.#tar - this.#cur ) < this.#eps ); }

    // Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
    // With the idea that for every 2 seconds, about 0.5 damping has been applied
    // IMPORTANT : Need to set OSC Per Sec First
    setDampTime( d, sec ){ this.#damp = Math.log( d ) / ( -this.#osc * sec ); return this; }

    // Reduce oscillation by half in X amount of seconds
    // IMPORTANT : Need to set OSC Per Sec First
    setDampHalfLife( sec ){
        // float zeta = -ln(0.5f) / ( omega * lambda );
        this.#damp = 0.6931472 / ( this.#osc * sec );
        return this;
    };

    // Critical Damping with a speed control of how fast the cycle to run
    setDampExpo( sec ){
        this.#osc  = 0.6931472 / sec; // -Log(0.5) but in terms of OCS its 39.7 degrees over time
        this.#damp = 1;
        return this;
    }
// #endregion

// #region RENDER LOOP
    update( dt, tar=null ){
        if( tar != null ) this.#tar = tar;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( Math.abs( this.#vel ) < this.#eps && Math.abs( this.#tar - this.#cur ) < this.#eps ) {
            this.#vel = 0;
            this.#cur = this.#tar;
            return true; // Target Raached
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const friction = 1.0 + 2.0 * dt * this.#damp * this.#osc;
        const dt_osc   = dt * this.#osc**2;
        const dt2_osc  = dt * dt_osc;
        const det_inv  = 1.0 / ( friction + dt2_osc );

        this.#vel      = ( this.#vel + dt_osc * ( this.#tar - this.#cur ) ) * det_inv;
        this.#cur      = ( friction * this.#cur + dt * this.#vel + dt2_osc * this.#tar ) * det_inv;
        return false; // Target not reached
    }
// #endregion
}
