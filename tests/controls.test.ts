import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chalkablyButton, chalkablyCard } from "../src/controls.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  if (originalMatchMedia) Object.defineProperty(globalThis, "matchMedia", originalMatchMedia);
  originalMatchMedia = undefined;
});

let originalMatchMedia: PropertyDescriptor | undefined;

function mountButton(opts = {}) {
  const el = document.createElement("button");
  el.textContent = "Done";
  document.body.append(el);
  return { el, sketch: chalkablyButton(el, opts) };
}

describe("chalkablyButton", () => {
  it("throws on a null element", () => {
    expect(() => Reflect.apply(chalkablyButton, undefined, [null])).toThrow();
  });

  it("injects an aria-hidden svg with 3 boil variants per layer", () => {
    const { el } = mountButton({ seed: 1 });
    const svg = el.querySelector("svg.chalkably-svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    const paths = el.querySelectorAll("path.chalkably-boil.chalkably-outline");
    expect(paths).toHaveLength(3);
    expect(paths[0].dataset.i).toBe("0");
    expect(paths[2].dataset.i).toBe("2");
    expect(new Set([...paths].map((p) => p.getAttribute("d"))).size).toBe(3);
  });

  it("boil 0 draws a single static path per layer", () => {
    const { el } = mountButton({ seed: 1, boil: 0 });
    expect(el.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(1);
    expect(el.querySelectorAll("path.chalkably-boil")).toHaveLength(0);
  });

  it("adds seeded powder and edge marks with uneven dash density", () => {
    const first = mountButton({ seed: 17 });
    const firstMarks = [...first.el.querySelectorAll("path.chalkably-mark")].map((path) => ({
      className: path.getAttribute("class"),
      dash: path.style.getPropertyValue("--chalkably-dash"),
      opacity: path.style.getPropertyValue("--chalkably-opacity"),
      transform: path.getAttribute("transform"),
    }));
    const second = mountButton({ seed: 17 });
    const secondMarks = [...second.el.querySelectorAll("path.chalkably-mark")].map((path) => ({
      className: path.getAttribute("class"),
      dash: path.style.getPropertyValue("--chalkably-dash"),
      opacity: path.style.getPropertyValue("--chalkably-opacity"),
      transform: path.getAttribute("transform"),
    }));
    expect(firstMarks).toEqual(secondMarks);
    expect(firstMarks).toHaveLength(6);
    expect(new Set(firstMarks.map(({ dash }) => dash)).size).toBeGreaterThan(1);
    expect(firstMarks.some(({ className }) => className.includes("chalkably-powder"))).toBe(true);
    expect(firstMarks.some(({ className }) => className.includes("chalkably-edge"))).toBe(true);
  });

  it("does not add pointer redraw listeners when motion is reduced", () => {
    originalMatchMedia = Object.getOwnPropertyDescriptor(globalThis, "matchMedia");
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    const { el } = mountButton({ seed: 1 });
    const first = el.querySelector("path.chalkably-stroke")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path.chalkably-stroke")?.getAttribute("d")).toBe(first);
  });

  it("draws a hand-drawn focus ring layer", () => {
    const { el } = mountButton({ seed: 1 });
    expect(el.querySelectorAll("path.chalkably-focus")).toHaveLength(3);
  });

  it("sets paper and width custom properties from options", () => {
    const { el } = mountButton({ paper: "#fff", width: 3 });
    expect(el.style.getPropertyValue("--chalkably-paper")).toBe("#fff");
    expect(el.style.getPropertyValue("--chalkably-width")).toBe("3");
  });

  it("adds host and variant classes", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.classList.contains("chalkably-host")).toBe(true);
    expect(el.classList.contains("chalkably-button")).toBe(true);
    expect(el.classList.contains("chalkably-button--solid")).toBe(true);
  });

  it("solid variant adds a blob layer under the outline", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.querySelectorAll("path.chalkably-stroke.chalkably-blob")).toHaveLength(3);
    expect(el.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
  });

  it("scribble variant adds a scribble layer", () => {
    const { el } = mountButton({ seed: 1, variant: "scribble" });
    expect(el.querySelectorAll("path.chalkably-stroke.chalkably-scribble")).toHaveLength(3);
  });

  it("sets colour custom properties from options", () => {
    const { el } = mountButton({ stroke: "red", fill: "blue" });
    expect(el.style.getPropertyValue("--chalkably-stroke")).toBe("red");
    expect(el.style.getPropertyValue("--chalkably-fill")).toBe("blue");
  });

  it("resketch is deterministic per seed and changes the drawing", () => {
    const { el, sketch } = mountButton({ seed: 1 });
    const d = () => el.querySelector("path")?.getAttribute("d");
    const d1 = d();
    sketch.resketch(2);
    const d2 = d();
    expect(d2).not.toBe(d1);
    sketch.resketch(1);
    expect(d()).toBe(d1);
  });

  it("re-sketches on pointerenter and pointerdown", () => {
    const { el } = mountButton({ seed: 1 });
    const d = () => el.querySelector("path")?.getAttribute("d");
    const d1 = d();
    el.dispatchEvent(new Event("pointerenter"));
    const d2 = d();
    expect(d2).not.toBe(d1);
    el.dispatchEvent(new Event("pointerdown"));
    expect(d()).not.toBe(d2);
  });

  it("tone adds a tone class", () => {
    const { el } = mountButton({ seed: 1, tone: "neutral" });
    expect(el.classList.contains("chalkably-button--neutral")).toBe(true);
  });

  it("state option and setState drive data-state", () => {
    const { el, sketch } = mountButton({ seed: 1, state: "loading" });
    expect(el.dataset.state).toBe("loading");
    sketch.setState("error");
    expect(el.dataset.state).toBe("error");
    sketch.setState("success");
    expect(el.dataset.state).toBe("success");
    sketch.setState("idle");
    expect(el.dataset.state).toBeUndefined();
  });

  it("destroy clears data-state", () => {
    const { el, sketch } = mountButton({ seed: 1, state: "error" });
    sketch.destroy();
    expect(el.dataset.state).toBeUndefined();
  });

  it("destroy removes the svg, classes and listeners", () => {
    const { el, sketch } = mountButton({ seed: 1 });
    sketch.destroy();
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("chalkably-host")).toBe(false);
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("svg")).toBeNull();
  });
});

describe("chalkablyCard", () => {
  it("draws a single outline layer and ignores pointer events", () => {
    const el = document.createElement("div");
    document.body.append(el);
    chalkablyCard(el, { seed: 1 });
    expect(el.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).toBe(d1);
  });
});

import { chalkablyCheckbox, chalkablyDivider, chalkablyInput, chalkablyRadio, chalkablyToggle } from "../src/controls.js";

describe("chalkablyCheckbox", () => {
  function mountCheckbox(checked = false) {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: chalkablyCheckbox(wrap, { seed: 1 }) };
  }

  it("throws without an inner checkbox input", () => {
    const wrap = document.createElement("span");
    document.body.append(wrap);
    expect(() => chalkablyCheckbox(wrap)).toThrow();
  });

  it("draws box outline plus a pathLength-normalised check layer", () => {
    const { wrap } = mountCheckbox();
    expect(wrap.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
    const checks = wrap.querySelectorAll("path.chalkably-check");
    expect(checks).toHaveLength(3);
    for (const p of checks) expect(p.getAttribute("pathLength")).toBe("1");
  });

  it("mirrors checked state to data-checked", () => {
    const { wrap, input } = mountCheckbox();
    expect(wrap.hasAttribute("data-checked")).toBe(false);
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });

  it("reflects an initially checked input", () => {
    const { wrap } = mountCheckbox(true);
    expect(wrap.hasAttribute("data-checked")).toBe(true);
  });

  it("destroy detaches the change listener", () => {
    const { wrap, input, sketch } = mountCheckbox();
    sketch.destroy();
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });

  it("destroy removes a stale data-checked attribute", () => {
    const { wrap, sketch } = mountCheckbox(true);
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    sketch.destroy();
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("chalkablyRadio", () => {
  function mountRadio(name = "g") {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: chalkablyRadio(wrap, { seed: 1 }) };
  }

  it("throws without an inner radio input", () => {
    const wrap = document.createElement("span");
    document.body.append(wrap);
    expect(() => chalkablyRadio(wrap)).toThrow();
  });

  it("draws circle outline, dot and focus layers", () => {
    const { wrap } = mountRadio();
    expect(wrap.classList.contains("chalkably-radio")).toBe(true);
    expect(wrap.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.chalkably-dot")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.chalkably-focus")).toHaveLength(3);
  });

  it("syncs data-checked across a group via document change events", () => {
    const a = mountRadio();
    const b = mountRadio();
    a.input.checked = true;
    a.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(a.wrap.hasAttribute("data-checked")).toBe(true);
    b.input.checked = true;
    b.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(a.wrap.hasAttribute("data-checked")).toBe(false);
    expect(b.wrap.hasAttribute("data-checked")).toBe(true);
  });

  it("destroy detaches the document listener", () => {
    const { wrap, input, sketch } = mountRadio();
    sketch.destroy();
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("chalkablyToggle", () => {
  function mountToggle(checked = false) {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: chalkablyToggle(wrap, { seed: 1 }) };
  }

  it("draws pill outline, knob blob and focus layers", () => {
    const { wrap } = mountToggle();
    expect(wrap.classList.contains("chalkably-toggle")).toBe(true);
    expect(wrap.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.chalkably-knob.chalkably-blob")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.chalkably-focus")).toHaveLength(3);
  });

  it("mirrors checked state to data-checked", () => {
    const { wrap, input } = mountToggle();
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("chalkablyDivider", () => {
  it("draws a single line layer", () => {
    const el = document.createElement("hr");
    document.body.append(el);
    chalkablyDivider(el, { seed: 1 });
    expect(el.classList.contains("chalkably-divider")).toBe(true);
    expect(el.querySelectorAll("path.chalkably-boil.chalkably-outline")).toHaveLength(3);
  });
});

describe("chalkablyInput", () => {
  it("throws without an inner input and draws one outline layer with one", () => {
    const bare = document.createElement("span");
    document.body.append(bare);
    expect(() => chalkablyInput(bare)).toThrow();
    const wrap = document.createElement("span");
    wrap.append(document.createElement("input"));
    document.body.append(wrap);
    chalkablyInput(wrap, { seed: 1 });
    expect(wrap.classList.contains("chalkably-inputbox")).toBe(true);
    expect(wrap.querySelectorAll("path.chalkably-stroke.chalkably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.chalkably-focus")).toHaveLength(3);
  });
});
