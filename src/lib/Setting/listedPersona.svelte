<script lang="ts">
    import { XIcon } from "@lucide/svelte";
    import { language } from "../../lang";
    
    import { DBState, selectedCharID } from 'src/ts/stores.svelte';
    import { selectPersonaForCurrentChat } from "src/ts/persona";


    interface Props {
        close?: any;
    }

    let { close = () => {} }: Props = $props();

    let chat = $derived(DBState.db.characters[$selectedCharID]?.chats[DBState.db.characters[$selectedCharID]?.chatPage]);
    let activeId = $derived(chat?.bindedPersona || DBState.db.personas[DBState.db.selectedPersona]?.id);

</script>

<div class="absolute w-full h-full z-40 bg-black/50 flex justify-center items-center">
    <div class="bg-darkbg p-4 break-any rounded-md flex flex-col max-w-3xl w-96 max-h-full overflow-y-auto">
        <div class="flex items-center text-textcolor mb-4">
            <h2 class="mt-0 mb-0 font-bold">{language.persona}</h2>
            <div class="grow flex justify-end">
                <button class="text-textcolor2 hover:text-green-500 mr-2 cursor-pointer items-center" onclick={close}>
                    <XIcon size={24}/>
                </button>
            </div>
        </div>
        {#if chat}
            <p class="text-xs text-textcolor2 mb-3">{language.chatPersonaSelectionHint}</p>
        {/if}
        {#each DBState.db.personas as persona, i}
            <button onclick={() => {
                selectPersonaForCurrentChat(i)
                close()
            }} class="flex items-center text-textcolor border-t-1 border-solid border-0 border-darkborderc p-2 cursor-pointer" class:bg-selected={persona.id ? persona.id === activeId : !activeId && i === DBState.db.selectedPersona}>
                <span class="overflow-x-auto whitespace-nowrap w-full text-left">
                    <span class="font-medium">{persona.name}</span>
                    {#if persona.note}
                        <span class="opacity-75"> / {persona.note}</span>
                    {/if}
                </span>
            </button>
        {/each}
    </div>
</div>

<style>
    .break-any{
        word-break: normal;
        overflow-wrap: anywhere;
    }
</style>
