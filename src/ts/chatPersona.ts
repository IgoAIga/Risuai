import { v4 } from "uuid";
import type { Chat, RisuPersona } from "./storage/database.svelte";

export function setChatPersona(chat: Chat, persona: RisuPersona) {
  persona.id ||= v4();
  chat.bindedPersona = persona.id;
}

export function rememberChatPersona(
  chat: Chat,
  persona: RisuPersona | undefined,
) {
  // An empty string is an explicit request to follow the global persona.
  // Preserve both that choice and existing bindings (including missing IDs).
  if (
    !persona ||
    (chat.bindedPersona !== undefined && chat.bindedPersona !== null)
  )
    return;
  setChatPersona(chat, persona);
}
