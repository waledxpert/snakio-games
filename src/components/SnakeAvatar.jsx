import { useEffect, useRef } from "react";
import { CELL, createGridWanderer, creatureMarkup } from "../snakiox/liveSnake";
import { hashSeed } from "../snakiox/generator";

// An animated Snakiox that crawls around its container with PIXEL-style motion —
// the SAME render-core artwork as the NFT, stepping one whole cell at a time on
// a small grid (no smooth gliding). Used for the wallet grid + selection panels
// so "Your Snakiox" feels alive. Each avatar wanders its own way (seeded by its
// token) and updates only `stepRate` times a second, so many can run at once
// without burning frames.
const GRID_N = 12;

export default function SnakeAvatar({ token, len, className = "", stepRate = 7 }) {
  const hostRef = useRef(null);

  const traits = token.traits;
  const tokenId = token.tokenId ?? token.seed ?? token.name;
  // Keep avatars light + nicely coiled inside the box.
  const segLen = Math.max(10, Math.min(len ?? token.len ?? 22, 22));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const seed = hashSeed(`${tokenId}:${traits.skin}`);
    const wanderer = createGridWanderer({ gridN: GRID_N, len: segLen, seed });

    const vb = GRID_N * CELL;
    const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges">`;
    const render = () => {
      host.innerHTML = open + creatureMarkup(traits, segLen, wanderer.pos) + "</svg>";
    };
    render(); // warmed body, drawn once immediately

    const interval = 1000 / stepRate;
    let raf = 0;
    let last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || t - last < interval) return; // throttle + pause off-tab
      last = t;
      wanderer.step();
      render();
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, traits.skin, segLen, stepRate]);

  return <div ref={hostRef} className={`snake-avatar ${className}`} aria-label={`${token.name} slithering`} />;
}
