import { expect, it } from "vitest";
import * as chalkably from "../src/index.js";

it("exports the public surface", () => {
  for (const name of [
    "chalkablyButton",
    "chalkablyCheckbox",
    "chalkablyInput",
    "chalkablyCard",
    "chalkablyRadio",
    "chalkablyToggle",
    "chalkablyDivider",
    "roughLine",
    "roughRoundedRect",
    "roughCheckmark",
    "scribbleFill",
    "variants",
    "mulberry32",
    "randomSeed",
  ])
    expect(chalkably, name).toHaveProperty(name);
});
