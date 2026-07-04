/**
 * Divinci robot chat launcher — the 3D mascot from the SDK docs hero,
 * rendered inside the floating chat-bubble button on divinci.ai.
 *
 * This bundle is HEAVY (react + three.js + @react-three/fiber + the shared
 * @divinci-ai/robot-avatar scene) and is therefore lazy-loaded by the chat
 * widget ONLY after a capability probe passes (see divinci-chat-widget.ts).
 * It never loads for low-power / software-WebGL / reduced-motion visitors —
 * they keep the emoji bubble.
 *
 * Built by esbuild → /static/js/divinci-robot.js (package.json build:robot).
 * Exposes window.DivinciRobotLauncher.mount(el, opts).
 */
import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { blendHex } from "@divinci-ai/robot-avatar";
import type { RobotAvatarColors, AvatarState } from "@divinci-ai/robot-avatar";
import { RobotScene } from "@divinci-ai/robot-avatar/scene";

// Divinci brand — same palette the SDK docs hero resolves for the mascot.
const BRAND = {
  primary: "#4f46e5",
  primaryLight: "#818cf8",
  primaryDark: "#3730a3",
  accent: "#ec4899",
} as const;

const COLORS: RobotAvatarColors = {
  body: blendHex("#eef1f8", BRAND.primaryLight, 0.32),
  trim: BRAND.primary,
  heart: BRAND.accent,
  eye: blendHex("#2a2c2a", BRAND.primaryDark, 0.5),
  shadow: blendHex("#0e140e", BRAND.primaryDark, 0.7),
};

export interface RobotLauncherOptions {
  /** Called when WebGL fails/degrades — the widget reverts to the emoji bubble. */
  onFail: () => void;
  /** Initial avatar state; the launcher idles by default. */
  state?: AvatarState;
}

function LauncherRobot({ onFail, state = "idle" }: RobotLauncherOptions): React.ReactElement {
  // The launcher is always on screen (fixed bubble), so the only pause
  // signal that matters is tab visibility.
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const onVis = (): void => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const onContextLost = useCallback(() => onFail(), [onFail]);

  return (
    <RobotScene
      state={state}
      colors={COLORS}
      paused={hidden}
      dpr={[1, 1.5]}
      onContextLost={onContextLost}
    />
  );
}

class RobotErrorBoundary extends React.Component<
  { onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(): void {
    this.props.onFail();
  }
  render(): React.ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

function mount(container: HTMLElement, opts: RobotLauncherOptions): () => void {
  const root = createRoot(container);
  root.render(
    <RobotErrorBoundary onFail={opts.onFail}>
      <LauncherRobot onFail={opts.onFail} state={opts.state} />
    </RobotErrorBoundary>,
  );
  return () => root.unmount();
}

declare global {
  interface Window {
    DivinciRobotLauncher?: { mount: typeof mount };
  }
}

window.DivinciRobotLauncher = { mount };
