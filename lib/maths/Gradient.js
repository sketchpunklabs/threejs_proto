// TODO: Visit this page, has los of useful fns https://iquilezles.org/articles/functions/

function fract( f ){ return f - Math.floor( f ); }

class Gradient{
    static lerp( a, b, t ){ return (1 - t) * a + t * b; }  //return a + t * (b-a);

    // #region STEP
    static step( edge, x ) { return ( x < edge )? 0 : 1; }

    /** t must be in the range of 0 to 1 : start & ends slowly*/
    static smoothTStep( t ){ return t * t * ( 3 - 2 * t ); }

    static smoothStep( min, max, v )  { //https://en.wikipedia.org/wiki/Smoothstep
        v = Math.max( 0, Math.min( 1, (v-min) / (max-min) ) );
        return v * v * ( 3 - 2 * v );
    }

    static smootherStep( min, max, v )  {
        if ( v <= min ) return 0;
        if ( v >= max ) return 1;

        v = ( v - min ) / ( max - min );
        return v * v * v * ( v * ( v * 6 - 15 ) + 10 );
    }

    /** This is a smooth over shoot easing : t must be in the range of 0 to 1 */
    static overShoot( t, n=2, k=2 ){
        // https://www.youtube.com/watch?v=pydKWTSGMEM
        t = t * t * ( 3 - 2 * t ); // SmoothTStep to smooth out the starting & end
        const a = n * t * t;
        const b = 1 - k * (( t - 1 )**2);
        return a * ( 1-t ) + b * t;
    }
    // #endregion

    // #region MISC
    /** See: https://www.iquilezles.org/www/articles/smin/smin.htm. */
    static smoothMin( a, b, k ){
        if( k != 0 ){
            const h = Math.max( k - Math.abs( a - b ), 0.0 ) / k;
            return Math.min( a, b ) - h * h * h * k * ( 1 / 6 );
        }else return Math.min(a, b);
    }

    static fade( t  ){ return t * t * t * (t * (t * 6.0 - 15.0 ) + 10.0 ); }

    /** Remap 0 > 1 to -1 > 0 > 1 */
    static remapN01( t ){ return t * 2 - 1; }

    /** Remap 0 > 1 to 0 > 1 > 0 */
    static remap010( t ) {
        //const tt = t * 2;
        //return ( tt > 1 )? 1 - (tt - 1) : tt;
        return 1 - Math.abs( 2 * t - 1 );
    }

    /** bounce ease out */
    static bounce( t ) {
        return ( Math.sin(t * Math.PI * (0.2 + 2.5 * t * t * t)) * Math.pow(1  - t, 2.2) + t) * (1 + (1.2 * (1 - t)));
    }

    static noise( x ) {
        // <https://www.shadertoy.com/view/4dS3Wd> By Morgan McGuire @morgan3d, http://graphicscodex.com
        // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
        const i = Math.floor( x );
        const f = fract( x );
        const t = f * f * ( 3 - 2 * f );
        return this.lerp(
            fract( Math.sin( i ) * 1e4 ),
            fract( Math.sin( i + 1.0 ) * 1e4 ),
            t
        );
    }
    // #endregion

    // #region CURVES

    static parabola( x , k  ){ return Math.pow( 4 * x * ( 1 - x ), k ); }

    static sigmoid( t, k=0 ){ // Over 0, Eases in the middle, under eases in-out
        // this uses the -1 to 1 value of sigmoid which allows to create easing at
        // start and finish. Can pass in range 0:1 and it'll return that range.
        // https://dhemery.github.io/DHE-Modules/technical/sigmoid/
        // https://www.desmos.com/calculator/q6ukniiqwn
        return ( t - k*t ) / ( k - 2*k*Math.abs(t) + 1 );
    }

    static bellCurve( t ) {
        return ( Math.sin( 2 * Math.PI * ( t - 0.25 ) ) + 1 ) * 0.5;
    }

    /** a = 1.5, 2, 4, 9 */
    static betaDistCurve( t, a ){
        // https://stackoverflow.com/questions/13097005/easing-functions-for-bell-curves
        return 4 ** a * ( t * ( 1 - t ) ) ** a;
    }

    // #endregion

    // static CBezierEase(target, x0,y0, x1,y1, x2,y2, x3,y3 ){
    //     const TRIES		= 30;
    //     const MARGIN	= 0.001;

    //     //if(target <= 0.00001) // Target is Zero
    //     //else if(target > 0.99999 ) //target is One

    //     let a		= 0,
    //         b		= 1,
    //         loop	= 0,
    //         t,tt, i, ii, x;

    //     while( loop++ < TRIES ){
    //         t	= (b - a) * 0.5  + a;
    //         i	= 1 - t;
    //         tt	= t * t;
    //         ii	= i * i;
    //         x 	= i*ii*x0 + 3*t*ii*x1 + 3*tt*i*x2 + t*tt*x3;

    //         //console.log("x",loop, x, target, Math.abs(target - x));

    //         if( Math.abs(target - x) < MARGIN ) break; //console.log("found target at", t);

    //         if(target > x)		a = t;
    //         else if(target < x)	b = t;
    //     }

    //     return i*ii*y0 + 3*t*ii*y1 + 3*tt*i*y2 + t*tt*y3;
    // }


    // //https://blog.demofox.org/2014/08/28/one-dimensional-bezier-curves/
    // //1D Cubic (3rd) Bezier through A, B, C, D where a Start and d is end are assumed to be 0 and 1.
    // static normalizedBezier3(b, c, t){
    //     let s	= 1.0 - t,
    //         t2	= t * t,
    //         s2	= s * s,
    //         t3	= t2 * t;
    //     return (3.0 * b * s2 * t) + (3.0 * c * s * t2) + t3;
    // }


    // static normalizedBezier7(b, c, d, e, f, g, t){
    //     let s	= 1.0 - t,
    //         t2	= t * t,
    //         s2	= s * s,
    //         t3	= t2 * t,
    //         s3	= s2 * s,
    //         t4	= t2 * t2,
    //         s4	= s2 * s2,
    //         t5	= t3 * t2,
    //         s5	= s3 * s2,
    //         t6	= t3 * t3,
    //         s6	= s3 * t3,
    //         t7 	= t3 * t2 * t2;

    //     return 	(7.0 * b * s6 * t) + (21.0 * c * s5 * t2) + (35.0 * d * s4 * t3) +
    //             (35.0 * e * s3 * t4) + (21.0 * f * s2 * t5) + (7.0 * g * s * t6) + t7;
    // }


	// Parabola that passes between 0 and 1
	// p = 4 * x * ( 1 - x );
	// p1 = pow( p, 2.0 * p ); // Curves the start and end
	// p1 = pow( p, 4.0 * p ); // Curves more start and end
	// p1 = pow( p, 8.0 * p ); // Curves more start and end
	// p1 = pow( p, 12.0 * p ); // By this point creates a very sharp parabola

	// S Curve ( Kinda like an ease in-out )
	// x * x * ( 3 - 2 * x )
	// if replace x with a color vec3, its like adding contrast, brighters and darkers.
	// if too much clamp color before curve, might fix over exposure.

	// Ripples from hieght
	// gt = fract( time );
	// len = length( a.xy-b.xy )
	// h -= 0.1 *  // Amptitude
	//		sin( gt * 10 + len * 3.0 ) * // Create a Wave
	//		exp( -1 * l * l ) * // Exponetial of Distance
	//		exp( -1 * gt ) * // Exponetial of Time, more time the weaker the wave
	//		smoothstep( 0.0, 0.1, gt ); // Smooth out time near the beginning.


	// Camera Shake
	// pos += 0.05 * sin( time * 0.5 * vec3( 0, 2, 4 ) ); // Use Sin wave at different starting direction values.


    /*
    	//https://www.desmos.com/calculator/3zhzwbfrxd
	// Configurable easing Function
	function ExpBlend( t, p, s ){
		let c = (2 / (1-s)) - 1;
		if( t > p ){
			t = 1 - t;
			p = 1 - p;
		}
		return (t**c) / (p**(c-1));
	}

    function prob_density( t, a, b ){
		return ( t**(a-1) * (1-t)**(b-1) ) / ( Math.log(a) * Math.log(b) / ( Math.log( a + b )) ); //NOT log, needs to be Gamma https://github.com/substack/gamma.js/blob/master/index.js
	}
    */
}

export default Gradient;
