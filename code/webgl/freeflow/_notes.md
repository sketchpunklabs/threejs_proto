# FREE FLOW FIGHTING SYSTEM

### Tutorials
- https://www.youtube.com/watch?v=GFOpKcpKGKQ&t=325s
  - https://github.com/mixandjam/Batman-Arkham-Combat
- https://www.youtube.com/watch?v=1u4GMh_cWxw
- Combo Combat System : https://www.youtube.com/watch?v=RmdtA7G7cAE
- Parkour : https://www.youtube.com/watch?v=veOpS2S8Lco
- Post-Start Attack Redirection : https://www.youtube.com/watch?v=WGZ-QG-0cpw
- Jump & Fall : https://www.youtube.com/watch?v=vPFAh2T8Ipg
- Smoother Turning : https://www.youtube.com/watch?v=ysKxT3q4tA8
- Controller : https://www.youtube.com/watch?v=E3BxMgmP4m0
- Advanced Controller : https://www.youtube.com/watch?v=qIf5YQ8qJng
- Animation Tree : https://www.youtube.com/watch?v=jzuvd0Lstuw

### Examples
- Flying + FreeFlow : https://www.youtube.com/watch?v=wE5ShDXlxQQ

### Collisions
- https://wickedengine.net/2020/04/capsule-collision-detection/
- https://blog.bearcats.nl/capsule-triangle-sweep/
- https://www.gamedevs.org/uploads/geometric-primitives-proximity-detection.pdf
- https://gdbooks.gitbooks.io/3dcollisions/content/Chapter1/
  - https://gdbooks.gitbooks.io/3dcollisions/content/Chapter7/capsule.html
- https://kayacang.com/posts/capsules

### API
- Pose : Pose State
- Clip : Animation Data
  - Inc Events
- PoseSampler : Run Clip Animations
- Transition : Lerp or CrossFade
- BlendSpace1D
- BlendSpace2D
- StageSpace
- StateMachine
- Interface
  - evaluate( deltaTime, params, outPose )

{
    states:{
        walk: { type:"1D", clips:[ idle, walk, run ], transition:{ time: 0.2 } },
        jump: { type:"stage", clips:[ start, loop, end ] },
    }
    
    transitions:{
        { a:"walk", b:"jump", time }
    }

}
