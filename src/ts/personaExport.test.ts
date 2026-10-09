import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    selectedPersona: 0,
    userIcon: "assets/active.png",
    username: "Test",
    personaPrompt: "Description",
    userNote: "Note",
    personas: [
      {
        name: "Test",
        personaPrompt: "Description",
        icon: "assets/active.png",
        profileImages: ["assets/active.png", "assets/alternate.png"],
      },
    ],
  },
  readImage: vi.fn(async () => new Uint8Array([1, 2])),
  write: vi.fn(async () => new Uint8Array([3, 4])),
  download: vi.fn(),
}));
vi.mock("./storage/database.svelte", () => ({
  getDatabase: () => structuredClone(mocks.db),
}));
vi.mock("./stores.svelte", () => ({ DBState: { db: mocks.db } }));
vi.mock("./util", () => ({ sleep: async () => {} }));
vi.mock("./alert", () => ({
  alertNormal: vi.fn(),
  alertError: vi.fn(),
  alertStore: { set: vi.fn() },
}));
vi.mock("./globalApi.svelte", () => ({
  readImage: mocks.readImage,
  downloadFile: mocks.download,
}));
vi.mock("src/lang", () => ({ language: { successExport: "Done" } }));
vi.mock("./process/files/inlays", () => ({
  reencodeImage: async (image: Uint8Array) => image,
}));
vi.mock("./pngChunk", () => ({ PngChunk: { write: mocks.write } }));
import { exportUserPersona } from "./persona";

beforeEach(() => vi.clearAllMocks());
describe("persona PNG export", () => {
  it("uses the requested cover and keeps current persona data without switching images", async () => {
    await exportUserPersona("assets/alternate.png");
    expect(mocks.readImage).toHaveBeenCalledWith("assets/alternate.png");
    const metadata = mocks.write.mock.calls[0] as unknown as [
      Uint8Array,
      { persona: string },
    ];
    expect(
      JSON.parse(Buffer.from(metadata[1].persona, "base64").toString()),
    ).toEqual({ name: "Test", personaPrompt: "Description", note: "Note" });
    expect(mocks.download).toHaveBeenCalledWith(
      "Test_export.png",
      new Uint8Array([3, 4]),
    );
    expect(mocks.db.userIcon).toBe("assets/active.png");
    expect(mocks.db.personas[0].icon).toBe("assets/active.png");
  });
  it("keeps the standard export button using the active image", async () => {
    await exportUserPersona();
    expect(mocks.readImage).toHaveBeenCalledWith("assets/active.png");
  });
});
