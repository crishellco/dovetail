import _ from '../lodash.min'

const DEFAULT_TEMPLATE_NAME = 'PULL_REQUEST_TEMPLATE.md'
const TEMPLATE_DIRECTORY = 'PULL_REQUEST_TEMPLATE'

const composeContentsUrl = (owner, repo, path = '') =>
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

const getContents = ({ owner, repo, path = '', token }) =>
  fetch(composeContentsUrl(owner, repo, path), {
    headers: getRequestHeaders(token),
    method: 'get',
  })

const getRequestHeaders = (token) => ({
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
})

const getTemplate = async (data) => {
  const response = await getContents(data)

  if (!response.ok) {
    return
  }

  const template = await response.json()
  template.content =
    atob(template.content) +
    `\n\n<sup><sub>[Template: ${template.name}]</sub></sup>`
  template.name =
    template.name === DEFAULT_TEMPLATE_NAME ? 'default' : template.name

  return template
}

const getTemplates = async (data) => {
  let secondaryTemplateFiles
  const templates = []

  const primaryTemplate = await getTemplate({
    path: `.github/${DEFAULT_TEMPLATE_NAME}`,
    ...data,
  })

  if (primaryTemplate) {
    templates.push(primaryTemplate)
  }

  // Get secondary templates
  secondaryTemplateFiles = await getContents({
    path: `.github/${TEMPLATE_DIRECTORY}`,
    ...data,
  })

  if (secondaryTemplateFiles.ok) {
    const secondaryTemplateFileContents = await secondaryTemplateFiles.json()

    for (let file of secondaryTemplateFileContents) {
      let secondaryTemplate = await getTemplate({
        path: file.path,
        ...data,
      })

      if (secondaryTemplate) {
        templates.push(secondaryTemplate)
      }
    }
  }

  return templates
}

function parseUrl(url) {
  const repoPieces = url.split('/')
  const branchPieces = _.last(url.split('compare'))
  const branch = _.first(_.last(branchPieces.split('...')).split('?'))

  return {
    branch,
    owner: repoPieces[3],
    repo: repoPieces[4],
  }
}

const testAndSetToken = async (token) => {
  const response = await fetch('https://api.github.com/user', {
    headers: getRequestHeaders(token),
    method: 'get',
  })

  if (response.ok) {
    chrome.storage.sync.set({ token })
    postMessage({ type: 'token_valid', data: token })
  } else {
    chrome.storage.sync.remove('token')
    postMessage({ type: 'token_invalid' })
  }
}

const sendMsgToActiveTab = (message) => {
  chrome.tabs.query({ active: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, message)
  })
}

const postMessage = (message) => {
  chrome.runtime.sendMessage(message)
  sendMsgToActiveTab(message)
}

chrome.runtime.onMessage.addListener(({ type, data, fetchTemplates }) => {
  switch (type) {
    case 'ready':
      chrome.storage.sync.get(['token'], async ({ token }) => {
        postMessage({
          type: 'token',
          data: token,
        })

        if (!fetchTemplates) {
          return
        }

        data = parseUrl(data)

        const templates = await getTemplates({
          token,
          ...data,
        })
        postMessage({ type: 'templates', data: templates, repo: data })
      })
      break
    case 'remove_token':
      chrome.storage.sync.remove('token')
      postMessage({ type: 'templates', data: [] })
      postMessage({
        type: 'token',
      })
      break
    case 'set_token':
      testAndSetToken(data)
      break
  }
})

const handleBrowserActionEnablementEvent = (tabId) => {
  tabId = typeof tabId === 'object' ? tabId.tabId : tabId

  chrome.tabs.get(tabId, ({ url }) => {
    if (url && url.indexOf('github.com') > -1) {
      chrome.browserAction.enable(tabId)
    } else {
      chrome.browserAction.disable(tabId)
    }
  })
}

chrome.tabs.onUpdated.addListener(handleBrowserActionEnablementEvent)
chrome.tabs.onActivated.addListener(handleBrowserActionEnablementEvent)
