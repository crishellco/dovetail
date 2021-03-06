<script>
  import { onDestroy, onMount } from 'svelte'

  export let repo = {}
  export let createTemplateUrl = ''
  export let templates = []
  export function postMessage(message) {
    chrome.runtime.sendMessage(message)
  }

  const textarea = document.querySelector('#pull_request_body')
  let value = textarea ? String(textarea.value).trim() : ''
  let open = false
  let selection = null

  $: isDirty =
    templates.reduce((clean, template) => {
      if (value === String(template.content).trim()) {
        selection = template
        return false
      }
      return clean
    }, true) && value !== ''

  $: {
    createTemplateUrl = repo
      ? `/${repo.owner}/${repo.repo}/new/${repo.branch}/.github/PULL_REQUEST_TEMPLATE.md`
      : ''
  }

  function handleWindowClick() {
    open = false
  }

  function handleTextareaChange(e) {
    value = String(e.target.value).trim()
  }

  onDestroy(() => {
    window.removeEventListener('click', handleWindowClick)
    if (textarea) {
      textarea.removeEventListener('keyup', handleTextareaChange)
      textarea.removeEventListener('change', handleTextareaChange)
    }
  })

  onMount(() => {
    window.addEventListener('click', handleWindowClick)
    if (textarea) {
      textarea.addEventListener('keyup', handleTextareaChange)
      textarea.addEventListener('change', handleTextareaChange)
    }
  })

  function toggleOpen() {
    if (!open) {
      open = true
      postMessage({
        type: 'ready',
        data: window.location.href,
        fetchTemplates: true,
      })
    } else {
      open = !open
    }
  }

  function select(template) {
    if (!isDirty) {
      if (selection && template.name === selection.name) {
        selection = null
        textarea.value = ''
      } else {
        selection = template
        textarea.value = template.content
      }
    }
    open = false
  }
</script>

<style>
  .menu {
    top: 20px;
  }
</style>

{#if isDirty}
  <div
    id="template-picker"
    class="flex flex-column w-full relative border-b mt-2 pb-3">
    <div
      class="text-bold discussion-sidebar-heading discussion-sidebar-toggle
      hx_rsm-trigger flex flex-row items-between">
      <div class="flex-1">Template</div>
    </div>
    <div class="text-xs text-gray-700">
      Template cannot be changed once body has been edited
    </div>
  </div>
{:else}
  <div
    id="template-picker"
    class="flex flex-column w-full relative border-b mt-2 pb-3">
    <div
      class="text-bold discussion-sidebar-heading discussion-sidebar-toggle
      hx_rsm-trigger flex flex-row items-between"
      on:click|stopPropagation={() => toggleOpen()}>
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
          1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0
          7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69
          1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14
          8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    </div>
    {#if selection}
      <div
        class="px-1 p-px text-xs font-semibold text-white truncate rounded-sm
        bg-blue-600">
        {selection.name}
      </div>
    {:else}
      <div class="text-xs truncate text-gray-700">None chosen</div>
    {/if}
    {#if open}
      <ul class="menu right-0 left-0 flex flex-col absolute bg-white z-50">
        <li
          class="bg-gray-100 py-1 px-2 border-b border-gray-300 text-xs
          font-semibold">
          Select a template
        </li>
        {#each templates as template}
          <li
            class="hover:bg-blue-600 hover:text-white py-2 pl-4 pr-2
            cursor-pointer truncate text-xs font-semibold"
            class:bg-blue-600={template.name === (selection || {}).name}
            class:text-white={template.name === (selection || {}).name}
            on:click|stopPropagation={() => select(template)}>
            {template.name}
          </li>
        {/each}
        {#if !templates.length}
          <li class="py-2 text-center text-xs">
            <a
              href={createTemplateUrl}
              class="text-blue-500 hover:underline text-xs">
              Create a Pull Request Template
            </a>
          </li>
        {/if}
      </ul>
    {/if}
  </div>
{/if}
