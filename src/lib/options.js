// Saves options to chrome.storage
async function saveOptions(submitEvent) {
  submitEvent.preventDefault();

  const baseUrl = document.getElementById("phabricatorBaseUrl").value;
  const enableAutoLand = document.getElementById("enableAutoLand").checked;
  const requireAutoLandHashtag = document.getElementById(
    "requireAutoLandHashtag"
  ).checked;

  await phab.setSyncStore({
    baseUrl,
    enableAutoLand,
    requireAutoLandHashtag,
  });

  const status = document.getElementById("status");
  status.style.display = "block";
  status.textContent = "Options saved.";
  setTimeout(function hideStatus() {
    status.style.display = "none";
  }, 2000);
}

function updateRequireAutoLandHashtagVisibility() {
  document.getElementById(
    "requireAutoLandHashtagContainer"
  ).style.display = document.getElementById("enableAutoLand").checked
    ? "block"
    : "none";
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restoreOptions() {
  document
    .getElementById("enableAutoLand")
    .addEventListener("change", updateRequireAutoLandHashtagVisibility);

  const {
    baseUrl,
    enableAutoLand,
    requireAutoLandHashtag,
  } = await phab.getSyncStore();

  document.getElementById("phabricatorBaseUrl").value = baseUrl;
  document.getElementById("enableAutoLand").checked = enableAutoLand;
  document.getElementById(
    "requireAutoLandHashtag"
  ).checked = requireAutoLandHashtag;

  updateRequireAutoLandHashtagVisibility();
  document.getElementById("content").style.display = "block";
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("contentForm").addEventListener("submit", saveOptions);
