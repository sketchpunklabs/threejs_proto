import * as THREE from 'three';


// #region THREEJS TREE TRAVERSAL / FILTERING
export function* traverseFind( root, fn ) {
    const stack = [ root ];  
    let o;

    while( stack.length > 0 ){
        if( fn( (o = stack.pop() )) ){
            yield o;
        }
        stack.push( ...o.children );
    }
}

export function firstFind( root, fn = o=>(o.type === 'SkinnedMesh') ){
    if( fn( root ) ) return root;

    const stack = [ ...root.children ];
    let o;

    while( stack.length > 0 ){
        if( fn( (o = stack.pop() )) )   return o;
        else                            stack.push( ...o.children );
    }

    return null;
}
// #endregion


// #region CLEANUP

export function disposeObject3D( obj ){
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Remove from parent & dispose its 3D resources
  if (obj.parent) {
    obj.parent.remove(obj);
  }

  obj?.geometry?.dispose();
  if( obj.material ) disposeMaterial( obj.material );

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Take care of any of the children items if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.traverse( o=>{
    o?.geometry?.dispose();
    if( o.material ) disposeMaterial( o.material );
  });
}

export function disposeMaterial( mat ){
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Looking for textures in regular materials
  for (const v of Object.values(mat)) {
    if (v.dispose) v.dispose();
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Looking for textures in ShaderMaterials, RawShaderMaterials
  for (const o of Object.values( mat.uniforms) ){
    if( o.value.dispose ) o.value.dispose();
  }

  mat.dispose();
}

// #endregion


// #region GEOMETRY
export function geoBuffer( props ){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.BufferAttribute( props.vertices, 3 ) );

    if( props.indices ) geo.setIndex( new THREE.BufferAttribute( props.indices, 1 ) );
    if( props.normal )  geo.setAttribute( 'normal', new THREE.BufferAttribute( props.normal, 3 ) );
    if( props.uv )      geo.setAttribute( 'uv', new THREE.BufferAttribute( props.uv, 2 ) );

    // if( props.jointWeight && props.jointIndex ){
    //     geo.setAttribute( 'skinWeight', new THREE.BufferAttribute( props.jointWeight, props.skinSize ) );
    //     geo.setAttribute( 'skinIndex',  new THREE.BufferAttribute( props.jointIndex, props.skinSize ) );
    // }

    return geo;
}
// #endregion


// #region SKINNING

export function cloneSkeleton( skel ){
    const bmap  = {};
    const clone = skel.clone();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // TODO : https://github.com/mrdoob/three.js/issues/31548
    // There is a "bug" in skeleton clone where bones are not properly cloned
    // but just a shallow copy of the bones to the new skeleton object. This is
    // a problem where skeleton can not be used to store multiple sets of poses.
    // By modifing one bone, the change will be reflected on all cloned skeletons.
    // To avoid this issue, need to take the extra step of cloning the bones.
    // At the moment, the issue has been tagged as a "suggestion" instead of a bug.
    // If by chance the bug gets fixed, there will be no need for this for loop.
    for( const [i, b] of skel.bones.entries() ){
        clone.bones[i] = b.clone();
        bmap[b.name]   = clone.bones[i];
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fix Parent & Children
    
    for (const [i, b] of clone.bones.entries()) {
        // Link cloned parent bone
        if( skel.bones[i].parent && skel.bones[i].parent.isBone ){
            b.parent = bmap[skel.bones[i].parent.name];
        }

        // Link to cloned children
        for( const [ci, cb] of b.children.entries() ){
            b.children[ci] = bmap[cb.name];
        }
    }

    return clone;
}

export function poseFromClip( clip, skel, frame=0 ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const bMap = new Map();
    for( const [i,o] of skel.bones.entries() ) bMap.set( o.name, i );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const idx = frame * 4;
    let bName;
    let bone;
    for( const t of clip.tracks ){
        if( !t.name.endsWith( '.quaternion' ) ) continue;
        
        bName = t.name.substring( 0, t.name.lastIndexOf('.') );
        bone  = skel.bones[ bMap.get( bName ) ];

        bone.quaternion.x = t.values[ idx + 0 ];
        bone.quaternion.y = t.values[ idx + 1 ];
        bone.quaternion.z = t.values[ idx + 2 ];
        bone.quaternion.w = t.values[ idx + 3 ];
    }
}

export function boneMap( skel ){
    const bMap = new Map();
    for( const [i,o] of skel.bones.entries() ) bMap.set( o.name, i );

    bMap.getBone = ( o, sk=null )=>{
        const s = sk || skel;
        switch( typeof o ){
            case 'number' : return s.bones[ o ];  
            case 'string' :
                const idx = bMap.get( o );
                return ( idx !== undefined )? s.bones[ idx ] : null;
        }
        return null;
    };

    bMap.pos = ( o, v=null, sk=null )=>{
        const b = bMap.getBone( o );
        if( !b ) return v || [0,0,0];
        return getWPos( b, v );
    }

    bMap.rot = ( o, v=null, sk=null )=>{
        const b = bMap.getBone( o );
        if( !b ) return v || [0,0,0,1];
        return getWRot( b, v );
    }

    bMap.getIndex = ( o, sk=null )=>{
        const s = sk || skel;
        return bMap.get( o );
    };

    return bMap;
}

// #endregion


// #region MISC

export function getWPos( o, v=null ){
    const v3 = new THREE.Vector3();
    o.getWorldPosition( v3 );

    if( v ){
        v[0] = v3.x;
        v[1] = v3.y;
        v[2] = v3.z;
        return v;
    }
    
    return v3.toArray();
}

export function getWRot( o, v=null ){
    const q = new THREE.Quaternion();
    o.getWorldQuaternion( q );

    if( v ){
        v[0] = q.x;
        v[1] = q.y;
        v[2] = q.z;
        v[3] = q.w;
        return v;
    }
    
    return q.toArray();
}

// #endregion

// #region LOGGING
export function logHierarchy( obj, isLast=true, lnPrefix='' ){
    const ln = isLast ? '└─' : '├─';
    console.log( `${lnPrefix}${lnPrefix ? ln : ''} ${obj.name || 'Unnamed'}` );

    if( obj.children.length > 0 ){
        const cPrefix = lnPrefix + ( isLast ? '  ' : '│ ');
        const cLast   = obj.children.length - 1;
        for( const [i,c] of obj.children.entries() ){
            logHierarchy( c, i === cLast, cPrefix );
        }
    }
}
// #endregion