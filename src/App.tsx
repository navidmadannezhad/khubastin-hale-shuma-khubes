import * as THREE from 'three'
import { forwardRef, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CubeCamera, Float, MeshReflectorMaterial, useGLTF, OrbitControls } from '@react-three/drei'
import { EffectComposer, GodRays, Bloom } from '@react-three/postprocessing'

useGLTF.preload('/models/saeed.glb')

function PigModel(props: any) {
  const group = useRef(null);
  const [mixer] = useState(() => new THREE.AnimationMixer({}));
  const actions = useRef(null);
  const ref = useRef(null)
  const [song, setSong] = useState<HTMLAudioElement | null>(null);
  const { scene, animations } = useGLTF('/models/saeed.glb')

  useEffect(() => {
    const handleClick = () => {
      if(!song){
        setSong(
          new Audio('/song.mp3')
        )
      }
    }
  
    window.addEventListener("click", handleClick)
  
    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [song])

  useEffect(() => {
    if(song) song.play();
  }, [song])

  // Optional: Animate rotation
  useFrame((_state, delta) => mixer.update(delta));
  useEffect(() => {
    (actions as any).current = { idle: mixer.clipAction(animations[0], (group as any).current) };
    (actions as any).current.idle.play();
    return () => animations.forEach((clip) => mixer.uncacheClip(clip));
  }, []);

  return (
    <group ref={group} dispose={null}>
      <primitive
        ref={ref}
        object={scene}
        {...props}
        onPointerOver={(_e: any) => (document.body.style.cursor = 'pointer')}
        onPointerOut={(_e: any) => (document.body.style.cursor = 'default')}
      />
    </group>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 35, near: 1, far: 60 }} gl={{ antialias: false }}>
      <color attach="background" args={['pink']} />
      <ambientLight />
      {/** The screen uses postpro godrays */}
      <Screen />
      {/** The sphere reflects the screen with a cube-cam */}
      <Float rotationIntensity={3} floatIntensity={3} speed={0}>
        <CubeCamera position={[-3, -1, -5]} resolution={256} frames={Infinity}>
          {(_texture) => (
            <PigModel position={[0, -4, 0]} rotation={[0, Math.PI, 0]} scale={2}>
              {/* Optional: apply envMap to material if needed */}
            </PigModel>
          )}
          {/* {(texture) => (
            <mesh>
              <sphereGeometry args={[2, 32, 32]} />
              <meshStandardMaterial metalness={1} roughness={0.1} envMap={texture} />
            </mesh>
          )} */}
        </CubeCamera>
      </Float>
      {/** The floor uses drei/MeshReflectorMaterial */}
      <Floor />
      <OrbitControls 
  enablePan={false} 
  maxPolarAngle={Math.PI / 2} 
  minDistance={5} 
  maxDistance={50}
/>
      {/* <Rig /> */}
    </Canvas>
  )
}

// function Rig() {
//   useFrame((state, delta) => {
//     easing.damp3(state.camera.position, [5 + state.pointer.x, 0 + +state.pointer.y, 18 + Math.atan2(state.pointer.x, state.pointer.y) * 2], 0.4, delta)
//     state.camera.lookAt(0, 0, 0)
//   })
// }

const Floor = () => (
  <mesh position={[0, -5.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[50, 50]} />
    <MeshReflectorMaterial
      blur={[300, 50]}
      resolution={1024}
      mixBlur={1}
      mixStrength={100}
      roughness={1}
      depthScale={1.2}
      minDepthThreshold={0.4}
      maxDepthThreshold={1.4}
      color="#202020"
      metalness={0.8}
    />
  </mesh>
)

const Emitter = forwardRef((props, forwardRef) => {
  const texture = new THREE.TextureLoader().load('/test.png')

  return (
    <mesh ref={forwardRef} position={[0, 0, -16]} {...props}>
      <planeGeometry args={[16, 10]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
      {/* Optional: Add a black border plane behind it like before */}
      <mesh scale={[16.05, 10.05, 1]} position={[0, 0, -0.01]}>
        <planeGeometry />
        <meshBasicMaterial color="black" />
      </mesh>
    </mesh>
  )
})

function Screen() {
  const [material, setMaterial] = useState()
  return (
    <>
      <Emitter ref={setMaterial} />
      {material && (
        <EffectComposer enableNormalPass={false} multisampling={8}>
          <GodRays sun={material} exposure={0.34} decay={0.8} blur />
          <Bloom luminanceThreshold={0} mipmapBlur luminanceSmoothing={0.0} intensity={1} />
        </EffectComposer>
      )}
    </>
  )
}
