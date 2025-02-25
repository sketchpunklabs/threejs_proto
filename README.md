## ThreeJS ProtoTyping
[![twitter](https://img.shields.io/badge/TwitterX-profile-blue?style=flat-square&logo=x)](https://x.com/SketchpunkLabs)
[![bluesky](https://img.shields.io/badge/BlueSky-profile-blue?style=flat-square&logo=bluesky)](https://bsky.app/profile/sketchpunk.bsky.social)
[![mastodon](https://img.shields.io/badge/Mastodon-profile-blue?style=flat-square&logo=mastodon)](https://mastodon.gamedev.place/@sketchpunk)
[![youtube](https://img.shields.io/badge/Youtube-subscribe-red?style=flat-square&logo=youtube)](https://youtube.com/c/sketchpunklabs)
[![sponsors](https://img.shields.io/badge/Sponsor-donate-blue?style=flat-square&logo=github)](https://github.com/sponsors/sketchpunklabs)
[![Patreon](https://img.shields.io/badge/Patreon-donate-red?style=flat-square&logo=youtube)](https://www.patreon.com/sketchpunk)

## Setup
```
git clone --depth=1 https://github.com/sketchpunklabs/threejs_proto.git
cd threejs_proto
pnpm install -g browser-sync
pnpm run dev
```

## Purpose
Repo is for long term prototyping & organization of code. ThreeJS tends to have code breaking changes over time, this leads to an importantance of having multiple versions of the library. Even modified version to the library will be needed from time to time to access core api features that the library doesn't support. The point is to keep old prototypes working by pointing to older version of the library while still being able to use newer versions.

For now the use of import-map is used to help define the enviroment for each prototype. This is important because of how WebGL & WebGPU is created to use "three" as the import path that actually points to 2 different files. WebGPU also requires more imports because of the dependence on TSL.

__Current enviroments this repo will be supporting:__
- Run WebGL2 with WebGLRenderer
- Run WebGPU with WebGPURenderer
- Run WebGL2 with TSL with WebGPURenderer with forceWebGL turned on
- Modified Threejs to use TransformFeedback in WebGL2

__Visual Debug Features:__
- Dynamic points with various shape renders
- Dynamic lines along with extra methods to render line cubes / circles
- Dynamic text using GLSL pixel font renderering
- Colored Faced Cube

__UI Features:__
- Tweakpane with essentials plugin