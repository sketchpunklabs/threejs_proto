// #region IMPORTS
import { Spline, Point, PointType, mod } from './Spline.js';
// #endregion

export default class BezierCubicSpline extends Spline{
    // #region MANAGE POINTS
    add( pos ){
        const m = this.points.length % 4;
        const o = super.add( pos,
            ( m === 1 || m === 2 )? PointType.Control : PointType.Point
        );

        this._curveCnt = Math.max( 0, Math.floor( (this._pointCnt - 1) / 3 ) );
        return o;
    }
    // #endregion

    // #region GETTERS
    get curveCount(){ 
        return ( !this._isLoop )? this._curveCnt : this._curveCnt + 1;
    }
    // #endregion

    // #region SPLINE OPERATIONS
    /** Get Position and Dertivates of the Spline at T */
    at( t, pos, dxdy, dxdy2 ){
        if( t > 1 )      t = 1;
        else if( t < 0 ) t = 0;

        const p                  = this.points;
        const [ a, b, c, d, tt ] = ( !this._isLoop )?
            this._computeCurveIdx( t ) :
            this._computeLoopIdx( t ) ;

        if( pos )   BezierCubic.at(    p[a].pos, p[b].pos, p[c].pos, p[d].pos, tt, pos );
        if( dxdy )  BezierCubic.dxdy(  p[a].pos, p[b].pos, p[c].pos, p[d].pos, tt, dxdy );
        if( dxdy2 ) BezierCubic.dxdy2( p[a].pos, p[b].pos, p[c].pos, p[d].pos, tt, dxdy2 );
    }

    atCurve( cIdx, t, pos, dxdy, dxdy2 ){
        if( t > 1 )      t = 1;
        else if( t < 0 ) t = 0;

        const p = this.points;
        const a = cIdx * 3;
        const b = mod( a + 1, this._pointCnt );
        const c = mod( a + 2, this._pointCnt );
        const d = mod( a + 3, this._pointCnt );

        if( pos )   BezierCubic.at(    p[a].pos, p[b].pos, p[c].pos, p[d].pos, t, pos );
        if( dxdy )  BezierCubic.dxdy(  p[a].pos, p[b].pos, p[c].pos, p[d].pos, t, dxdy );
        if( dxdy2 ) BezierCubic.dxdy2( p[a].pos, p[b].pos, p[c].pos, p[d].pos, t, dxdy2 );
    }
    // #endregion

    // #region HELPERS
    /** Compute the point indices for open spline : Return: [ aIdx, bIdx, cIdx, dIdx, t ] */
    _computeCurveIdx( t ){
        let i, tt;

        if( t != 1 ){
            tt  = t * this._curveCnt;   // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i   = tt | 0;	            // BitwiseOR 0 same op as Floor
            tt -= i;		            // Strip out the whole number to get the decimal to be used for the T of curve ( FRACT )
            i  *= 3;                    // Every 3 points Plus one back counts as 1 bezier cubic curve
        }else{
            i	= ( this._curveCnt - 1 ) * 3;
            tt	= 1;                        // The end of the final curve.
        }

        return [ i, i+1, i+2, i+3, tt ];
    }

    /** Compute the point indices for closed spline : Return: [ aIdx, bIdx, cIdx, dIdx, t ] */
    _computeLoopIdx( t ){
        let i, tt;

        if( t != 1 ){
            tt  = t * ( this._curveCnt + 1 );   // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i   = tt | 0;	            // BitwiseOR 0 same op as Floor
            tt -= i;		            // Strip out the whole number to get the decimal to be used for the T of curve ( FRACT )
            i  *= 3;                    // Every 3 points Plus one back counts as 1 bezier cubic curve
        }else{
            i	= this._pointCnt - 3;
            tt	= 1;                    // The end of the final curve.
        }

        return [ 
            i, 
            mod( i+1, this._pointCnt ), 
            mod( i+2, this._pointCnt ), 
            mod( i+3, this._pointCnt ), 
            tt
        ];
    }
    // #endregion
}


// #region HELPER

export class BezierCubic{
    static at( a, b, c, d, t, out=[0,0,0] ){
        const	i       = 1 - t,
                ii      = i * i,
                iii     = ii * i,
                tt      = t * t,
                ttt     = tt * t,
                iit3    = 3 * ii * t,
                itt3    = 3 * i * tt;

        out[ 0 ] = iii * a[0] + iit3 * b[0] + itt3 * c[0] + ttt * d[0];
        out[ 1 ] = iii * a[1] + iit3 * b[1] + itt3 * c[1] + ttt * d[1];
        out[ 2 ] = iii * a[2] + iit3 * b[2] + itt3 * c[2] + ttt * d[2];
        return out;
    }

    static dxdy( a, b, c, d, t, out=[0,0,0] ){
        if(t > 1)		t = 1;
        else if(t < 0)	t = 0;

        const   i	= 1 - t,
                ii3	= 3 * i * i,
                it6	= 6 * i * t,
                tt3	= 3 * t * t;

        out[ 0 ] = ii3 * ( b[0] - a[0] ) + it6 * ( c[0] - b[0] ) + tt3 * ( d[0] - c[0] );
        out[ 1 ] = ii3 * ( b[1] - a[1] ) + it6 * ( c[1] - b[1] ) + tt3 * ( d[1] - c[1] );
        out[ 2 ] = ii3 * ( b[2] - a[2] ) + it6 * ( c[2] - b[2] ) + tt3 * ( d[2] - c[2] );
        return out;
    }

    static dxdy2( a, b, c, d, t, out=[0,0,0] ){
        // https://stackoverflow.com/questions/35901079/calculating-the-inflection-point-of-a-cubic-bezier-curve
        if(t > 1)		t = 1;
        else if(t < 0)	t = 0;

        const t6 = 6 * t;
        out[ 0 ] = t6 * ( d[0] + 3 * ( b[0] - c[0] ) - a[0] ) + 6 * ( a[0] - 2 * b[0] + c[0] );
        out[ 1 ] = t6 * ( d[1] + 3 * ( b[1] - c[1] ) - a[1] ) + 6 * ( a[1] - 2 * b[1] + c[1] );
        out[ 2 ] = t6 * ( d[2] + 3 * ( b[2] - c[2] ) - a[2] ) + 6 * ( a[2] - 2 * b[2] + c[2] );
        return out;
    }
}

// #endregion