# Chalkably agent guide

Chalkably is a zero-runtime-dependency UI library. It keeps real HTML controls
in the DOM and draws warm chalk SVG chrome underneath them. The host owns the
surface; the default stroke is transparent warm-white chalk.

The package is `chalkably` and the stylesheet is `chalkably/style.css`.

## Vanilla

```js
import {
  chalkablyButton,
  chalkablyCard,
  chalkablyCheckbox,
  chalkablyRadio,
  chalkablyToggle,
  chalkablyDivider,
  chalkablyInput,
} from "chalkably";
import "chalkably/style.css";

chalkablyButton(document.querySelector("#done"), { variant: "solid" });
chalkablyCard(document.querySelector("#card"));
chalkablyCheckbox(document.querySelector("#check")); // wrapper contains an input
chalkablyRadio(document.querySelector("#radio"));   // wrapper contains an input
chalkablyToggle(document.querySelector("#toggle")); // wrapper contains an input
chalkablyDivider(document.querySelector("#rule"));
chalkablyInput(document.querySelector("#name"));    // wrapper contains an input
```

Each attacher throws when its required element is missing and returns a sketch
with `{ resketch(seed?), destroy() }`. Buttons also expose
`setState("idle" | "loading" | "error" | "success")`.

## React

React is an optional peer dependency. The React subpath is client-only:

```jsx
import {
  ChalkablyButton,
  ChalkablyCard,
  ChalkablyCheckbox,
  ChalkablyRadio,
  ChalkablyToggle,
  ChalkablyDivider,
  ChalkablyInput,
} from "chalkably/react";
import "chalkably/style.css";

<ChalkablyButton variant="solid" state="idle">Done</ChalkablyButton>
<ChalkablyButton tone="neutral">Cancel</ChalkablyButton>
<ChalkablyButton tone="danger">Delete</ChalkablyButton>
<ChalkablyCheckbox defaultChecked />
<ChalkablyRadio name="choice" defaultChecked />
<ChalkablyToggle />
<ChalkablyInput placeholder="Your name" />
<ChalkablyDivider />
<ChalkablyCard>Content</ChalkablyCard>
```

Native props pass through. Drawing options are top-level props: `seed`,
`roughness`, `boil`, `stroke`, `fill`, `paper`, and `width`; buttons also take
`variant`, `state`, and `tone`.

## Rules

- Attach to a real button, control wrapper, input wrapper, `<hr>`, or block.
- Import `chalkably/style.css` once. Theme with `--chalkably-*` custom properties;
  do not restyle generated SVG paths.
- Keep labels and native inputs present for keyboard and assistive technology.
- Respect `prefers-reduced-motion`; Chalkably already freezes boil and skips
  hover re-sketching in that mode.
- Vanilla and React are supported. There are no Vue or Svelte adapters.

The geometry exports (`roughRoundedRect`, `roughCircle`, `roughLine`,
`roughCheckmark`, `scribbleFill`, `variants`, `mulberry32`, `randomSeed`) are
stable and may be used for custom shapes.
