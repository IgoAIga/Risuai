import { describe, expect, it } from "vitest";
import {
  addPersonaImage,
  getPersonaExportImage,
  getPersonaImages,
  removePersonaImage,
  selectPersonaImage,
} from "./personaImages";
import type { RisuPersona } from "./storage/database.svelte";

const makePersona = (): RisuPersona => ({
  name: "Test",
  personaPrompt: "Test",
  icon: "assets/first.png",
  id: "stable-id",
});

describe("persona image library", () => {
  it("keeps the original image when adding and survives save/reload", () => {
    const persona = makePersona();
    addPersonaImage(persona, "assets/second.png");
    const restored = JSON.parse(JSON.stringify(persona));
    expect(getPersonaImages(restored)).toEqual([
      "assets/first.png",
      "assets/second.png",
    ]);
    expect(restored.icon).toBe("assets/second.png");
    expect(restored.id).toBe("stable-id");
    selectPersonaImage(restored, "assets/first.png");
    expect(restored.icon).toBe("assets/first.png");
    expect(getPersonaImages(restored)).toHaveLength(2);
  });
  it("does not duplicate uploads or modify another persona", () => {
    const a = makePersona(),
      b = makePersona();
    addPersonaImage(a, a.icon);
    addPersonaImage(a, "assets/second.png");
    addPersonaImage(a, "assets/second.png");
    expect(getPersonaImages(a)).toHaveLength(2);
    expect(getPersonaImages(b)).toEqual(["assets/first.png"]);
  });
  it("exports an alternate image without switching the active image", () => {
    const persona = makePersona();
    addPersonaImage(persona, "assets/second.png");
    expect(getPersonaExportImage(persona, "assets/first.png")).toBe(
      "assets/first.png",
    );
    expect(getPersonaExportImage(persona)).toBe("assets/second.png");
    expect(persona.icon).toBe("assets/second.png");
    expect(() => getPersonaExportImage(persona, "unknown")).toThrow();
    expect(selectPersonaImage(persona, "unknown")).toBe(false);
  });
  it("selects a remaining image when removing the active one", () => {
    const persona = makePersona();
    addPersonaImage(persona, "assets/second.png");
    removePersonaImage(persona, "assets/second.png");
    expect(persona.icon).toBe("assets/first.png");
    removePersonaImage(persona, persona.icon);
    expect(persona.icon).toBe("");
    expect(getPersonaImages(persona)).toEqual([]);
  });
});
