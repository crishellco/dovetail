import _ from "../lodash.min";

const DEFAULT_TEMPLATE_NAME = 'PULL_REQUEST_TEMPLATE.md';
const TEMPLATE_DIRECTORY = 'PULL_REQUEST_TEMPLATE';

const composeContentsUrl = (owner, repo, branch = "", path = "") =>
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

const getContents = ({ branch = "", owner, repo, path = "", token }) =>
  fetch(composeContentsUrl(owner, repo, branch, path), {
    headers: getRequestHeaders(token),
    method: "get"
  });

const getRequestHeaders = token => ({
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json"
});

const getTemplate = async data => {
  const response = await getContents(data);

  if (!response.ok) {
    return;
  }

  const template = await response.json();
  template.content = atob(template.content);
  template.name = template.name === DEFAULT_TEMPLATE_NAME ? 'default' : (template.name.split('.').slice(0, -1)).join('.');

  return template;
};

const getTemplates = async data => {
  let secondaryTemplateFiles;
  const templates = [];

  const primaryTemplate = await getTemplate({
    path: `.github/${DEFAULT_TEMPLATE_NAME}`,
    ...data
  });

  if (primaryTemplate) {
    templates.push(primaryTemplate);
  }

  // Get secondary templates
  secondaryTemplateFiles = await getContents({
    path: `.github/${TEMPLATE_DIRECTORY}`,
    ...data
  });

  if (secondaryTemplateFiles.ok) {
    const secondaryTemplateFileContents = await secondaryTemplateFiles.json();
    let i;
    let secondaryTemplate;

    for (i in secondaryTemplateFileContents) {
      secondaryTemplate = await getTemplate({
        path: secondaryTemplateFileContents[i].path,
        ...data
      });

      if (secondaryTemplate) {
        templates.push(secondaryTemplate);
      }
    }
  }

  return templates;
};

function parseUrl(url) {
  const repoPieces = url.split("/");
  const branchPieces = _.last(url.split("compare"));
  const branch = _.first(_.last(branchPieces.split("...")).split("?"));

  return {
    branch,
    owner: repoPieces[3],
    repo: repoPieces[4]
  };
}

const testAndSetToken = async (token, port) => {
  const response = await fetch("https://api.github.com/user", {
    headers: getRequestHeaders(token),
    method: "get"
  });

  if (response.ok) {
    chrome.storage.sync.set({ token });
    port.postMessage({ type: "token_valid", data: token });
  } else {
    chrome.storage.sync.remove("token");
    port.postMessage({ type: "token_invalid" });
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, { status, url }) => {
  const gitHubCommit = /.*github.com\/.*\/compare\/.*/;
  if (
    changeInfo.status === "complete" &&
    status === "complete" &&
    gitHubCommit.test(url)
  ) {
    sendMsgToActiveTab({ type: "onCompare" });
  }
});

const sendMsgToActiveTab = message =>
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(({ type, data, fetchTemplates }) => {
    switch (type) {
      case "ready":
        chrome.storage.sync.get("token", async ({ token }) => {
          port.postMessage({
            type: "token",
            data: token
          });

          if(!fetchTemplates) {
            return;
          }

          data = parseUrl(data);

          const templates = await getTemplates({
            token,
            ...data
          });

          sendMsgToActiveTab({
            type: "templates",
            data: templates
          });
        });
        break;
      case "remove_token":
        chrome.storage.sync.remove("token");
        sendMsgToActiveTab({
          type: "templates",
          data: []
        });
        port.postMessage({
          type: "token",
        });
        break;
      case "set_token":
        testAndSetToken(data, port);
        break;
    }
  });
});
