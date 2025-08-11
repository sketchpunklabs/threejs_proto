
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