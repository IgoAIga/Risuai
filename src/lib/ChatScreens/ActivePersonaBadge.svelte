<script lang="ts">
  import { LockKeyhole, UserRound } from "@lucide/svelte";
  import { language } from "src/lang";
  import { openPersonaList } from "src/ts/stores.svelte";

  let { name, bound = false }: { name: string; bound?: boolean } = $props();
</script>

<div class="flex min-w-0 justify-end">
  <button
    type="button"
    class="flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-darkborderc bg-bgcolor/90 px-2 py-1 text-xs text-textcolor2 hover:bg-selected hover:text-textcolor focus-visible:outline-2 focus-visible:outline-textcolor"
    title={`${language.persona}: ${name}${bound ? ` · ${language.bindPersona}` : ""}`}
    aria-label={`${language.persona}: ${name}${bound ? ` · ${language.bindPersona}` : ""}`}
    onclick={() => openPersonaList.set(true)}
  >
    <UserRound size={14} class="shrink-0" aria-hidden="true" />
    <span class="shrink-0">{language.persona}</span>
    <span class="truncate font-medium text-textcolor">{name}</span>
    {#if bound}
      <LockKeyhole size={12} class="shrink-0" aria-hidden="true" />
    {/if}
  </button>
</div>
