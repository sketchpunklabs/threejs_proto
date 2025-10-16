import Vec3 from '../Vec3.js';


/** Modulas that handles Negatives
 * @example
 * Maths.mod( -1, 5 ) = 4 */
export function mod( a, b ){	
    const v = a % b;
    return ( v < 0 )? b + v : v;
}

export const PointType = Object.freeze({ Point: 0, Control: 1 });

export class Point{
    pos     = new Vec3();
    attrib  = null;
    type    = 0;
    constructor( p, t=PointType.Point ){
        this.pos.copy( p );
        this.type = t;
    }
}

export class Spline{
    // #region MAIN
    points     = [];        // All the Points that defines all the curves of the Spline
    _curveCnt  = 0;         // How many curves make up the spline
    _pointCnt  = 0;         // Total points in spline
    _isLoop    = false;     // Is the spline closed? Meaning should the ends be treated as another curve
    // #endregion

    // #region GETTERS / SETTERS
    set isLoop( b ){ this._isLoop = b; }
    get isLoop(){ return this._isLoop; }

    get curveCount(){ return this._curveCnt; }
    get pointCount(){ return this._pointCnt; }
    // #endregion

    // #region MANAGE POINTS
    /** Add Points to the spline */
    add( pos, type=PointType.Point ){
        const o = new Point( pos, type );
        this.points.push( o );
        this._pointCnt = this.points.length;
        // TODO - Each subclass has to update the curveCount
        return o;
    }

    /** Update point position */
    setPos( idx, pos ){
        this.points[ idx ].pos.copy( pos );
        return this;
    }
    // #endregion

    // #region ABSTRACT METHODS
    at( t, pos, dxdy, dxdy2 ){}

    atCurve( cIdx, t, pos, dxdy, dxdy2 ){}
    // #endregion
}