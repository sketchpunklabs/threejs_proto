
// #region IMPORTS
const https = require( 'https' );
const fs    = require( 'fs' );
// #endregion

// #region HELPERS

function pullText( url ){
    return new Promise( (resolve, reject)=>{
        const req = https.get( url, res=>{
            if( res.statusCode !== 200 ){ console.log( 'Error', res.statusCode ); return; }
        
            let raw = '';
            res.setEncoding( 'utf8' );
            res.on( 'data', chunk=>{ raw += chunk });
            res.on( 'end', ()=>{ resolve( raw ); });
        } );
    
        req.on( 'error', err=>{ 
            console.error( `Error during download request: ${err.message}` );
            reject( err );
        });
        // req.end();
    });
}

function writeFile( path, body ){
    // console.log( 'WriteTo', path );
    return new Promise( (resolve, reject)=>{
        fs.writeFile( path, body, 'utf8', err=>{
            if( err ){
                console.log( 'Error writing file', path );
                console.log( err );
                return reject( err );
            }
            
            resolve( true );
        });
    });
}

function createFolder( path ){
    return new Promise( ( resolve, reject )=>{
      fs.mkdir( path, { recursive: false }, err=>{
        if( err ){
          if( err.code === 'EEXIST' ) return resolve();
  
          console.error( `Error creating folder ${path}:`, err );
          return reject( err );
        }

        resolve();
      });
    });
  }

// #endregion

// #region CONSTANTS

const VER   = '0.174.0';
const FLD   = `${__dirname}\\three_${VER.replaceAll('.','_')}\\`;
const URL   = `https://cdn.jsdelivr.net/npm/three@${VER}/`;
const FILES = [
    // MAIN STUFF
    { p:'build/three.module.min.js' },
    { p:'build/three.core.min.js' },
    { p:'build/three.tsl.min.js' },
    { p:'build/three.webgpu.min.js' },

    // EXTRA NEEDED
    { p:'examples/jsm/controls/OrbitControls.js' },
    { p:'examples/jsm/controls/TransformControls.js' },

    // GTLF LOADING
    { p:'examples/jsm/utils/BufferGeometryUtils.js' },
    { p:'examples/jsm/loaders/GLTFLoader.js', patches:[
        { find:"'../utils/BufferGeometryUtils.js'", replace:"'./BufferGeometryUtils.js'"}
    ] },
]

// #endregion

// #region MAIN
async function main(){
    let txt;
    let fName;

    await createFolder( FLD );
    
    for( let i of FILES ){
        fName   = i.p.substring( i.p.lastIndexOf( '/' ) + 1 );
        txt     = await pullText( URL + i.p );

        if( txt ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Apply Patches
            if( i.patches ){
                for( let p of i.patches )
                    txt = txt.replaceAll( p.find, p.replace );
            }
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Write File
            await writeFile( FLD + fName, txt );
        }
    }
}

main();
// #endregion