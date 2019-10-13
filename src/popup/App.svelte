<script>
  let currentToken = "";
  let currentTokenMasked = "";
  let isTestingToken = false;
  let newToken = "";
  let tokenIsInvalid = false;

  export const port = chrome.runtime.connect({ name: "template-api" });

  port.onMessage.addListener(({ type, data }) => {
    switch (type) {
      case "token":
        setCurrentToken(data);
        break;
      case "token_valid":
        isTestingToken = false;
        newToken = "";
        setCurrentToken(data);
        sendReady();
        break;
      case "token_invalid":
        isTestingToken = false;
        tokenIsInvalid = true;

        setCurrentToken("");
        break;
    }
  });

  export function postMessage(message) {
    port.postMessage(message);
  }

  export function sendReady(fetchTemplates = true) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      postMessage({ type: "ready", data: tabs[0].url, fetchTemplates });
    });
  }

  function removeCurrentToken(token) {
    setCurrentToken("");
    newToken = "";
    postMessage({ type: "remove_token" });
  }

  function setCurrentToken(token) {
    currentToken = token;
    currentTokenMasked = token.replace(/.(?=.{4,}$)/g, "*");
  }

  function handleAddTokenClick() {
    tokenIsInvalid = false;
    isTestingToken = true;
    postMessage({ type: "set_token", data: newToken });
  }

  function handleDeleteTokenClick() {
    removeCurrentToken();
  }
</script>

<div class="p-4 flex flex-col" style="width: 30rem">
  {#if currentToken}
    <div class="flex">
      <div
        class="flex-1 bg-gray-200 appearance-none border-2 border-gray-300
        border-r-0 rounded-l w-full py-2 px-4 text-gray-700 leading-tight">
        {currentTokenMasked}
      </div>
      <button
        on:click|preventDefault={handleDeleteTokenClick}
        class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4
        rounded-r">
        Delete
      </button>
    </div>
  {:else if isTestingToken}
    <div class="flex text-green-600 font-semibold font-mono text-center">
      Connecting...
    </div>
  {:else}
    {#if tokenIsInvalid}
      <div
        class="mb-2 py-2 px-4 bg-red-500 rounded text-white font-semibold
        tracking-wide">
        Invalid token
      </div>
    {/if}
    <div class="flex">
      <div class="flex-1">
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
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4
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
