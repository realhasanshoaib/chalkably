import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  ChalkablyButton,
  ChalkablyCard,
  ChalkablyCheckbox,
  ChalkablyDivider,
  ChalkablyInput,
  ChalkablyRadio,
  ChalkablyToggle,
} from "../src/react.js";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it("ChalkablyButton renders a button and attaches chrome on mount", () => {
  act(() => root.render(<ChalkablyButton seed={1}>Done</ChalkablyButton>));
  const button = host.querySelector("button");
  expect(button?.textContent).toBe("Done");
  expect(button?.querySelectorAll("path.chalkably-boil.chalkably-outline")).toHaveLength(3);
});

it("ChalkablyButton detaches on unmount", () => {
  act(() => root.render(<ChalkablyButton seed={1}>Done</ChalkablyButton>));
  act(() => root.render(<span />));
  expect(host.querySelector("svg")).toBeNull();
});

it("ChalkablyCheckbox wires the inner input", () => {
  act(() => root.render(<ChalkablyCheckbox seed={1} defaultChecked />));
  const wrap = host.querySelector("span.chalkably-checkbox");
  expect(wrap?.querySelector('input[type="checkbox"]')).toBeTruthy();
  expect(wrap?.hasAttribute("data-checked")).toBe(true);
});

it("mounts every Chalkably React wrapper with its native element", () => {
  act(() =>
    root.render(
      <>
        <ChalkablyCard seed={1}>Card</ChalkablyCard>
        <ChalkablyRadio seed={1} name="g" />
        <ChalkablyToggle seed={1} />
        <ChalkablyInput seed={1} aria-label="Name" />
        <ChalkablyDivider seed={1} />
      </>,
    ),
  );
  expect(host.querySelector("div.chalkably-card")?.textContent).toBe("Card");
  expect(host.querySelector("span.chalkably-radio input[type=radio]")).toBeTruthy();
  expect(host.querySelector("span.chalkably-toggle input[role=switch]")).toBeTruthy();
  expect(host.querySelector("span.chalkably-inputbox input[aria-label=Name]")).toBeTruthy();
  expect(host.querySelector("hr.chalkably-divider")).toBeTruthy();
});

it("ChalkablyButton reflects the state prop as data-state", () => {
  act(() => root.render(<ChalkablyButton seed={1} state="loading">Done</ChalkablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("loading");
  act(() => root.render(<ChalkablyButton seed={1} state="success">Done</ChalkablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("success");
  act(() => root.render(<ChalkablyButton seed={1}>Done</ChalkablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBeUndefined();
});

it("ChalkablyButton keeps its sketch across state changes", () => {
  act(() => root.render(<ChalkablyButton>Done</ChalkablyButton>));
  const d = host.querySelector("path")?.getAttribute("d");
  act(() => root.render(<ChalkablyButton state="loading">Done</ChalkablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("loading");
  expect(host.querySelector("path")?.getAttribute("d")).toBe(d);
});

it("ChalkablyButton survives a className change without losing its chalkably classes", () => {
  act(() => root.render(<ChalkablyButton seed={1} className="a">Done</ChalkablyButton>));
  act(() => root.render(<ChalkablyButton seed={1} className="b">Done</ChalkablyButton>));
  const button = host.querySelector("button");
  expect(button?.classList.contains("b")).toBe(true);
  expect(button?.classList.contains("chalkably-host")).toBe(true);
  expect(button?.classList.contains("chalkably-button")).toBe(true);
  expect(button?.querySelector("svg")).toBeTruthy();
});
