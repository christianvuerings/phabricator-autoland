chrome.runtime.onMessage.addListener(function handleMessage(
  request,
  sender,
  sendResponse
) {
  if (
    request.action === "phab.autoLand" &&
    window.location.pathname.includes("differential/revision/operation/")
  ) {
    const submitButton = document.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.click();
      sendResponse({
        action: "phab.autoLandFired",
      });
    } else {
      sendResponse({
        action: "phab.autoLandNotSuccessful",
      });
    }
  }
});
