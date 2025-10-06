const TAU = Math.PI * 2;

export default class Radian{

    static deg( a ){ return a * 180 / Math.PI; }

    static norm( a ){
        const x = a % TAU;
        if( x > Math.PI )  return x - TAU;
        if( x < -Math.PI ) return x + TAU;
        return x;
    }

    static isBetween( dMin, dMax, d ){
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        const nD   = this.norm( d );

        if( nMin < nMax ) return ( nD >= nMin ) && ( nD <= nMax );

        // Crosses -180/180 boundary like 170 to -170
        return ( nD >= nMin && nD <= Math.PI ) ||
            ( nD >= -Math.PI && nD <= nMax );
    }

    // Total Arc Angle & Starting Offset angle to visualize min & max
    static arcAndOffset( dMin, dMax ){ // : [ arc, offset ]
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        
        if( nMin <= nMax ) return [ ( nMax - nMin ), nMin ];
        
        // Crosses -180/180 boundary like 170 to -170
        return [ (( Math.PI - nMin ) + ( nMax - (-Math.PI) )) , nMin ];
    }

        // Helper function to find the shortest angular distance
    static angleDist(a1, a2) {
        const diff = Math.abs( this.norm(a1) - this.norm(a2) );
        return Math.min(diff, TAU - diff);
    }

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

}