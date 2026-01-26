// http://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/
// https://gafferongames.com/post/spring_physics/
// implicit Euler : http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/
/*
Semi-Implicit Euler : http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
x     - value             (input/output)
v     - velocity          (input/output)
xt    - target value      (input)
zeta  - damping ratio     (input)
omega - angular frequency (input) ::: Oscillation per sec
h     - time step         (input) ::: DeltaTime
void SpringSemiImplicitEuler(
    float &x, float &v, float xt,
    float zeta, float omega, float h
){
    v += -2.0f * h * zeta * omega * v
         + h * omega * omega * (xt - x);
    x += h * v;
}
*/

export default class FSemiImplicitEuler{
// #region MAIN
    #tar  = 0;          // Target Value
    #cur  = 0;          // Current Value
    #vel  = 0;          // Velocity
    #damp = 1;          // Damping Ratio
    #osc  = Math.PI*2;  // Oscillation Per Second ( Math.PI * 2 * i ) : 0 < i < 10
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
        // vel += -2.0 * dt * damp_ratio * osc_ps * vel + dt * osc_ps * osc_ps * (to - pos);
        // pos += dt * vel;
        const damp = -2.0 * dt * this.#damp * this.#osc;
        const osc  = dt * this.#osc**2;
        this.#vel += damp * this.#vel + osc * ( this.#tar - this.#cur );
        this.#cur += dt * this.#vel;

        return false; // Target not reached
    }
// #endregion
}
