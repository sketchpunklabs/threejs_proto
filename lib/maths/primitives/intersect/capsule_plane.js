import Vec3 from '../../Vec3.js';

export default function capsule_plane( cap, pln, result=null ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Distance of each end point to the plane: dist = dot( pos, planeNorm ) + planeK
    const distA   = Vec3.dot( cap.posA, pln.norm ) + pln.k;
    const distB   = Vec3.dot( cap.posB, pln.norm ) + pln.k;
    const minDist = Math.min( distA, distB );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( minDist <= cap.radius ){
        if( result ){
            const minPnt  = ( distA < distB )? cap.posA : cap.posB;
            const depth   = cap.radius - minDist;
            const v       = new Vec3();

            result[ 'depth' ]        = depth;
            // separation vector = planeNorm * depth
            result[ 'separation']    = v.fromScale( pln.norm, depth ).slice();
            // contactPos = minPos - ( planeNorm * minDist )
            result[ 'contact' ]      = v.fromScale( pln.norm, minDist ).fromSub( minPnt, v ).slice();
        }

        return true;
    }

    return false;
}
