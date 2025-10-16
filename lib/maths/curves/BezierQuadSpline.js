// #region IMPORTS
import { Spline, PointType, mod } from './Spline.js';
// #endregion

export default class BezierQuadSpline extends Spline{
    // #region MANAGE POINTS
    add( pos ) {
        const m = this.points.length % 3;
        const o = super.add( pos,
            ( m === 1 )? PointType.Control : PointType.Point
        );

        this._curveCnt = Math.max( 0, Math.floor( (this._pointCnt - 1) / 2 ) );
        return o;
    }
    // #endregion

    // #region GETTERS
    get curveCount(){ 
        return ( !this._isLoop )? this._curveCnt : this._curveCnt + 1;
    }

    // Enought points to make a working loop
    get isValidLoop(){
        const len = this.points.length;
        return ( len >= 5 && (( len-1 ) & 2 ) === 0 );
    }

    // Enough points to make curve
    get isValidCurve(){
        const len = this.points.length;
        return ( len >= 3 && (( len-1 ) & 2 ) === 0 );
    }

    get isValid(){
        if( this.isLoop ){
            if( this.isValidLoop ) return true;
        }else{
            if( this.isValidCurve ) return true;
        }
        return false;
    }
    // #endregion

    // #region SPLINE OPERATIONS
    /** Get Position and Dertivates of the Spline at T */
    at( t, pos, dxdy, dxdy2 ){
        if( t > 1 )      t = 1;
        else if( t < 0 ) t = 0;

        const p               = this.points;
        const [ a, b, c, tt ] = ( !this._isLoop )
            ? this._computeCurveIdx( t )
            : this._computeLoopIdx( t ) ;

        if( pos )   BezierQuad.at(    p[a].pos, p[b].pos, p[c].pos, tt, pos );
        if( dxdy )  BezierQuad.dxdy(  p[a].pos, p[b].pos, p[c].pos, tt, dxdy );
        if( dxdy2 ) BezierQuad.dxdy2( p[a].pos, p[b].pos, p[c].pos, tt, dxdy2 );
    }

    atCurve( cIdx, t, pos, dxdy, dxdy2 ){
        if( t > 1 )      t = 1;
        else if( t < 0 ) t = 0;

        const p = this.points;
        const a = cIdx * 2;
        const b = mod( a + 1, this._pointCnt );
        const c = mod( a + 2, this._pointCnt );

        if( pos )   BezierQuad.at(    p[a].pos, p[b].pos, p[c].pos, t, pos );
        if( dxdy )  BezierQuad.dxdy(  p[a].pos, p[b].pos, p[c].pos, t, dxdy );
        if( dxdy2 ) BezierQuad.dxdy2( p[a].pos, p[b].pos, p[c].pos, t, dxdy2 );
    }
    // #endregion

    // #region HELPERS
    /** Compute the point indices for open spline : Return: [ aIdx, bIdx, cIdx, t ] */
    _computeCurveIdx( t ){
        let i, tt;

        if( t != 1 ){
            tt  = t * this._curveCnt;   // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i   = tt | 0;	            // BitwiseOR 0 same op as Floor
            tt -= i;		            // Strip out the whole number to get the decimal to be used for the T of curve ( FRACT )
            i  *= 2;                    // Every 2 points Plus one back counts as 1 bezier quad curve
        }else{
            i	= ( this._curveCnt - 1 ) * 2;
            tt	= 1;                        // The end of the final curve.
        }

        return [ i, i+1, i+2, tt ];
    }

    /** Compute the point indices for closed spline : Return: [ aIdx, bIdx, cIdx, t ] */
    _computeLoopIdx( t ){
        let i, tt;

        if( t != 1 ){
            tt  = t * ( this._curveCnt + 1 );   // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i   = tt | 0;	                    // BitwiseOR 0 same op as Floor
            tt -= i;		                    // Strip out the whole number to get the decimal to be used for the T of curve ( FRACT )
            i  *= 2;                            // Every 2 points Plus one back counts as 1 bezier quad curve
        }else{
            i	= this._pointCnt - 2;
            tt	= 1;                            // The end of the final curve.
        }

        return [ i, mod( i+1, this._pointCnt ), mod( i+2, this._pointCnt ), tt ];
    }
    // #endregion
}

// #region HELPER

export class BezierQuad{
    static at( a, b, c, t, out = [0,0,0] ){
		// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
		// (1-t) * ((1-t) * a + t * b) + t((1-t) * b + t * c)
		const s  = 1 - t;
		out[ 0 ] = s * ( s * a[0] + t * b[0] ) + t * ( s * b[0] + t * c[0] );
		out[ 1 ] = s * ( s * a[1] + t * b[1] ) + t * ( s * b[1] + t * c[1] );
		out[ 2 ] = s * ( s * a[2] + t * b[2] ) + t * ( s * b[2] + t * c[2] );
		return out;
	}

	static dxdy( a, b, c, t, out = [0,0,0] ){
		// 2 * (1-t) * (b-a) + 2 * t * ( c - b );
		const s2 = 2 * ( 1-t );
		const t2 = 2 * t;

		out[ 0 ] = s2 * ( b[0] - a[0] ) + t2 * ( c[0] - b[0] );
		out[ 1 ] = s2 * ( b[1] - a[1] ) + t2 * ( c[1] - b[1] );
		out[ 2 ] = s2 * ( b[2] - a[2] ) + t2 * ( c[2] - b[2] );
		return out;
	}

	static dxdy2( a, b, c, t, out = [0,0,0] ){
        // 2 * ( c - 2 * b + a )
        // -4b + 2a + 2c [ Simplifed Version ]
		out[ 0 ] = -4 * b[0] + 2 * a[0] + 2 * c[0];
		out[ 1 ] = -4 * b[1] + 2 * a[1] + 2 * c[1];
		out[ 2 ] = -4 * b[2] + 2 * a[2] + 2 * c[2];
		return out;
    }
}

// #endregion