import * as THREE from 'three';

export default function screenQuad( mat, order=100, size=2 ){
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry(size, size, 1), mat );
    mesh.renderOrder    = order
    mesh.frustumCulled  = false;

    // mat.depthTest   = true;
    // mat.depthWrite  = true;
    // mat.transparent = true;

    return mesh;
}
