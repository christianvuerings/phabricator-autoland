const phab = {
  const: {
    PHABRICATOR_ACTIVE_PATH: "differential/query/active/",
    PHABRICATOR_DIFF_REVISION_PATH: (id) =>
      `/differential/revision/operation/${id}/`,
    AUTOLAND_TAG: "#autoland",
  },
};

const colors = {
  error: "#cb2431",
  default: "#2a2a2d",
};

phab.badge = {
  render: ({ text, color, title }) => {
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
    chrome.browserAction.setTitle({ title });
  },

  getCountString: (count) => {
    if (count === 0) {
      return "";
    }

    if (count > 9999) {
      return "∞";
    }

    return String(count);
  },

  renderCount: (count) => {
    phab.badge.render({
      text: phab.badge.getCountString(count),
      color: colors.default,
      title: "Phabricator Autoland",
    });
  },

  renderError: (error) => {
    phab.badge.render({ text: "x", color: colors.error, title: error });
  },
};

const timeoutSignal = (timeout) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
};

phab.url = (path, baseUrl) => new URL(path, baseUrl);
phab.fetch = async (path) => {
  const { baseUrl } = await phab.getSyncStore();
  const result = await (
    await fetch(phab.url(path, baseUrl), { signal: timeoutSignal(15000) })
  ).text();
  const dom = new DOMParser();
  return dom.parseFromString(result, "text/html");
};

phab.getLocalStore = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      { diffs: [], error: null },
      function getStoreItems(items) {
        resolve({ ...items });
      }
    );
  });
};

phab.setLocalStore = async ({ diffs = [], error = null }) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ diffs, error }, function setStoreItems() {
      resolve();
    });
  });
};

phab.getSyncStore = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        baseUrl: "https://phabricator.pinadmin.com/",
        enableAutoLand: true,
        requireAutoLandHashtag: true,
      },
      function getStoreItems(items) {
        resolve({ ...items });
      }
    );
  });
};

phab.setSyncStore = async ({
  baseUrl,
  enableAutoLand,
  requireAutoLandHashtag,
}) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        baseUrl,
        enableAutoLand,
        requireAutoLandHashtag,
      },
      function setStoreItems() {
        resolve();
      }
    );
  });
};
