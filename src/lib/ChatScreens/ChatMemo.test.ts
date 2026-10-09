import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import ChatMemo from "./ChatMemo.svelte";
import type { Chat } from "src/ts/storage/database.svelte";

vi.mock("src/lang", () => ({
  language: {
    chatMemoTitle: "Notes",
    chatMemoHasContent: "Has notes",
    chatMemoHint: "Saved with this chat",
    chatMemoPlaceholder: "Write notes",
    chatMemoClose: "Close",
  },
}));

const chat = (name: string): Chat => ({
  name,
  message: [],
  note: "AI note",
  localLore: [],
});
let instance: ReturnType<typeof mount> | undefined;
function show(value: Chat) {
  instance = mount(ChatMemo, { target: document.body, props: { chat: value } });
  flushSync();
}
async function hide() {
  if (instance) await unmount(instance);
  instance = undefined;
  document.body.innerHTML = "";
}
afterEach(hide);

describe("per-chat personal notes", () => {
  it("opens and closes the dialog without clearing notes", () => {
    const a = { ...chat("A"), personalMemo: "Keep this" };
    show(a);
    document
      .querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!
      .click();
    const dialog = document.querySelector("dialog")!;
    expect(dialog.open).toBe(true);
    dialog
      .querySelector<HTMLButtonElement>('button[aria-label="Close"]')!
      .click();
    expect(dialog.open).toBe(false);
    expect(a.personalMemo).toBe("Keep this");
  });

  it("updates the chat immediately without modifying messages or the AI note", () => {
    const a = chat("A");
    show(a);
    const input = document.querySelector("textarea")!;
    input.value = "Remember the north gate\nMeet the guide tomorrow";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toBe(input.value);
    expect(a.note).toBe("AI note");
    expect(a.message).toEqual([]);
  });

  it("keeps separate chats isolated and restores notes after serialization and reopening", async () => {
    const a = chat("A"),
      b = chat("B");
    show(a);
    const input = document.querySelector("textarea")!;
    input.value = "A only";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await hide();
    show(b);
    expect(document.querySelector("textarea")!.value).toBe("");
    await hide();
    show(JSON.parse(JSON.stringify(a)));
    expect(document.querySelector("textarea")!.value).toBe("A only");
    expect(b.personalMemo).toBeUndefined();
  });

  it("treats notes as plain text and lets users clear them", () => {
    const a = { ...chat("A"), personalMemo: '<img src=x onerror="alert(1)">' };
    show(a);
    expect(document.querySelector("img")).toBeNull();
    const input = document.querySelector("textarea")!;
    expect(input.value).toBe(a.personalMemo);
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toBe("");
  });
});
