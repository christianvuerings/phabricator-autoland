function createTab(options) {
  return new Promise((resolve) => {
    chrome.tabs.create(options, async (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      });
    });
  });
}

function getActiveOperationStatus(className) {
  return Object.entries({
    "fa-times": "failed",
    "fa-plane": "landing",
    "fa-check": "passed",
  }).reduce((acc, [key, value]) => {
    if (className.includes(key)) {
      return value;
    }
    return acc;
  }, "unknown");
}

async function fetchDiffs() {
  try {
    const activeDifferentialDoc = await phab.fetch(
      phab.const.PHABRICATOR_ACTIVE_PATH
    );

    // Get all diffs which are ready to land
    // This can actually be incorrect since some of the builds might be failing
    const readyToLand = [
      ...[...activeDifferentialDoc.querySelectorAll(".phui-box")]
        .filter((element) => element.textContent.startsWith("Ready to Land"))[0]
        .querySelectorAll(".phui-oi-link"),
    ].map((element) => {
      const href = element.getAttribute("href");
      return {
        path: href,
        id: href.replace("/D", ""),
        title: element.getAttribute("title"),
      };
    });

    const diffs = await Promise.all(
      readyToLand.map(async (item) => {
        const diffDoc = await phab.fetch(item.path);

        const summary =
          [
            ...diffDoc.querySelectorAll(".phui-property-list-section-header"),
          ].filter((el) => el.innerText.toLowerCase().includes("summary"))[0]
            ?.nextSibling?.innerText ?? "";

        const { className: buildStatusClassName } = [
          ...diffDoc.querySelectorAll(".phui-status-list-view a"),
        ]
          .filter((el) => el.innerText.startsWith("Buildable"))[0]
          .closest(".phui-status-item-target")
          .querySelector(".phui-font-fa");

        const activeOperationsRow = [
          ...diffDoc.querySelectorAll(".phui-header-header"),
        ]
          .filter((el) => el.innerText.startsWith("Active Operations"))[0]
          ?.closest(".phui-box-border")
          .querySelector(".phui-oi-list-view .phui-oi-table-row");

        return {
          ...item,
          buildStatus: Object.entries({
            "fa-times-circle": "failed",
            "fa-chevron-circle-right": "building",
            "fa-check-circle": "passed",
          }).reduce((acc, [key, value]) => {
            if (buildStatusClassName.includes(key)) {
              return value;
            }
            return acc;
          }, "unknown"),
          includesAutolandTag: summary.includes(phab.const.AUTOLAND_TAG),
          activeOperations: activeOperationsRow
            ? [
                {
                  status: getActiveOperationStatus(
                    activeOperationsRow.querySelector(
                      ".phui-oi-status-icon span"
                    ).className
                  ),
                  description: activeOperationsRow.querySelector(
                    ".phui-oi-attribute"
                  ).innerText,
                },
              ]
            : null,
        };
      })
    );
    phab.badge.renderCount(diffs.length);

    chrome.storage.local.set({ error: null, diffs });
    return diffs;
  } catch (caughtError) {
    const diffs = [];
    const error = "Could not fetch diffs";

    phab.badge.renderError(error);
    phab.setLocalStore({ error, diffs });
    chrome.storage.local.set({ error, diffs });
    return [];
  }
}

(async function init() {
  fetchDiffs();
})();

chrome.idle.setDetectionInterval(15);
chrome.idle.onStateChanged.addListener(async function onStateChanged(newState) {
  if (newState === "idle") {
    const [
      diffs,
      { baseUrl, enableAutoLand, requireAutoLandHashtag },
    ] = await Promise.all([fetchDiffs(), phab.getSyncStore()]);

    const readyToLandDiffs = diffs.filter(
      (diff) =>
        enableAutoLand &&
        diff.buildStatus === "passed" &&
        (requireAutoLandHashtag ? diff.includesAutolandTag : true) &&
        diff.activeOperations == null
    );

    Promise.all(
      readyToLandDiffs.map(async (readyToLandDiff) => {
        const tab = await createTab({
          url: String(
            phab.url(
              phab.const.PHABRICATOR_DIFF_REVISION_PATH(readyToLandDiff.id),
              baseUrl
            )
          ),
          active: false,
        });

        chrome.tabs.sendMessage(
          tab.id,
          { action: "phab.autoLand" },
          function handleMessage() {
            // console.log(response.action);
            chrome.tabs.remove(tab.id);
          }
        );
      })
    );
  }
});

setInterval(() => {
  fetchDiffs();
}, 5000);
