// import parseUrl from 'parse-github-url';
const TOKEN_LOCAL_STORAGE_KEY = 'rms-pr-template-picker:token';

const composeContentsUrl = (owner, repo, path = '') => {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
};

const getContents = ({ owner, repo, path = '', token }) => {
  console.log('getContents', owner, repo, path, token);
  return fetch(composeContentsUrl(owner, repo, path), {
    headers: getRequestHeaders(token),
    method: 'get',
  });
}

const getRequestHeaders = (token) => {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };
}

const getTemplates = async (data) => {
  let secondaryTemplateFiles;
  const templates = [];

  // Get primary template
  const primaryTemplateResponse = await getContents({ path: '.github/PULL_REQUEST_TEMPLATE.md', ...data });

  if(primaryTemplateResponse.ok) {
    const primaryTemplate = await primaryTemplateResponse.json();
    primaryTemplate.content = atob(primaryTemplate.content);
    templates.push(primaryTemplate);
  }

  // Get secondary templates
  secondaryTemplateFiles = await getContents({ path: '.github/PULL_REQUEST_TEMPLATE', ...data });

  if(!secondaryTemplateFiles.ok) {
    return templates;
  }

  const secondaryTemplateFileContents = await secondaryTemplateFiles.json();
  let i;
  let secondaryTemplateResponse;
  let secondaryTemplate;

  for(i in secondaryTemplateFileContents) {
    secondaryTemplateResponse = await getContents({ path: secondaryTemplateFileContents[i].path, ...data });
    secondaryTemplate = await secondaryTemplateResponse.json();
    secondaryTemplate.content = atob(secondaryTemplate.content);
    templates.push(secondaryTemplate);
  }

  return templates;
}

const postMessage = (message) => {
  const port = chrome.runtime.connect({ name: 'template-api' });

  port.postMessage(message);
}

const testAndSetToken = async (token, port) => {
  const response = await fetch('https://api.github.com/user', {
    headers: getRequestHeaders(token),
    method: 'get'
  });

  if(response.ok) {
    chrome.storage.sync.set({ token: token });
    port.postMessage({type: 'token_valid', data: token});
  } else {
    chrome.storage.sync.remove('token');
    port.postMessage({type: 'token_invalid'});
  }
}

function parseUrl(url) {
  const pieces = url.split('/');
  return {
    owner: pieces[3],
    repo: pieces[4]
  }
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log(arguments);
});

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
//     chrome.declarativeContent.onPageChanged.addRules([{
//       conditions: [new chrome.declarativeContent.PageStateMatcher({
//         pageUrl: {hostEquals: 'github.com'},
//       })],
//       actions: [new chrome.declarativeContent.ShowPageAction()]
//     }]);
//   });
// });

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(({ type, data }) => {
    switch(type) {
      case 'ready':
        chrome.storage.sync.get('token', async ({ token }) => {
          port.postMessage({
            type: 'token',
            data: token
          })

          console.log(data, parseUrl(data));

          const templates = await getTemplates({
            token,
            ...parseUrl(data)
          })

          console.log(templates);

          port.postMessage({
            type: 'templates',
            data: templates
          })
        });
        break;
      case 'remove_token':
        chrome.storage.sync.remove('token');
        break;
      case 'set_token':
        testAndSetToken(data, port);
        break;
    }
  });
});
