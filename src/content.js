import App from './content/App.svelte'

let app
let existing
let target

function init() {
  if (existing) {
    existing.remove()
  }

  if (app) {
    down()
  }

  app = new App({
    anchor: target.firstChild,
    target,
  })

  chrome.runtime.sendMessage({
    type: 'ready',
    data: window.location.href,
    fetchTemplates: true,
  })
}

function down() {
  app.$destroy()
  app = null
}

window.onload = () => {
  chrome.runtime.onMessage.addListener(({ type, data, repo }) => {
    if (type === 'templates' && app) {
      app.$set({ repo, templates: data })
    }
  })

  setInterval(() => {
    existing = document.querySelector('#template-picker')
    target = document.querySelector('[data-project-hovercards-enabled]')
    const pullRequestBody = document.querySelector(
      '#new_pull_request #pull_request_body'
    )
    const isVisible = pullRequestBody
      ? pullRequestBody.offsetParent !== null
      : false

    if (target && isVisible && (!app || !existing)) {
      init()
    } else if (!target && app) {
      down()
    }
  }, 1500)
}
