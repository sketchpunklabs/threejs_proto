
// Execute things on a fixed framerate, good to make physics predictable
export default class FixedFrame{
    #accumulate    = 0;
    #timeStep      = 1000;  // millisecond step
    #maxTimeStep   = 2000;  // Clamp accumulator
    #lastTimeStamp = 0;     // DOMHighResTimeStamp from requestAnimationFrame
    #tStep         = 0;
    onFixedFrame   = null;

    constructor( fps=50, fn=null ){ 
        this.#timeStep      = 1000 / fps;
        this.#maxTimeStep   = this.#timeStep * 5;
        this.onFixedFrame   = fn;
    }

    get timeStepSec(){ return this.#timeStep / 1000; }

    update( ts ){
        if( ts == null ) return;

        // Compute Time
        this.#accumulate   += ts - this.#lastTimeStamp;
        this.#lastTimeStamp = ts;

        // Clamp time
        if( this.#accumulate >= this.#maxTimeStep ) this.#accumulate = this.#maxTimeStep;

        // Execute how many steps needed
        let steps = 0;
        while( this.#accumulate >= this.#timeStep ){
            if( this.onFixedFrame ) this.onFixedFrame( this.#timeStep / 1000 );
            this.#accumulate -= this.#timeStep;
            steps++
        }

        // Normalized time for interpolation
        this.#tStep = Math.min( 1.0, this.#accumulate / this.#timeStep );

        // Return how many steps taken by fixed frame
        return steps;
    }
}