import Vec3 from '../../Vec3.js';
import Quat from '../../Quat.js';

/* 
TODO
in Graphics Gem 4 - Fiber Bundle Twist Reduction
Had an interesting idea about checking the twist at each frame
and fixing it to better align with the previous frame. The only
thing is mentions is checking the angle between the twist vectors
then at a certain threshold realign the twist.

I have an interesting idea. Project the previous twist vector
onto the plane of the current frame. Using the position &
tangent to form the plane. From there can check the angle
between the two vectors to see if its worth fixing. If fix
is needed, then do a fromSwing rotation to realign the twist vector
*/

// Rotation Minimizing Frame
export default class RotMinFrame{

    // #region PARALLEL TRANSPORT

    // Carry a starting normal direction across a sampled collection
    static transportNormal( items, initDir ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set initial item
        const i = items[0];
        if( initDir )   i.normal.copy( initDir );
        else            this.stableNormal( i.tangent, [0,1,0], i.normal );
        
        this.fixOrthogonal( i );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Transport the first normal/binormal to the rest of the samples
        for( let i=1; i < items.length; i++ ){
            this.transportSample( items[i-1], items[i] );
        }
    }

    // Transport the normal from sample to another with doing any corrections
    static transportSample( sFrom, sTo ){
        const T1 = sFrom.tangent;   // Prev Z
        const R1 = sFrom.normal;    // Prev Y
        // const S1 = sFrom.binormal;  // Prev X
        const T2 = sTo.tangent;     // Current Z
        const v  = new Vec3();      // Temp var

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Parallel transport the frame
        const v1 = new Vec3().fromAdd( T1, T2 );
        const c1 = v1.lenSqr;
        
        let riL;
        let tiL;
        if( c1 > 0.0001 ){
            // riL = R1 - (2.0f / c1) * v1.dot(R1) * v1;
            v.fromScale( v1, ( 2 / c1 ) * Vec3.dot( v1, R1 ) );
            riL = new Vec3().fromSub( R1, v );

            // tiL = T1 - (2.0f / c1) * v1.dot(T1) * v1;
            v.fromScale( v1, ( 2 / c1 ) * Vec3.dot( v1, T1 ) );
            tiL = new Vec3().fromSub( T1, v );
        } else {
            riL = new Vec3( R1 );
            tiL = new Vec3( T1 );
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Reflection to align with new tangent ( Fix Up )
        const v2 = new Vec3().fromAdd( tiL, T2 );
        const c2 = v2.lenSqr;
        
        if( c2 > 0.0001 ){
            // normal = riL - (2.0f / c2) * v2.dot(riL) * v2;
            v.fromScale( v2, ( 2 / c2 ) * Vec3.dot( v2, riL ) );
            sTo.normal.fromSub( riL, v ).norm();
        }else{
            sTo.normal.fromNorm( riL );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // In extreme curves the normal direction can flip.
        // Apply a swing rotation on the normal based on
        // the angle change between the From & To tangents. 
        // With an extreme turn, apply that turn to the normal
        // to help keep it stable on transport
        const q = new Quat().fromSwing( sFrom.tangent, sTo.tangent );
        sTo.normal.transformQuat( q );

        // Fix alignment around tangent
        this.fixOrthogonal( sTo );
    }

    // #endregion

    // #region VECTOR ALIGNMENT

    // Compute a normal that is orthogonal to tangent
    static stableNormal( tan, up=[0,1,0], out=new Vec3() ){
        // Project reference vector onto plane perpendicular to tangent
        // proj = referenceUp - tangent * tangent.dot( referenceUp )
        out.fromScale( tan, Vec3.dot( tan, up ) );
        out.fromSub( up, out );

        // If tangent is parallel to reference, use different reference
        if( out.len < 0.001 ){
            // const alt = ( Math.abs( up[0] ) < 0.9 )? [1,0,0] : [0,0,1];
            const alt = ( Math.abs( up[1] ) > 0.9 )? [0,0,-1] : [1,0,0];
            out.fromScale( tan, Vec3.dot( tan, alt ) );
            out.fromSub( alt, out );
        }

        return out.norm();
    }

    // Fix the axes to be orthogonal in the event tangent or normals have been modified
    static fixOrthogonal( s ){
        // Compute "Right", cross( Up, Fwd )
        s.binormal.fromCross( s.normal, s.tangent ).norm();

        // Tan & Norm are parallel
        if( Vec3.lenSqr( s.binormal ) === 0 ){
            if( Math.abs( s.normal[2] ) === 1 ) s.tangent[0] += 0.0001;  // shift x when Fwd or Bak
            else                                s.tangent[2] += 0.0001;  // shift z

            s.tangent.norm();   // ReNormalize
            s.binormal          // Redo Right
                .fromCross( s.normal, s.tangent )
                .norm();    
        }

        // Realign "Up" = cross( Fwd, Rit )
        s.normal.fromCross( s.tangent, s.binormal ).norm()
    }

    // Update tangents so each point is pointing at the next point
    // static realignTangentsFromPoints( pnts ){
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Compute new tangent by using direction from point a to b
    //     const q = new Quat();
    //     const v = new Vec3();
    //     let s;
    //     for( let i=1; i < pnts.length; i++ ){
    //         s = pnts[i-1];

    //         // New tangent
    //         v.fromSub( pnts[i].pos, s.pos ).norm();
            
    //         // Swing normal to avoid possible flipping
    //         q.fromSwing( s.tangent, v );
    //         s.normal.transformQuat( q );

    //         s.tangent.copy( v );
    //         // s.tangent.fromSub( pnts[i].pos, s.pos ).norm();

    //         // Fix normal & binormal
    //         this.fixOrthogonal( s );
    //     }

    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Final Point follows the same tangent as the second to last point
    //     const p = pnts.at( -1 );
    //     p?.tangent.copy( s.tangent );
    //     this.fixOrthogonal( p );
    // }

    // #endregion

    // #region TWISTING

    static applyLinearTwist( items, aRad, bRad ){
        const va = new Vec3();
        const vb = new Vec3();

        let c;      // Radian cosine
        let s;      // Radian sine
        let rad;    // Lerped radian

        for( const itm of items ){
            rad = aRad * (1-itm.time) + bRad * itm.time;
            c   = Math.cos( rad );
            s   = Math.sin( rad );

            // normal * cos(rad) + binormal * sin(rad)
            va.fromScale( itm.normal, c );
            vb.fromScale( itm.binormal, s );
            itm.normal.fromAdd( va, vb ).norm();
            
            // binormal = cross( normal, tangent )
            itm.binormal.fromCross( itm.normal, itm.tangent ).norm();
        }
    }

    // #endregion
}