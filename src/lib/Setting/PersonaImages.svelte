<script lang="ts">
  import { language } from "src/lang";
  import { alertConfirm } from "src/ts/alert";
  import { getCharImage } from "src/ts/characters";
  import { getPersonaImages } from "src/ts/personaImages";
  import type { RisuPersona } from "src/ts/storage/database.svelte";

  let {
    persona,
    onadd,
    onselect,
    onexport,
    onremove,
  }: {
    persona: RisuPersona;
    onadd: () => void;
    onselect: (image: string) => void;
    onexport: (image: string) => void;
    onremove: (image: string) => void;
  } = $props();
  let images = $derived(getPersonaImages(persona));
</script>

<section
  class="mt-4 min-w-0 rounded-md border border-darkborderc p-3"
  aria-label={language.personaImagesTitle}
>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h3 class="m-0 text-sm font-semibold">{language.personaImagesTitle}</h3>
    <button
      type="button"
      class="rounded-md border border-darkborderc bg-darkbutton px-3 py-1.5 text-sm hover:bg-selected"
      onclick={onadd}>{language.personaImagesAdd}</button
    >
  </div>
  <p class="my-2 text-xs text-textcolor2">{language.personaImagesHint}</p>
  <div class="flex flex-wrap gap-3">
    {#each images as image, i (image)}
      <div class="w-32 rounded-md border border-darkborderc p-2">
        <button
          type="button"
          class="block w-full rounded-md focus-visible:outline-2 focus-visible:outline-textcolor"
          aria-pressed={persona.icon === image}
          aria-label={`${language.personaImagesUse} ${i + 1}`}
          onclick={() => onselect(image)}
        >
          {#await getCharImage(image, "plain")}
            <div class="h-24 w-full rounded bg-darkbg"></div>
          {:then src}
            <img
              {src}
              alt={`${language.personaImagesTitle} ${i + 1}`}
              class="h-24 w-full rounded bg-darkbg object-contain"
            />
          {/await}
          <span
            class="mt-1 block rounded py-1 text-xs"
            class:bg-selected={persona.icon === image}
          >
            {persona.icon === image
              ? `✓ ${language.personaImagesActive}`
              : language.personaImagesUse}
          </span>
        </button>
        <button
          type="button"
          class="mt-2 w-full rounded border border-darkborderc px-1 py-1.5 text-xs hover:bg-selected"
          onclick={() => onexport(image)}>{language.personaImagesExport}</button
        >
        <button
          type="button"
          class="mt-1 w-full rounded py-1 text-xs text-textcolor2 hover:bg-selected"
          onclick={async () => {
            const target = persona;
            if (
              (await alertConfirm(language.personaImagesRemoveConfirm)) &&
              target === persona
            )
              onremove(image);
          }}>{language.remove}</button
        >
      </div>
    {/each}
  </div>
</section>
