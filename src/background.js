import axios from 'axios'

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'github.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});


const TOKEN_LOCAL_STORAGE_KEY = 'rms-pr-template-picker:token';


const getToken = () => {
  return localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY);
}

const getRequestHeaders = () => {
  return {
    Authorization: `token: ${getToken()}`,
    Accept: 'application/vnd.github.v3+json'
  };
}

const composeContentsUrl = (owner, repo, path = '') => {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
};

const getContents = (owner, repo, path = '') => {
  return axios
    .headers(getRequestHeaders())
    .get(composeContentsUrl(owner, repo, path));
}

const getTemplates = async (owner, repo) => {
  const templates = [];

  // Get default template (PULL_REQUEST_TEMPLATE.md)
  try {
    templates.push(await getContents(owner, repo, '.github/PULL_REQUEST_TEMPLATE.md'));
  } catch(e) {
    // not found...
  }

  // Get all templates in PULL_REQUEST_TEMPLATE
}
