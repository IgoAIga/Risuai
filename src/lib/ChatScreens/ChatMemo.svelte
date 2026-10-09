<script lang="ts">
  import NotebookPen from "@lucide/svelte/icons/notebook-pen";
  import X from "@lucide/svelte/icons/x";
  import { language } from "src/lang";
  import type { Chat } from "src/ts/storage/database.svelte";

  let { chat }: { chat: Chat } = $props();
  let dialog: HTMLDialogElement;
  const id = $props.id();
</script>

<button
  type="button"
  class="flex shrink-0 items-center gap-1.5 rounded-md border border-darkborderc bg-bgcolor/90 px-2 py-1 text-xs text-textcolor2 hover:bg-selected hover:text-textcolor focus-visible:outline-2 focus-visible:outline-textcolor"
  aria-haspopup="dialog"
  onclick={() => dialog.showModal()}
>
  <NotebookPen size={14} aria-hidden="true" />
  {language.chatMemoTitle}
  {#if chat.personalMemo?.trim()}
    <span
      class="h-1.5 w-1.5 rounded-full bg-textcolor"
      aria-label={language.chatMemoHasContent}
    ></span>
  {/if}
</button>

<dialog
  bind:this={dialog}
  aria-labelledby={`${id}-title`}
  aria-describedby={`${id}-hint`}
  class="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] rounded-xl border border-darkborderc bg-bgcolor p-0 text-textcolor shadow-xl backdrop:bg-black/60"
>
  <div
    class="flex items-start justify-between gap-3 border-b border-darkborderc p-4"
  >
    <div class="min-w-0">
      <h2 id={`${id}-title`} class="m-0 text-base font-semibold">
        {language.chatMemoTitle}
      </h2>
      <p class="m-0 mt-1 truncate text-sm text-textcolor2">{chat.name}</p>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-md p-1 hover:bg-selected"
      aria-label={language.chatMemoClose}
      onclick={() => dialog.close()}
    >
      <X size={20} aria-hidden="true" />
    </button>
  </div>
  <div class="p-4">
    <p id={`${id}-hint`} class="m-0 mb-3 text-sm text-textcolor2">
      {language.chatMemoHint}
    </p>
    <textarea
      aria-label={language.chatMemoTitle}
      placeholder={language.chatMemoPlaceholder}
      value={chat.personalMemo ?? ""}
      oninput={(event) => {
        chat.personalMemo = event.currentTarget.value;
      }}
      class="block h-[45dvh] min-h-40 max-h-[55dvh] w-full resize-y rounded-md border border-darkborderc bg-darkbg p-3 text-base leading-relaxed text-textcolor placeholder:text-textcolor2 focus:outline-2 focus:outline-borderc"
    ></textarea>
    <div class="mt-3 flex justify-end">
      <button
        type="button"
        class="rounded-md border border-darkborderc bg-darkbutton px-4 py-2 text-sm hover:bg-selected"
        onclick={() => dialog.close()}>{language.chatMemoClose}</button
      >
    </div>
  </div>
</dialog>
