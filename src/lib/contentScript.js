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
      setTimeout(() => {
        sendResponse({
          action: "phab.autoLandFired",
        });
      }, 3000);
    } else {
      sendResponse({
        action: "phab.autoLandNotSuccessful",
      });
    }
  }
  return true;
});
