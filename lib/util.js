
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