
const prepend = ( document.location.hostname.indexOf( 'localhost' ) === -1 )? '/threejs_proto' : '';

document.body.appendChild(Object.assign(document.createElement('script'), {
type		: 'importmap',
innerHTML	: `
    {"imports":{
        "three"             : "${prepend}/thirdparty/three_0_172_0/three.module.min.js",
        "OrbitControls"	    : "${prepend}/thirdparty/three_0_172_0/OrbitControls.js",
        "@lib/"             : "${prepend}/lib/",
        "@tp/"              : "${prepend}/thirdparty/"
    }}
`}));


