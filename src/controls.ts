import { randomSeed } from "./prng.js";
import { chalkTexture } from "./chalk.js";
import {
  type RoughOptions,
  roughCheckmark,
  roughCircle,
  roughLine,
  roughRoundedRect,
  scribbleFill,
  variants,
} from "./rough.js";

export interface ChalkablyOptions {
  seed?: number;
  roughness?: number;
  boil?: number;
  stroke?: string;
  fill?: string;
  paper?: string;
  width?: number;
}

export interface SketchHandle {
  resketch(seed?: number): void;
  destroy(): void;
}

interface Layer {
  className: string;
  pathLength?: boolean;
  texture?: boolean;
  gen(w: number, h: number, o: RoughOptions): string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const INSET = 3;

function attachChrome(
  el: HTMLElement,
  layers: Layer[],
  opts: ChalkablyOptions,
  interactive: boolean,
): SketchHandle {
  if (!(el instanceof HTMLElement)) throw new Error("chalkably: expected an HTMLElement");
  el.classList.add("chalkably-host");
  if (opts.stroke) el.style.setProperty("--chalkably-stroke", opts.stroke);
  if (opts.fill) el.style.setProperty("--chalkably-fill", opts.fill);
  if (opts.paper) el.style.setProperty("--chalkably-paper", opts.paper);
  if (opts.width !== undefined) el.style.setProperty("--chalkably-width", String(opts.width));

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "chalkably-svg");
  svg.setAttribute("aria-hidden", "true");
  el.prepend(svg);

  const roughness = opts.roughness ?? 1;
  const boil = opts.boil ?? 0.3;
  let seed = opts.seed ?? randomSeed();

  function draw() {
    const w = el.offsetWidth || 120;
    const h = el.offsetHeight || 36;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.textContent = "";
    for (const [layerIndex, layer] of layers.entries()) {
      const ds = variants((o) => layer.gen(w, h, o), { seed, roughness, boil }, boil > 0 ? 3 : 1);
      ds.forEach((d, i) => {
        const texture = chalkTexture(seed, layerIndex, i);
        const boilingClass = ds.length > 1 ? " chalkably-boil" : "";
        const core = document.createElementNS(SVG_NS, "path");
        core.setAttribute("d", d);
        core.setAttribute("class", `chalkably-stroke ${layer.className}${boilingClass}`);
        core.dataset.i = String(i);
        core.dataset.chalkLayer = "core";
        setTexture(core, texture, "core");
        if (layer.pathLength) core.setAttribute("pathLength", "1");
        svg.append(core);

        if (layer.texture !== false) {
          const powder = document.createElementNS(SVG_NS, "path");
          powder.setAttribute("d", d);
          powder.setAttribute("class", `chalkably-mark chalkably-powder${boilingClass}`);
          powder.dataset.i = String(i);
          powder.dataset.chalkLayer = "powder";
          setTexture(powder, texture, "powder");
          svg.append(powder);

          const edge = document.createElementNS(SVG_NS, "path");
          edge.setAttribute("d", d);
          edge.setAttribute("class", `chalkably-mark chalkably-edge${boilingClass}`);
          edge.dataset.i = String(i);
          edge.dataset.chalkLayer = "edge";
          setTexture(edge, texture, "edge");
          edge.setAttribute("transform", `translate(${texture.edgeX} ${texture.edgeY})`);
          svg.append(edge);
        }
      });
    }
  }

  draw();

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => draw()) : null;
  ro?.observe(el);

  const resketch = (s?: number) => {
    seed = s ?? randomSeed();
    draw();
  };

  const reduced =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onPointer = () => resketch();
  if (interactive && !reduced) {
    el.addEventListener("pointerenter", onPointer);
    el.addEventListener("pointerdown", onPointer);
  }

  return {
    resketch,
    destroy() {
      ro?.disconnect();
      el.removeEventListener("pointerenter", onPointer);
      el.removeEventListener("pointerdown", onPointer);
      svg.remove();
      el.classList.remove("chalkably-host");
    },
  };
}

function setTexture(
  path: SVGPathElement,
  texture: ReturnType<typeof chalkTexture>,
  layer: "core" | "powder" | "edge",
): void {
  let dash = texture.coreDash;
  let opacity = texture.coreOpacity;
  if (layer === "powder") {
    dash = texture.powderDash;
    opacity = texture.powderOpacity;
  }
  if (layer === "edge") {
    dash = texture.edgeDash;
    opacity = texture.edgeOpacity;
  }
  path.style.setProperty("--chalkably-dash", dash);
  path.style.setProperty("--chalkably-opacity", opacity);
}

const outlineRect =
  (r: number): Layer["gen"] =>
  (w, h, o) =>
    roughRoundedRect(INSET, INSET, w - 2 * INSET, h - 2 * INSET, r, o);

const focusRect =
  (r: number): Layer["gen"] =>
  (w, h, o) =>
    roughRoundedRect(-1, -1, w + 2, h + 2, r, o);

export type ChalkablyButtonState = "idle" | "loading" | "error" | "success";

export interface ChalkablyButtonOptions extends ChalkablyOptions {
  variant?: "outline" | "solid" | "scribble";
  state?: ChalkablyButtonState;
  tone?: "neutral" | "danger";
}

export interface ChalkablyButtonSketch extends SketchHandle {
  setState(state: ChalkablyButtonState): void;
}

export function chalkablyButton(el: HTMLElement, opts: ChalkablyButtonOptions = {}): ChalkablyButtonSketch {
  const variant = opts.variant ?? "outline";
  const layers: Layer[] = [];
  if (variant === "solid") layers.push({ className: "chalkably-blob", gen: outlineRect(8) });
  if (variant === "scribble")
    layers.push({
      className: "chalkably-scribble",
      gen: (w, h, o) => scribbleFill(INSET + 2, INSET + 2, w - 2 * INSET - 4, h - 2 * INSET - 4, o),
    });
  layers.push({ className: "chalkably-outline", gen: outlineRect(8) });
  layers.push({ className: "chalkably-focus", texture: false, gen: focusRect(10) });
  const sketch = attachChrome(el, layers, opts, true);
  el.classList.add("chalkably-button", `chalkably-button--${variant}`);
  if (opts.tone) el.classList.add(`chalkably-button--${opts.tone}`);
  const setState = (state: ChalkablyButtonState) => {
    if (state === "idle") delete el.dataset.state;
    else el.dataset.state = state;
  };
  if (opts.state) setState(opts.state);
  return {
    resketch: sketch.resketch,
    setState,
    destroy() {
      sketch.destroy();
      delete el.dataset.state;
    },
  };
}

export function chalkablyCard(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  const sketch = attachChrome(el, [{ className: "chalkably-outline", gen: outlineRect(10) }], opts, false);
  el.classList.add("chalkably-card");
  return sketch;
}

function syncedControl(
  el: HTMLElement,
  type: "checkbox" | "radio",
  layers: Layer[],
  opts: ChalkablyOptions,
  cls: string,
): SketchHandle {
  const input = el?.querySelector?.<HTMLInputElement>(`input[type="${type}"]`);
  if (!input) throw new Error(`chalkably: ${cls} wrapper needs an <input type="${type}">`);
  const sync = () => {
    if (input.checked) el.dataset.checked = "";
    else delete el.dataset.checked;
  };
  sync();
  // ponytail: a radio unchecks silently when a sibling is picked — one document
  // listener re-reads state on any change instead of tracking the group
  const target = type === "radio" ? document : input;
  target.addEventListener("change", sync);
  const sketch = attachChrome(el, layers, opts, true);
  el.classList.add(cls);
  return {
    resketch: sketch.resketch,
    destroy() {
      target.removeEventListener("change", sync);
      sketch.destroy();
      el.classList.remove(cls);
      delete el.dataset.checked;
    },
  };
}

export function chalkablyCheckbox(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  return syncedControl(
    el,
    "checkbox",
    [
      { className: "chalkably-outline", gen: outlineRect(5) },
      {
        className: "chalkably-check",
        pathLength: true,
        texture: false,
        gen: (w, h, o) => roughCheckmark(w * 0.24, h * 0.2, w * 0.52, h * 0.5, o),
      },
      { className: "chalkably-focus", texture: false, gen: focusRect(7) },
    ],
    opts,
    "chalkably-checkbox",
  );
}

export function chalkablyRadio(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  return syncedControl(
    el,
    "radio",
    [
      {
        className: "chalkably-outline",
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 - INSET, o),
      },
      {
        className: "chalkably-dot",
        texture: false,
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) * 0.18, o),
      },
      {
        className: "chalkably-focus",
        texture: false,
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 + 1, o),
      },
    ],
    opts,
    "chalkably-radio",
  );
}

export function chalkablyToggle(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  return syncedControl(
    el,
    "checkbox",
    [
      { className: "chalkably-outline", gen: (w, h, o) => outlineRect((h - 2 * INSET) / 2)(w, h, o) },
      {
        className: "chalkably-blob chalkably-knob",
        texture: false,
        gen: (w, h, o) => roughCircle(h / 2, h / 2, h / 2 - INSET - 3, o),
      },
      { className: "chalkably-focus", texture: false, gen: focusRect(12) },
    ],
    opts,
    "chalkably-toggle",
  );
}

export function chalkablyDivider(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  const sketch = attachChrome(
    el,
    [{ className: "chalkably-outline", gen: (w, h, o) => roughLine(INSET, h / 2, w - INSET, h / 2, o) }],
    opts,
    false,
  );
  el.classList.add("chalkably-divider");
  return sketch;
}

export function chalkablyInput(el: HTMLElement, opts: ChalkablyOptions = {}): SketchHandle {
  if (!el?.querySelector?.("input")) throw new Error("chalkably: input wrapper needs an <input>");
  const sketch = attachChrome(
    el,
    [
      { className: "chalkably-outline", gen: outlineRect(6) },
      { className: "chalkably-focus", texture: false, gen: focusRect(8) },
    ],
    opts,
    false,
  );
  el.classList.add("chalkably-inputbox");
  return sketch;
}
