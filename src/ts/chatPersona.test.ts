import { describe, expect, it } from "vitest";
import { rememberChatPersona, setChatPersona } from "./chatPersona";
import type { Chat, RisuPersona } from "./storage/database.svelte";

const makeChat = (): Chat => ({
  message: [],
  name: "Test",
  note: "",
  localLore: [],
});
const makePersona = (name: string): RisuPersona => ({
  name,
  icon: "",
  personaPrompt: "",
});

describe("chat persona persistence", () => {
  it("remembers the initial choice across switches and save/reload", () => {
    const a = makeChat(),
      b = makeChat();
    const alice = makePersona("Alice"),
      bob = makePersona("Bob");
    rememberChatPersona(a, alice);
    rememberChatPersona(b, alice);
    setChatPersona(b, bob);
    rememberChatPersona(a, bob);
    const restored = JSON.parse(JSON.stringify([a, b])) as Chat[];
    rememberChatPersona(restored[0], bob);
    expect(restored[0].bindedPersona).toBe(alice.id);
    expect(restored[1].bindedPersona).toBe(bob.id);
    expect(alice.id).not.toBe(bob.id);
  });

  it("allows replacing a pinned persona in just the selected chat", () => {
    const a = makeChat(),
      b = makeChat();
    const original = makePersona("Original"),
      replacement = makePersona("Replacement");
    rememberChatPersona(a, original);
    rememberChatPersona(b, original);
    setChatPersona(a, replacement);
    expect(a.bindedPersona).toBe(replacement.id);
    expect(b.bindedPersona).toBe(original.id);
  });

  it("keeps an explicit global-follow choice until the user selects a persona", () => {
    const chat = { ...makeChat(), bindedPersona: "" };
    const persona = makePersona("Default");
    rememberChatPersona(chat, persona);
    expect(chat.bindedPersona).toBe("");
    setChatPersona(chat, persona);
    expect(chat.bindedPersona).toBeTruthy();
  });

  it("does not overwrite an existing or missing-persona binding", () => {
    const chat = { ...makeChat(), bindedPersona: "imported-persona-id" };
    rememberChatPersona(chat, makePersona("Default"));
    expect(chat.bindedPersona).toBe("imported-persona-id");
  });

  it("handles missing defaults and gives legacy personas stable IDs", () => {
    const chat = makeChat(),
      next = makeChat();
    rememberChatPersona(chat, undefined);
    expect(chat.bindedPersona).toBeUndefined();
    const persona = makePersona("Legacy");
    rememberChatPersona(chat, persona);
    rememberChatPersona(next, persona);
    expect(chat.bindedPersona).toBeTruthy();
    expect(next.bindedPersona).toBe(chat.bindedPersona);
  });
});
