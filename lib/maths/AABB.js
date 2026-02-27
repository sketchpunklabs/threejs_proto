

class AABB{
    min = [0,0,0];
    max = [0,0,0];

    constructor( min=null, max=null ){
        if( min && max ) this.set( min, max );
    }

    set( min, max ){
        this.min[0] = min[0];
        this.min[1] = min[1];
        this.min[2] = min[2];
        this.max[0] = max[0];
        this.max[1] = max[1];
        this.max[2] = max[2];
        return this;
    }

    translate( v ){
        this.min[0] += v[0];
        this.min[1] += v[1];
        this.min[2] += v[2];

        this.max[0] += v[0];
        this.max[1] += v[1];
        this.max[2] += v[2];
        return this;
    }

    scale( v ){
        const c = this.getCenter();
        const a = this.min;
        const b = this.max;

        a[0] = ( a[0] - c[0] ) * v + c[0];
        a[1] = ( a[1] - c[1] ) * v + c[1];
        a[2] = ( a[2] - c[2] ) * v + c[2];

        b[0] = ( b[0] - c[0] ) * v + c[0];
        b[1] = ( b[1] - c[1] ) * v + c[1];
        b[2] = ( b[2] - c[2] ) * v + c[2];
        return this;
    }

    expandByPoint( pos ) {
        this.min[0] = Math.min( this.min[0], pos[0] );
        this.min[1] = Math.min( this.min[1], pos[1] );
        this.min[2] = Math.min( this.min[2], pos[2] );
        this.max[0] = Math.max( this.max[0], pos[0] );
        this.max[1] = Math.max( this.max[1], pos[1] );
        this.max[2] = Math.max( this.max[2], pos[2] );
        return this;
    }

    getSize(){
        return [
            this.max[0] - this.min[0],
            this.max[1] - this.min[1],
            this.max[2] - this.min[2],
        ];
    }

    getCenter(){
        // lerp( a, b, 0.5 );
        return [
            this.min[0] * 0.5 + this.max[0] * 0.5,
            this.min[1] * 0.5 + this.max[1] * 0.5,
            this.min[2] * 0.5 + this.max[2] * 0.5,
        ];
    }

    getCorners(){
        const x1  = this.min[0], y1 = this.min[1], z1 = this.min[2];
        const x2  = this.max[0], y2 = this.max[1], z2 = this.max[2];
        const rtn = [
            [x1,y1,z1], // Bottom Face - Start at min corner
            [x1,y1,z2],
            [x2,y1,z2],
            [x2,y1,z1],

            [x1,y2,z1], // Top face - start of min corner but max height
            [x1,y2,z2],
            [x2,y2,z2], // max corner
            [x2,y2,z1],
        ];
        return new AABBCorners( rtn );
    }
}

class AABBCorners{
    // Bot  Top  :: CCW
    // 0-3  4-7
    // | |  | |
    // 1-2  5-6
    points = [];
    constructor( points ){ this.points = points; }

    applyQuat( q ){
        const c = this.getCenter();
        const v = [0,0,0];
        for( const p of this.points ){
            vSub( p, c, v );
            qTransform( q, v, v );
            vAdd( v, c, p );
            // Debug.pnt.add( p, 0xffffff, 2 );
        }
        return this;
    }

    scale( s ){
        const c = this.getCenter();
        for( const p of this.points ){
            p[0] = ( p[0] - c[0] ) * s + c[0];
            p[1] = ( p[1] - c[1] ) * s + c[1];
            p[2] = ( p[2] - c[2] ) * s + c[2];
        }
        return this;
    }

    getCenter(){
        const div = 1 / this.points.length;
        let x = 0;
        let y = 0;
        let z = 0;

        for( const p of this.points ){
            x += p[0];
            y += p[1];
            z += p[2];
        }

        return [ x * div, y * div, z * div ]
    }

    getSize(){
        // Points can be any orientation, compute the distance between
        // certain points to get the width, height and depth of the box
        const a = this.points[0];
        const b = this.points[1];
        const c = this.points[2];
        const d = this.points[5];

        return [
            Math.sqrt( (b[0]-c[0])**2 + (b[1]-c[1])**2 + (b[2]-c[2])**2 ),
            Math.sqrt( (b[0]-d[0])**2 + (b[1]-d[1])**2 + (b[2]-d[2])**2 ),
            Math.sqrt( (b[0]-a[0])**2 + (b[1]-a[1])**2 + (b[2]-a[2])**2 ),
        ];
    }

    debug( c=0xffffff ){
        const p = this.points;
        for( let i=0; i < 4; i++ ){
            const ni = (i + 1) % 4;
            Debug.ln
                .add( p[i], p[ni], c )      // bottom
                .add( p[i+4], p[ni+4], c )  // top
                .add( p[i], p[i+4], c );    // sides
        }
        return this;
    }
}
