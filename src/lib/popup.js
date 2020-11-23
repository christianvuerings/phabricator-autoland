function buildStatusToEmoji(buildStatus) {
  if (buildStatus === "passed") {
    return "✅";
  }
  if (buildStatus === "landing") {
    return "🛬";
  }
  if (buildStatus === "building") {
    return "⌛";
  }
  if (buildStatus === "failed") {
    return "❌";
  }
  return "❔";
}

function renderTopNav() {
  return `
<div class="topNav">
  <h1 class="heading">Phabricator Autoland</h1>
  <a href="/options.html" class="button emoji-link">⚙️</a>
</div>
`;
}

function renderStatus({ diff }) {
  const status = diff.activeOperations
    ? diff.activeOperations[0]?.status
    : diff.buildStatus;

  const activeOperationMessage = diff.activeOperations
    ? `${buildStatusToEmoji(
        diff.activeOperations[0]?.status
      )} Active Operation: ${diff.activeOperations[0]?.description}\n`
    : "";

  const buildStatusMessage = `${buildStatusToEmoji(
    diff.buildStatus
  )} Build Status: ${diff.buildStatus}`;

  const autolandMessage = `${
    diff.includesAutolandTag
      ? "\n✅ Includes #autoland tag"
      : "\n❌ Does not include #autoland tag"
  }`;

  const statusTitle = `${activeOperationMessage}${buildStatusMessage}${autolandMessage}`;

  return `
<div class="status" title="${statusTitle}">${buildStatusToEmoji(status)}</div>
`;
}

function renderAcceptedDiffs({ diffs, baseUrl }) {
  return `
<div class="diffs">
  <h2 class="subHeading">Accepted Diffs</h2>

  ${
    !diffs.length
      ? '<div class="message">No diffs found</div>'
      : `
  <ul>
    ${diffs
      .map(
        (diff) =>
          `<li class="diff">
            ${renderStatus({ diff })}
            <a title="${diff.title}" href="${String(
            new URL(diff.path, baseUrl)
          )}">${diff.title}</a>
          </li>`
      )
      .join("")}
  </ul>
  `
  }
</div>
`;
}

function renderError({ baseUrl, error }) {
  return `
<div class="messageError">❌&nbsp;&nbsp;${error}</div>
<div class="message">Ensure you are logged in and can access <a href="${baseUrl}">${baseUrl}</a></div>
  `;
}

async function render() {
  const [{ error, diffs }, { baseUrl }] = await Promise.all([
    phab.getLocalStore(),
    phab.getSyncStore(),
  ]);

  document.querySelector("#content").innerHTML = `
  ${renderTopNav()}

  ${
    error
      ? renderError({ baseUrl, error })
      : renderAcceptedDiffs({ diffs, baseUrl })
  }
`;
}

// Make links inside of the pop-up work
window.addEventListener("click", function globalClickListener(e) {
  if (e.target.href !== undefined) {
    chrome.tabs.create({ url: e.target.href });
  }
});

chrome.storage.onChanged.addListener(function onChangedListener() {
  render();
});

render();
