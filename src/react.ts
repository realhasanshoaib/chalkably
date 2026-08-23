import {
  type ComponentProps,
  createElement,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import {
  type ChalkablyButtonSketch,
  type ChalkablyButtonOptions,
  type ChalkablyOptions,
  chalkablyButton,
  chalkablyCard,
  chalkablyCheckbox,
  chalkablyDivider,
  chalkablyInput,
  chalkablyRadio,
  chalkablyToggle,
  type SketchHandle,
} from "./controls.js";

function useSketch<T extends HTMLElement>(
  attach: (el: T) => SketchHandle,
  deps: readonly unknown[],
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const sketch = attach(ref.current);
    return () => sketch.destroy();
  }, deps);
  return ref;
}

type ButtonProps = ChalkablyButtonOptions & ComponentProps<"button">;

export function ChalkablyButton({ seed, roughness, boil, stroke, fill, paper, width, variant, state, tone, className, children, ...rest }: ButtonProps): ReactElement {
  const sketchRef = useRef<ChalkablyButtonSketch | null>(null);
  const ref = useSketch<HTMLButtonElement>(
    (el) => (sketchRef.current = chalkablyButton(el, { seed, roughness, boil, stroke, fill, paper, width, variant, state, tone })),
    [seed, roughness, boil, stroke, fill, paper, width, variant, tone, className],
  );
  useEffect(() => {
    sketchRef.current?.setState(state ?? "idle");
  }, [state]);
  return createElement("button", { type: "button", ...rest, className, ref }, children);
}

type CheckboxProps = ChalkablyOptions & ComponentProps<"input">;

export function ChalkablyCheckbox({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: CheckboxProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => chalkablyCheckbox(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "checkbox" }));
}

type InputProps = ChalkablyOptions & ComponentProps<"input">;

export function ChalkablyInput({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: InputProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => chalkablyInput(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", rest));
}

export function ChalkablyRadio({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: InputProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => chalkablyRadio(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "radio" }));
}

export function ChalkablyToggle({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: CheckboxProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => chalkablyToggle(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "checkbox", role: "switch" }));
}

type DividerProps = ChalkablyOptions & ComponentProps<"hr">;

export function ChalkablyDivider({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: DividerProps): ReactElement {
  const ref = useSketch<HTMLHRElement>(
    (el) => chalkablyDivider(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("hr", { ...rest, className, ref });
}

type CardProps = ChalkablyOptions & ComponentProps<"div">;

export function ChalkablyCard({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: CardProps): ReactElement {
  const ref = useSketch<HTMLDivElement>(
    (el) => chalkablyCard(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("div", { ...rest, className, ref }, children);
}
