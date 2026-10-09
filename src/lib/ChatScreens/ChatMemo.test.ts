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
    chatMemoCharacters: "characters",
    chatMemoLimitHint: "Includes spaces and line breaks",
    chatMemoLimitRejected: "Too long; existing notes kept",
    chatMemoLegacyLimit: "Existing oversized notes preserved",
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
  function paste(input: HTMLTextAreaElement, text: string) {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => text },
    });
    input.dispatchEvent(event);
    flushSync();
    return event;
  }

  it("accepts exactly 10,000 characters including spaces and newlines and rejects overflow", () => {
    const a = chat("A");
    show(a);
    const input = document.querySelector("textarea")!;
    expect(input.maxLength).toBe(10_000);
    input.value = "가".repeat(9_998) + " \n";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toHaveLength(10_000);
    input.value += "나";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(a.personalMemo).toHaveLength(10_000);
    expect(input.value).toBe(a.personalMemo);
    expect(document.querySelector('[role="status"]')!.textContent).toContain(
      "Too long",
    );
  });

  it("rejects an oversized paste before insertion without truncating or replacing existing notes", () => {
    const a = { ...chat("A"), personalMemo: "Keep this" };
    show(a);
    const input = document.querySelector("textarea")!;
    input.setSelectionRange(0, input.value.length);
    expect(paste(input, "x".repeat(1_000_000)).defaultPrevented).toBe(true);
    expect(input.value).toBe("Keep this");
    expect(a.personalMemo).toBe("Keep this");
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(9);
  });

  it("counts the selected replacement and normalized Windows newlines for paste", () => {
    const a = { ...chat("A"), personalMemo: "x".repeat(10_000) };
    show(a);
    const input = document.querySelector("textarea")!;
    input.setSelectionRange(0, 2);
    expect(paste(input, "가\r\n").defaultPrevented).toBe(false);
    expect(paste(input, "가나다").defaultPrevented).toBe(true);
  });

  it("preserves legacy oversized notes and permits gradual shortening, not growth", () => {
    const a = { ...chat("A"), personalMemo: "x".repeat(12_000) };
    show(a);
    const input = document.querySelector("textarea")!;
    expect(input.value).toHaveLength(12_000);
    expect(document.querySelector('[role="status"]')!.textContent).toContain(
      "preserved",
    );
    expect(document.querySelector('[id$="-limit"]')!.textContent).toContain(
      "12,000 / 10,000",
    );
    input.value = "x".repeat(11_000);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toHaveLength(11_000);
    input.value += "x";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toHaveLength(11_000);
    expect(input.value).toHaveLength(11_000);
    input.value = "Reduced";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.personalMemo).toBe("Reduced");
  });

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
