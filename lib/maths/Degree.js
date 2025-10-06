export default class Degree{

    static norm( a ){
        const x = a % 360;
        if( x > 180 )  return x - 360;
        if( x < -180 ) return x + 360;
        return x;
    }

    static rad( a ){ return a * Math.PI / 180; }

    static isBetween( dMin, dMax, d ){
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        const nD   = this.norm( d );

        if( nMin < nMax ) return ( nD >= nMin ) && ( nD <= nMax );

        // Crosses -180/180 boundary like 170 to -170
        return ( nD >= nMin && nD <= 180 ) ||
            ( nD >= -180 && nD <= nMax );
    }

    // Total Arc Angle & Starting Offset angle to visualize min & max
    static arcAndOffset( dMin, dMax ){ // : [ arc, offset ]
        const nMin = this.norm( dMin );
        const nMax = this.norm( dMax );
        
        if( nMin <= nMax ) return [ ( nMax - nMin ), nMin ];
        
        // Crosses -180/180 boundary like 170 to -170
        return [ (( 180 - nMin ) + ( nMax - (-180) )) , nMin ];
    }

    // Helper function to find the shortest angular distance
    static angleDist(a1, a2) {
        const diff = Math.abs( this.norm(a1) - this.norm(a2) );
        return Math.min(diff, 360 - diff);
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