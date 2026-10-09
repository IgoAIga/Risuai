import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import PersonaImages from "./PersonaImages.svelte";

vi.mock("src/lang", () => ({
  language: {
    personaImagesTitle: "Images",
    personaImagesAdd: "Add image",
    personaImagesHint: "Choose a profile image",
    personaImagesUse: "Use image",
    personaImagesActive: "In use",
    personaImagesExport: "Export this image",
    remove: "Remove",
  },
}));
vi.mock("src/ts/alert", () => ({ alertConfirm: async () => true }));
vi.mock("src/ts/characters", () => ({
  getCharImage: async () => "data:image/png;base64,",
}));
let instance: ReturnType<typeof mount>;
afterEach(async () => {
  if (instance) await unmount(instance);
  document.body.innerHTML = "";
});

it("offers both images and exports an alternate without selecting it", () => {
  const onadd = vi.fn(),
    onselect = vi.fn(),
    onexport = vi.fn();
  instance = mount(PersonaImages, {
    target: document.body,
    props: {
      persona: {
        name: "Test",
        personaPrompt: "Test",
        icon: "first",
        profileImages: ["first", "second"],
      },
      onadd,
      onselect,
      onexport,
      onremove: vi.fn(),
    },
  });
  flushSync();
  const choices = document.querySelectorAll<HTMLButtonElement>(
    "button[aria-pressed]",
  );
  expect(choices).toHaveLength(2);
  expect(choices[0].getAttribute("aria-pressed")).toBe("true");
  const exports = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].filter((button) => button.textContent === "Export this image");
  exports[1].click();
  expect(onexport).toHaveBeenCalledWith("second");
  expect(onselect).not.toHaveBeenCalled();
  choices[1].click();
  expect(onselect).toHaveBeenCalledWith("second");
  document.querySelector<HTMLButtonElement>("button")!.click();
  expect(onadd).toHaveBeenCalledOnce();
});
