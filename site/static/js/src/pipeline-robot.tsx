/**
 * The Divinci mascot for the developer pipeline page: right arm held out, a
 * document floating above the open hand, head turned to watch it.
 *
 * Why this exists alongside divinci-robot-launcher.tsx: that one mounts
 * <RobotScene>, which owns its own Canvas and exposes no way to add props to
 * the scene. Here we need a sibling object (the document) and a specific arm
 * pose, so we drive <LogoRobot> inside a Canvas of our own.
 *
 * The pose is applied by re-asserting the arm's rotation AFTER LogoRobot's own
 * animation has run. LogoRobot damps each arm toward a target every frame, so a
 * one-off assignment is overwritten immediately; a useFrame at a later priority
 * wins. That does mean reaching into the rig by traversal — see findArms — so
 * if the mascot's internals change, this needs revisiting. The durable fix is a
 * `pose` prop on the shared package.
 *
 * Built by esbuild → /static/js/pipeline-robot.js (package.json build:robot-hero).
 * Exposes window.DivinciPipelineRobot.mount(el, opts).
 */
import React, { Suspense, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { blendHex } from "@divinci-ai/robot-avatar";
import type { RobotAvatarColors } from "@divinci-ai/robot-avatar";
import { LogoRobot } from "@divinci-ai/robot-avatar/scene";

const BRAND = { primary: "#4f46e5", primaryLight: "#818cf8",
                primaryDark: "#3730a3", accent: "#ec4899" } as const;

const COLORS: RobotAvatarColors = {
  body: blendHex("#eef1f8", BRAND.primaryLight, 0.32),
  trim: BRAND.primary,
  heart: BRAND.accent,
  eye: blendHex("#2a2c2a", BRAND.primaryDark, 0.5),
  shadow: blendHex("#0e140e", BRAND.primaryDark, 0.7),
};

/** Tunables, overridable from the query string while we dial the pose in. */
function q(name: string, fallback: number): number {
  const v = parseFloat(new URLSearchParams(location.search).get(name) || "");
  return isNaN(v) ? fallback : v;
}

/* LogoRobot builds each limb as:
     <group position={[side * 0.97, 0.05, 0]} scale={[-side, 1, 1]}>
       <group ref={arm} position={[0, 0.45, 0]}>
   so an arm pivot is a group at local y = 0.45 whose parent sits at x = ±0.97.
   Matching on that shape rather than on names, which the rig does not set. */
function findArms(root: THREE.Object3D): { left: THREE.Object3D[]; right: THREE.Object3D[] } {
  const left: THREE.Object3D[] = [], right: THREE.Object3D[] = [];
  root.traverse((o) => {
    const p = o.parent;
    if (!p) return;
    if (Math.abs(o.position.y - 0.45) > 1e-3) return;
    if (Math.abs(o.position.x) > 1e-3) return;
    if (Math.abs(Math.abs(p.position.x) - 0.97) > 0.05) return;
    (p.position.x < 0 ? right : left).push(o);   // his right is viewer-left
  });
  return { left, right };
}

/* The hand is the sphere capping the arm — the mesh whose world position sits
   farthest from the arm pivot. Finding it by distance rather than by geometry
   type keeps this working if the rig ever caps the limb with something else. */
function findHand(pivot: THREE.Object3D): THREE.Object3D | null {
  pivot.updateWorldMatrix(true, true);
  const origin = new THREE.Vector3().setFromMatrixPosition(pivot.matrixWorld);
  const p = new THREE.Vector3();
  let best: THREE.Object3D | null = null, bestD = -1;
  pivot.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const d = p.setFromMatrixPosition(o.matrixWorld).distanceTo(origin);
    if (d > bestD) { bestD = d; best = o; }
  });
  return best;
}

function Pose({ target, hand }: {
  target: React.RefObject<THREE.Group>;
  hand: React.MutableRefObject<THREE.Object3D | null>;
}): null {
  const arms = useRef<ReturnType<typeof findArms> | null>(null);
  const armZ = useMemo(() => q("armz", -1.75), []);
  const settle = useRef(0);
  /* Priority MUST stay 0. In r3f, any useFrame with priority > 0 means "I am
     taking over rendering" and the automatic render is disabled — the scene
     builds, the context is healthy, and nothing is ever drawn. Ordering is
     achieved instead by subscription order: same-priority callbacks run in the
     order they mounted, and <Pose> is placed after <LogoRobot> in the tree, so
     it still overwrites the arm rotation after the rig has damped it. */
  useFrame((_, dt) => {
    const g = target.current;
    if (!g) return;
    if (!arms.current || !arms.current.right.length) arms.current = findArms(g);
    settle.current = Math.min(1, settle.current + dt * 1.6);
    const e = settle.current * settle.current * (3 - 2 * settle.current);
    arms.current.right.forEach((a) => { a.rotation.z = armZ * e; });
    if (!hand.current && arms.current.right[0]) hand.current = findHand(arms.current.right[0]);
  });
  return null;
}

/** The document he is presenting: a thin slab with ruled lines, gently bobbing.
 *
 * It rides the hand rather than sitting at fixed world coordinates. Hand-tuned
 * docx/docy drifted out of alignment every time the arm pose changed — the doc
 * ended up floating up and to the LEFT of the open hand — and each fix was
 * another guess-and-render round. Reading the hand's world position each frame
 * makes the offset mean what it says: "this far above the hand". */
function FloatingDoc({ hand }: {
  hand: React.MutableRefObject<THREE.Object3D | null>;
}): React.ReactElement {
  const g = useRef<THREE.Group>(null);
  const at = useMemo(() => new THREE.Vector3(), []);
  const paper = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#f6f2e9", roughness: 0.85, metalness: 0.02 }), []);
  const ink = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1d2b4a", roughness: 0.7 }), []);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * 0.9) * 0.05;
    if (hand.current) {
      /* r3f flushes world matrices during render, i.e. after every useFrame, so
         reading matrixWorld here would be a frame stale — visible as the doc
         lagging the arm through the 1s ease-in. Force it current instead. */
      hand.current.updateWorldMatrix(true, false);
      at.setFromMatrixPosition(hand.current.matrixWorld);
      g.current.position.set(at.x + q("docdx", 0.02), at.y + q("docdy", 0.56) + bob,
                             at.z + q("docdz", 0.38));
    } else {
      g.current.position.y = q("docy", 0.94) + bob;
    }
    g.current.rotation.z = -0.12 + Math.sin(t * 0.7) * 0.03;
    g.current.rotation.y = 0.34 + Math.sin(t * 0.5) * 0.05;
  });
  return (
    <group ref={g} position={[q("docx", -1.42), q("docy", 0.94), q("docz", 0.4)]} scale={q("docs", 0.8)}>
      <mesh material={paper} castShadow>
        <boxGeometry args={[0.86, 1.12, 0.03]} />
      </mesh>
      {[0.38, 0.22, 0.06, -0.1, -0.26, -0.42].map((y, i) => (
        <mesh key={i} material={ink} position={[i % 3 === 2 ? -0.12 : 0, y, 0.019]}>
          <boxGeometry args={[i % 3 === 2 ? 0.42 : 0.64, 0.035, 0.004]} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ onFail }: { onFail: () => void }): React.ReactElement {
  const robot = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Object3D | null>(null);
  /* Gaze follows the document rather than the cursor. LogoRobot clamps lookX to
     ±0.6 and scales it by 0.34, so this can buy at most ~11.7° of head turn —
     -1 here is simply "as far as the rig allows". The rest of the attention
     comes from roty, which angles his whole body toward the document. */
  const speakerTarget = useCallback((): [number, number] =>
    [q("gazex", -1), q("gazey", 0.3)], []);
  return (
    <Canvas
      /* camz 10.5 left the robot adrift in a mostly empty frame: the content is
         ~3.3 world units tall and the frame showed 6.4. fov is vertical, so the
         visible height is 2*camz*tan(fov/2) — 6.6 gives ~4.0, a snug margin.
         camx offsets toward the doc side, which the arm and paper extend into. */
      camera={{ position: [q("camx", -0.45), q("camy", -0.1), q("camz", 6.6)], fov: q("fov", 34) }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power",
            preserveDrawingBuffer: true }}
      onCreated={(st) => {
        st.gl.domElement.addEventListener("webglcontextlost", onFail, { once: true });
        (window as unknown as Record<string, unknown>).__r3f = st;
      }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color={COLORS.trim} />
      {q("noenv", 0) ? null : (
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={2.2} position={[0, 2.5, 3]} scale={[6, 6, 1]} />
          <Lightformer intensity={0.9} position={[-3, 1, 2]} scale={[3, 4, 1]} color={COLORS.trim} />
          <Lightformer intensity={0.7} position={[3, -1.5, 2]} scale={[3, 3, 1]} />
        </Environment>
      )}
      <group ref={robot} position={[q("robx", 0.15), 0, 0]} rotation={[0, q("roty", -0.34), 0]}>
        <LogoRobot state="idle" colors={COLORS} speakerTarget={speakerTarget} />
      </group>
      <Pose target={robot} hand={hand} />
      <FloatingDoc hand={hand} />
    </Canvas>
  );
}

export interface MountOptions { onFail?: () => void }

function mount(el: HTMLElement, opts: MountOptions = {}): () => void {
  const root = createRoot(el);
  const fail = opts.onFail || ((): void => {});
  root.render(<Suspense fallback={null}><Scene onFail={fail} /></Suspense>);
  return () => root.unmount();
}

(window as unknown as { DivinciPipelineRobot: { mount: typeof mount } })
  .DivinciPipelineRobot = { mount };
