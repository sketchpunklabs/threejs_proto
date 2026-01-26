const TAU = Math.PI * 2;

export default class Radian{

    /** Convert radian to degrees */
    static deg( a ){ return a * 180 / Math.PI; }

    /** Remap -PI : PI to 0 : TAU */
    static tau( a ){
        const n = this.norm(a);
        return n < 0 ? n + TAU : n;
    }

    /** Wrap around into the -PI to PI Range */
    static norm( a ){
        const x = a % TAU;
        if( x > Math.PI )  return x - TAU;
        if( x < -Math.PI ) return x + TAU;
        return x;
    }

    /** Total Arc Angle & Starting Offset angle to visualize min & max */
    static arcAndOffset( dMin, dMax ){ // : [ arc, offset ]
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );

        if( nMin <= nMax ) return [ ( nMax - nMin ), nMin ];

        // Crosses -180/180 boundary like 170 to -170
        return [ (( Math.PI - nMin ) + ( nMax - (-Math.PI) )) , nMin ];
    }

    /** Clamp value between the range using -PI to PI as its base */
    static clamp( dMin, dMax, d ){
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        const nD   = this.norm( d );

        if( this.isBetween( nMin, nMax, nD ) ) return nD;

        // Calculate the distance to both min and max angles and return the closer one.
        const distToMin = this.angleDist( nD, nMin );
        const distToMax = this.angleDist( nD, nMax );

        return distToMin < distToMax ? nMin : nMax;
    }

    /** Transition between two angles. Can also do shortest path */
    static lerp( a, b, t, shortestPath = true ){
        const start = this.norm(a);
        let end     = this.norm(b);

        if( shortestPath ){
            const diff = end - start;

            // If the difference is greater than PI, it's shorter to go the other way
            if( diff > Math.PI )        end -= TAU;
            else if( diff < -Math.PI )  end += TAU;
        }

        return this.norm( start * (1 - t) + end * t );
    }

    /** Change angle toward target over time
    time     : Approximately the time it will take to reach the target
    maxSpeed : Optional limit to the rotation speed */
    static smoothDamp( cur, tar, vel, time, dt, maxSpeed = Infinity ){ // [ value, newVel ]
        let diff = this.norm( tar - cur );

        // Clamp the step to maxSpeed
        const maxStep = maxSpeed * time;
        diff          = Math.max( -maxStep, Math.min( maxStep, diff ) );

        const omega   = 2 / time;
        const x       = omega * dt;
        const exp     = 1 / ( 1 + x + 0.48 * x * x + 0.235 * x * x * x );
        const temp    = ( vel + omega * diff ) * dt;

        vel           = ( vel - omega * temp ) * exp;
        const rtn     = ( current + diff ) - ( diff + temp ) * exp;

        return [ this.norm( rtn ), vel ];
    }

// #region ANGLE CALC
    /** Helper function to find the shortest angular distance, does not go over PI */
    static angleDist( a1, a2 ){
        const diff = Math.abs( this.norm(a1) - this.norm(a2) );
        return Math.min( diff, TAU - diff );
    }

    /** Fix target angle so it doesn't cross the abs(180) boundary */
    static shortestTarget( a, b ){
        const start = this.norm( a );
        let end     = this.norm( b );
        const diff  = end - start;

        if( diff > Math.PI )        end -= TAU;
        else if( diff < -Math.PI )  end += TAU;

        return end;
    }

    /** Move toward target from initial. Angle will not be clamped into a range */
    static continuousTarget( a, b ){ return a + this.norm( b - a ); }

    /** Calculates the angle of a 2D vector from origin, return [-PI, PI] */
    static angle2D( x, y ){ return Math.atan2(y, x); }

    /** Angle needed to rotate from vector A to B */
    static angleDiff2D( ax, ay, bx, by ){ return Math.atan2( by - ay, bx - ax ); }
// #endregion

// #region Checks
    /** Checks if an angle is between two angles ( -PI to PI Range ) */
    static isBetween( dMin, dMax, d ){
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        const nD   = this.norm( d );

        if( nMin < nMax ) return ( nD >= nMin ) && ( nD <= nMax );

        // Crosses -180/180 boundary like 170 to -170
        return ( nD >= nMin && nD <= Math.PI ) ||
            ( nD >= -Math.PI && nD <= nMax );
    }

    /** Checks if the 180/-180 boundary is being crossed */
    static isCrossingPI( a, b ){ return Math.abs( this.norm( a ) - this.norm( b ) ) > Math.PI; }
// #endregion

}
