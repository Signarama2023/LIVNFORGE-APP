# Native app (iOS/Capacitor) — TODO on that machine

The App Store app (`https://apps.apple.com/app/id6776882761`) is built from a
separate Capacitor/Xcode project that isn't in this repo. Do the following
there, not here.

## Lock portrait orientation

Real orientation lock for the installed app happens in
`ios/App/App/Info.plist`, not in this web repo. The web/PWA side is already
handled (see `manifest.json`'s `"orientation": "portrait"` and the
`screen.orientation.lock()` call near the top of `index.html`) — but the App
Store binary is the primary way most users experience the app, so it needs
its own fix.

In `ios/App/App/Info.plist`, find `UISupportedInterfaceOrientations` (and the
iPad variant, `UISupportedInterfaceOrientations~ipad`, if present) and remove
the landscape entries, leaving only:

```xml
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
</array>
```

Then rebuild and resubmit to the App Store.
