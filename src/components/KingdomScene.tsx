import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CatmullRomCurve3, Vector3, type Group } from "three";

export const realmSites = [
  [-.2, -2.1], [-3.3, -1.6], [2.8, -2.5], [-3.2, 1.3],
  [3.2, .6], [.5, 2.6], [-1.3, .3], [2, 3], [-.5, -4],
] as const;

function CameraControls({ zoom }: { zoom: number }) {
  const { camera, gl, size, invalidate } = useThree();
  useEffect(() => {
    if (!("zoom" in camera)) return;
    camera.zoom = Math.min(size.width / 15, size.height / 12) * zoom;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, zoom, invalidate]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, .3, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = .35;
    controls.maxPolarAngle = 1.1;
    controls.addEventListener("change", () => invalidate());
    controls.update();
    return () => { controls.dispose(); };
  }, [camera, gl, invalidate]);
  return null;
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .28, 0]}><cylinderGeometry args={[.06, .09, .56, 5]} /><meshStandardMaterial color="#82694a" /></mesh>
    <mesh position={[0, .72, 0]} castShadow><coneGeometry args={[.38, .9, 6]} /><meshStandardMaterial color="#496b59" roughness={1} /></mesh>
    <mesh position={[0, 1, 0]} castShadow><coneGeometry args={[.27, .7, 6]} /><meshStandardMaterial color="#6b8a68" roughness={1} /></mesh>
  </group>;
}

function Building({ index, selected, onSelect }: { index: number; selected: boolean; onSelect: () => void }) {
  const [x, z] = realmSites[index];
  const castle = index === 0;
  const tower = index === 2 || index === 8;
  const color = ["#e0cfa7", "#c8bea1", "#b6c4bc", "#b7aaa0", "#d6bea3", "#c6b390", "#b8c2ab", "#d8c89e", "#b9bbac"][index];
  return <group position={[x, .35, z]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}>
      <ringGeometry args={[.65, selected ? .87 : .71, 48]} /><meshBasicMaterial color={selected ? "#f3d18b" : "#aebc97"} transparent opacity={selected ? 1 : .5} />
    </mesh>
    <mesh position={[0, .05, 0]} receiveShadow><cylinderGeometry args={[.67, .75, .12, 8]} /><meshStandardMaterial color="#a4a58b" /></mesh>
    <mesh position={[0, castle ? .65 : tower ? .8 : .4, 0]} castShadow receiveShadow>
      <boxGeometry args={[castle ? 1 : .65, castle ? 1.2 : tower ? 1.5 : .65, .65]} /><meshStandardMaterial color={color} roughness={.8} />
    </mesh>
    <mesh position={[0, castle ? 1.4 : tower ? 1.65 : .9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[castle ? .85 : .59, .6, 4]} /><meshStandardMaterial color={index === 4 ? "#9b6858" : "#3c6461"} metalness={.15} roughness={.7} />
    </mesh>
    {castle && [-.65, .65].map((offset) => <group key={offset} position={[offset, 0, .15]}>
      <mesh position={[0, .7, 0]} castShadow><cylinderGeometry args={[.22, .26, 1.4, 8]} /><meshStandardMaterial color="#d6c6a3" /></mesh>
      <mesh position={[0, 1.65, 0]} castShadow><coneGeometry args={[.35, .6, 8]} /><meshStandardMaterial color="#3c6461" /></mesh>
    </group>)}
    <mesh position={[0, .33, .335]}><boxGeometry args={[.16, .32, .015]} /><meshStandardMaterial color="#3a4a42" /></mesh>
    <mesh position={[0, tower ? 1.1 : .64, .34]}><boxGeometry args={[.12, .16, .02]} /><meshStandardMaterial color="#e9cc85" emissive="#c79c50" emissiveIntensity={.5} /></mesh>
    {selected && <mesh position={[0, castle ? 2.5 : 2.25, 0]} rotation={[0, 0, Math.PI / 4]}>
      <octahedronGeometry args={[.17]} /><meshStandardMaterial color="#f6d894" metalness={.5} roughness={.2} emissive="#ad8143" emissiveIntensity={.4} />
    </mesh>}
  </group>;
}

function Landscape({ selected, onSelect, rotation, motion }: { selected: number; onSelect: (index: number) => void; rotation: number; motion: boolean }) {
  const group = useRef<Group>(null);
  const path = new CatmullRomCurve3([[-.5, .4, -4], [2.8, .4, -2.5], [-.2, .4, -2.1], [-3.3, .4, -1.6], [-1.3, .4, .3], [-3.2, .4, 1.3], [.5, .4, 2.6], [2, .4, 3], [3.2, .4, .6]].map((p) => new Vector3(...p)));
  useFrame(({ clock }) => {
    if (group.current && motion) group.current.position.y = Math.sin(clock.elapsedTime * .5) * .07;
  });
  return <group ref={group} rotation={[0, rotation, 0]}>
    <mesh position={[0, -.65, 0]} castShadow><cylinderGeometry args={[5.6, 4.6, 1.7, 9]} /><meshStandardMaterial color="#5d6655" roughness={1} flatShading /></mesh>
    <mesh position={[0, -.12, 0]} receiveShadow><cylinderGeometry args={[5.72, 5.5, .8, 9]} /><meshStandardMaterial color="#718668" roughness={1} flatShading /></mesh>
    <mesh position={[0, .29, 0]} receiveShadow><cylinderGeometry args={[5.7, 5.7, .06, 9]} /><meshStandardMaterial color="#91a27e" roughness={1} /></mesh>
    <mesh><tubeGeometry args={[path, 100, .09, 6, false]} /><meshStandardMaterial color="#e4d4ad" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, -.35]} position={[.1, .34, 0]}>
      <planeGeometry args={[.45, 10.2]} /><meshStandardMaterial color="#7fb1af" metalness={.35} roughness={.3} />
    </mesh>
    <mesh position={[-.1, .45, .8]} rotation={[0, -.35, 0]} castShadow><boxGeometry args={[1.2, .1, .5]} /><meshStandardMaterial color="#c5ac83" /></mesh>
    {Array.from({ length: 44 }, (_, index) => {
      const angle = index * 2.39996;
      const radius = 4.25 + Math.sin(index * 7) * .65;
      return <Tree key={index} position={[Math.cos(angle) * radius, .35, Math.sin(angle) * radius]} scale={.5 + (index % 4) * .12} />;
    })}
    {realmSites.map((_, index) => <Building key={index} index={index} selected={selected === index} onSelect={() => onSelect(index)} />)}
    <group position={[-5.4, 1, -3.2]} scale={.65}>
      <mesh><dodecahedronGeometry args={[1.1, 0]} /><meshStandardMaterial color="#7e8f73" flatShading /></mesh><Tree position={[0, .6, 0]} />
    </group>
    <group position={[5.8, .9, 2.7]} scale={.5}>
      <mesh><dodecahedronGeometry args={[1.2, 0]} /><meshStandardMaterial color="#7e8f73" flatShading /></mesh><Tree position={[0, .6, 0]} />
    </group>
  </group>;
}

export default function KingdomScene(props: { selected: number; onSelect: (index: number) => void; rotation: number; motion: boolean; zoom: number; onUnavailable: () => void }) {
  return <Canvas orthographic camera={{ position: [11, 13, 15], near: .1, far: 100, zoom: 40 }} shadows dpr={[1, 1.5]} frameloop={props.motion ? "always" : "demand"}
    gl={{ antialias: true, alpha: true }} fallback={<div className="atlas-fallback">Explore the realm using the destinations below.</div>}
    onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", props.onUnavailable, { once: true }); }}>
    <ambientLight intensity={1.6} color="#e1e8df" />
    <directionalLight position={[-5, 12, 7]} intensity={2.8} color="#ffe9be" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-.001} />
    <CameraControls zoom={props.zoom} />
    <Landscape {...props} />
  </Canvas>;
}
