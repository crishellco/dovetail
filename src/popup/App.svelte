<script>
  let isTestingToken = false;
  let currentToken = "";
  let newToken = "";

  export const port = chrome.runtime.connect({ name: 'template-api' });

  port.onMessage.addListener(({ type, data }) => {
    switch(type) {
      case 'token':
        currentToken = data;
        break;
      case 'token_valid':
        isTestingToken = false;
        break;
      case 'token_invalid':
        isTestingToken = false;
        currentToken = data;
        break;
    }
  });

  export function postMessage(message) {
    port.postMessage(message);
  }

  function handleAddTokenClick() {
    /**
     * Send token to background to be stored
     * Test connection using /user/repos (update UI to show "connecting")
     * If fail, show error and form
     * If pass, update UI to show connected (and maybe link to remove/re-enter token)
     */
    isTestingToken = true;
    postMessage({ type: 'set_token', data: newToken });
  }
</script>

<div class="p-4 flex flex-col" style="width: 30rem">
  {#if isTestingToken}
  <div class="flex text-green-600 font-semibold font-mono text-center">
    Connecting...
  </div>
  {:else}
  <div class="flex">
    <div class="flex-1">
      {currentToken}
      <input
        bind:value={newToken}
        class="bg-gray-200 appearance-none border-2 border-gray-300 border-r-0
        rounded-l w-full py-2 px-4 text-gray-700 leading-tight
        focus:outline-none focus:border-blue-500"
        id="inline-full-name"
        type="text"
        placeholder="Personal Auth Token w/repo access" />
    </div>
    <button
      on:click|preventDefault={handleAddTokenClick}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4
      rounded-r">
      Save
    </button>
  </div>
  <div class="text-xs mt-2">
    <a
      href="https://help.github.com/en/enterprise/2.17/user/articles/creating-a-personal-access-token-for-the-command-line"
      class="text-blue-500 hover:underline"
      target="_blank">
      Creating Personal Auth Tokens
    </a>
  </div>
  {/if}
</div>
