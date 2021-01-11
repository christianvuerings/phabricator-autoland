# Phabricator Autoland <img src="./src/phabricator-autoland.svg" alt="Logo" width="20">

Autoland Phabricator revisions which are ready to land

<img src="./assets/phabricator-autoland-animated.gif" alt="Animated gif showing the functionality of Phabricator Autoland" width="400">

## Install

* [**Chrome** extension](https://chrome.google.com/webstore/detail/phabricator-autoland/onjafannflphlocdocbajjmnhanhhjil)

## Development

1. Install Node.js dependencies

```
npm install
```

2. Load the `src` directory as [an unpacked extension](https://webkul.com/blog/how-to-install-the-unpacked-extension-in-chrome/)

3. Reload extension with every change. We recommend using the [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) to make this easier

## Build

`npm run build`


## FAQ

### As a reviewer, how do I ensure a diff doesn't land when it still requires changes?

Make sure to set the status of the diff to `Request Changes`. That way, the autoland feature won't kick in.

### My diff is ✅ and has the `#autoland` tag, why is it not landing?

* Only when you've been idle for more than 15 seconds (no keyboard or mouse interactions), will the auto land feature execute. We use [`chrome.idle`](https://developer.chrome.com/docs/extensions/reference/idle/) under the hood.
* Only repositories which have the experimental `Land Revision` feature enabled will be able to autoland diffs. You can check whether this is the case by going to a diff and verifying you see a `Land Revision` link.<br />
<img src="./assets/phabricator-land-revision-link-on-diff.png" alt="Land Revision link on a diff">

### My diff has a ❌ next to it, what is going on?

Hover over the icon to get more information. For every diff we perform these checks:
* Builds pass
* Active landing operation passes
* The `#autoland` tag is included in the summary

### How does the extension work?

1. Ping the phabricator URL on a regular basis to get all the accepted diffs
2. For each accepted diff, check whether the builds have passed
3. If they do and the `#autoland` tag is included in the summary, autoland the diff
4. To autoland the diff, we wait until the user is idle for 15 seconds.
5. If they are idle, open a tab in the background and perform the `Land Revision` action
