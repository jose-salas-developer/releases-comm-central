/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function browserWindowsCount() {
  let count = 0;
  let e = Services.wm.getEnumerator("navigator:browser");
  while (e.hasMoreElements()) {
    if (!e.getNext().closed)
      ++count;
  }
  return count;
}

function test() {
  /** Test for Bug 524745, ported by bug 558638 **/
  is(browserWindowsCount(), 1, "Only one browser window should be open initially");

  let uniqKey = "bug524745";
  let uniqVal = Date.now();

  waitForExplicitFinish();

  let window_B = openDialog(location, "_blank", "chrome,all,dialog=no");
  window_B.addEventListener("load", function testWindowBLoad(aEvent) {
    window_B.removeEventListener("load", testWindowBLoad);

      waitForFocus(function() {
        // Add identifying information to window_B
        ss.setWindowValue(window_B, uniqKey, uniqVal);
        let state = JSON.parse(ss.getBrowserState());
        let selectedWindow = state.windows[state.selectedWindow - 1];
        is(selectedWindow.extData && selectedWindow.extData[uniqKey], uniqVal,
           "selectedWindow is window_B");

        // Now minimize window_B. The selected window shouldn't have the secret data
        window_B.minimize();
        waitForFocus(function() {
          state = JSON.parse(ss.getBrowserState());
          selectedWindow = state.windows[state.selectedWindow - 1];
          ok(!selectedWindow.extData || !selectedWindow.extData[uniqKey],
             "selectedWindow is not window_B after minimizing it");

          // Now minimize the last open window (assumes no other tests left windows open)
          window.minimize();
          state = JSON.parse(ss.getBrowserState());
          is(state.selectedWindow, 0,
             "selectedWindow should be 0 when all windows are minimized");

          // Cleanup
          window.restore();
          window_B.close();
          is(browserWindowsCount(), 1,
             "Only one browser window should be open eventually");
          finish();
        });
      }, window_B);
  });
}
