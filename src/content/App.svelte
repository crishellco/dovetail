<script>
	import { onMount } from 'svelte';

  export let templates = [];
  export const port = chrome.runtime.connect({ name: "template-api" });
  export function postMessage(message) {
    port.postMessage(message);
  }

  let textarea;
  let isDirty = false;
  let open = false;
  let selection = null;

  $: templates, handleStateChange();

  onMount(() => {
    textarea = document.querySelector("#pull_request_body");

    if (textarea) {
      handleStateChange();

      textarea.addEventListener("keyup", () => {
        handleStateChange();
      });
    }
  });

  function handleStateChange() {
    if(!textarea) {
      return;
    }

    selection = null;

    let dirty = true;
    const value = String(textarea.value).trim();

    for (let i in templates) {
      if (value === String(templates[i].content).trim()) {
        selection = templates[i]
        dirty = false;
      }
    }

    isDirty = dirty && value !== "";
  }

  function select(template) {
    if (!isDirty) {
      document.querySelector("#pull_request_body").value = template.content;
      handleStateChange()
    }

    open = false;
  }
</script>

<style>
  .menu {
    top: 20px;
  }
</style>
{#if !isDirty && templates.length}
<div class="flex flex-column w-full relative border-b mt-2">
  <div
    class="text-bold discussion-sidebar-heading discussion-sidebar-toggle
    hx_rsm-trigger flex flex-row items-between"
    on:click={() => (open = !open)}>
    <div class="flex-1">Template</div>
    <svg
      class="octicon octicon-gear"
      viewBox="0 0 14 16"
      version="1.1"
      width="14"
      height="16"
      aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M14
        8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63
        1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45
        1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45
        1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66
        0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  </div>
  <div class="pb-2 text-xs font-semibold text-gray-900">
    {selection ? selection.name : ''}
  </div>
  {#if open}
    <ul class="menu right-0 left-0 flex flex-col absolute bg-white z-50">
    <li class="bg-gray-100 py-1 px-2 border-b border-gray-300 text-xs font-semibold">Select a template</li>
      {#each templates as template}
        <li
          class="hover:bg-blue-600 hover:text-white py-1 px-2 cursor-pointer truncate text-xs font-semibold"
          class:bg-blue-600={template.name === (selection || {}).name}
          class:text-white={template.name === (selection || {}).name}
          on:click={() => select(template)}>
          {template.name}
        </li>
      {/each}
    </ul>
  {/if}
</div>
{/if}
