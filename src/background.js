const TOKEN_LOCAL_STORAGE_KEY = 'rms-pr-template-picker:token';


const composeContentsUrl = (owner, repo, path = '') => {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
};

const getContents = ({ owner, repo, path = '', token }) => {
  return fetch({
    headers: getRequestHeaders(token),
    method: 'get',
    url: composeContentsUrl(owner, repo, path)
  }).then((res) => res.json())
}

const getRequestHeaders = (token) => {
  return {
    Authorization: `token: ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };
}

const getTemplates = async (data) => {
  let secondaryTemplateFiles;
  const templates = [];

  // Get primary template
  try {
    templates.push(await getContents({ path: '.github/PULL_REQUEST_TEMPLATE.md', ...data }));
  } catch(e) {}

  // Get secondary templates
  try {
    secondaryTemplateFiles = await getContents({ path: '.github/PULL_REQUEST_TEMPLATE.md', ...data })
  } catch(e) {
    secondaryTemplateFiles = [];
  }

  secondaryTemplateFiles.forEach(async ({ path }) => {
    try {
      templates.push(await getContents({ path, ...data }));
    } catch(e) {}
  });
}

const testToken = (token) => {
  return fetch({
    headers: getRequestHeaders(token),
    method: 'get',
    url: 'https://api.github.com/repos'
  })
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'github.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(({ type, data }) => {
    switch(type) {
      case 'ready':
        chrome.storage.sync.get('token', async ({ token }) => {
          const templates = await getTemplates({
            token,
            ...data
          })
          port.postMessage({
            type: 'templates',
            data: templates
          })
        });
        // maybe start getting templates here, would send back an org and repo value
        break;
      case 'set_token':
        chrome.storage.sync.set({ token: data }, () => {
          console.log("The token has been set");
        });
        break;
    }
  });
});
