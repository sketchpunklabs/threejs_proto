import Vec3 from '../../Vec3.js';

export class SplineSample{
    dist        = 0; // Distance from start of spline
    inc         = 0; // Incremental step since last sample
    time        = 0; // Curve T at each sample

    pos         = new Vec3();
    tangent     = new Vec3();   // Z : Forward
    normal      = new Vec3();   // Y : Up
    binormal    = new Vec3();   // X : Right

    // fromLerp( a, b, t ){
    //     const ti  = 1 - t;
    //     this.dist = a.dist * ti + b.dist * t;
    //     this.inc  = a.inc * ti + b.inc * t;
    //     this.time = a.time * ti + b.time * t;

    //     this.pos.fromLerp( a.pos, b.pos, t );
    //     this.tangent.fromLerp( a.tangent, b.tangent, t );
    //     this.normal.fromLerp( a.normal, b.normal, t );
    //     this.binormal.fromLerp( a.binormal, b.binormal, t );

    //     return this;
    // }

    clone(){
        const s = new SplineSample();
        s.dist  = this.dist;
        s.inc   = this.inc;
        s.time  = this.time;

        s.pos.copy( this.pos );
        s.tangent.copy( this.tangent );
        s.normal.copy( this.normal );
        s.binormal.copy( this.binormal );
        return s;
    }
}

export default class SplineSampler{
    // #region MAIN
    items     = []; // Each sample of the curve
    distance  = 0;  // Total Length of the Spline
    
    constructor(){}
    // #endregion

    // #region BUILD

    addAt( s, t ){
        const itm = new SplineSample();
        itm.time = t;

        s.at( t, itm.pos, itm.tangent );
        
        this.addItem( itm );
        return itm;
    }

    addItem( itm ){
        if( this.items.length > 0 ){
            itm.inc  = Vec3.dist( itm.pos, this.items.at(-1).pos );  // Incremental Step
            itm.dist = ( this.distance += itm.inc );                 // Total Distance traveled
        }

        this.items.push( itm );
    }

    // fromSpline( s, sampCnt = 5 ){
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        
    //     const eIdx          = sampCnt - 1;
    //     this.arcLength      = 0;
    //     this.items.length   = 0;

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     let itm = new SplineSample();
    //     s.at( itm.time, itm.pos, itm.tangent );
    //     this.items.push( itm );

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     for( let i=1; i <= eIdx; i++ ){
    //         itm      = new SplineSample();
    //         itm.time = i / eIdx;
    //         s.at( itm.time, itm.pos, itm.tangent );

    //         itm.inc  = Vec3.dist( itm.pos, this.items.at(-1).pos );
    //         itm.dist = ( this.arcLength += itm.inc );
            
    //         this.items.push( itm );
    //     }

    //     return this;
    // }

    // #endregion

    // #region GETTERS

    // Get lerped sample at a specific distance along the spline sampling
    // atDist( dist, out=new SplineSample() ){
    //     let a;
    //     let b;
    //     let t;

    //     // console.log( 'atDist', dist, this.arcLength, this.items.length );

    //     if( dist <= 0 ){
    //         // Skip to first two items
    //         a = this.items[0];
    //         b = this.items[1];
    //         t = 0;
    //     }else if( dist >= this.arcLength ){
    //         // Skip to the last two items
    //         a = this.items.at(-2);
    //         b = this.items.at(-1);
    //         t = 1;
    //     }else{
    //         // BinarySearch: Find the first item that is greater then seek value
    //         let imid;
    //         let imin = 0;
    //         let imax = this.items.length - 1;

    //         while( imin < imax ){                     // Once Min Crosses or Equals Max, Stop Loop.
    //             imid = ( imin + imax ) >>> 1;         // Compute Mid Index
    //             if( dist < this.items[ imid ].dist )
    //                 imax = imid;      // value is LT seek, use mid as new Max Range
    //             else               
    //                 imin = imid + 1;  // value is GTE seek, move min to one after mid to make the cross fail happen
    //         }

    //         // console.log( imax, dist );
    //         // console.log( '----', this.items[ imax-1 ].dist )
    //         // console.log( '----', this.items[ imax ].dist )

    //         a = this.items[ imax-1 ];                    // Get the two samples where seek is between
    //         b = this.items[ imax ];
    //         t = ( dist - a.dist ) / ( b.dist - a.dist ); // Compute T between the two samples
    //     }
        
    //     // console.log( a, b, t );

    //     out.fromLerp( a, b, t );        

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // for( let i=b; i >= a; i-- ){
    //     //     if( this.lenAry[ i ] < len ){
    //     //         let tt	= ( len - this.lenAry[ i ] ) / this.incAry[ i+1 ];          // Normalize the Search Length   ( x-a / b-a )
    //     //         let ttt	= this.timeAry[ i ] * (1-tt) + this.timeAry[ i+1 ] * tt;    // Interpolate the Curve Time between two points
    //     //         return ttt / this.curveCnt;                                         // Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
    //     //     }
    //     // }
    //     return out;
    // }

    // #endregion
}