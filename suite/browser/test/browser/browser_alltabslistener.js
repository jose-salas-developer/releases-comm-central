const gCompleteState = Ci.nsIWebProgressListener.STATE_STOP +
                       Ci.nsIWebProgressListener.STATE_IS_NETWORK;

var gFrontProgressListener = {
  onProgressChange: function (aWebProgress, aRequest,
                              aCurSelfProgress, aMaxSelfProgress,
                              aCurTotalProgress, aMaxTotalProgress) {
  },

  onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
    var state = "onStateChange";
    info("FrontProgress: " + state + " 0x" + aStateFlags.toString(16));
    ok(gFrontNotificationsPos < gFrontNotifications.length, "Got an expected notification for the front notifications listener");
    is(state, gFrontNotifications[gFrontNotificationsPos], "Got a notification for the front notifications listener");
    gFrontNotificationsPos++;
  },

  onLocationChange: function (aWebProgress, aRequest, aLocationURI, aFlags) {
    var state = "onLocationChange";
    info("FrontProgress: " + state + " " + aLocationURI.spec);
    ok(gFrontNotificationsPos < gFrontNotifications.length, "Got an expected notification for the front notifications listener");
    is(state, gFrontNotifications[gFrontNotificationsPos], "Got a notification for the front notifications listener");
    gFrontNotificationsPos++;
  },

  onStatusChange: function (aWebProgress, aRequest, aStatus, aMessage) {
  },

  onSecurityChange: function (aWebProgress, aRequest, aState) {
    var state = "onSecurityChange";
    info("FrontProgress: " + state + " 0x" + aState.toString(16));
    ok(gFrontNotificationsPos < gFrontNotifications.length, "Got an expected notification for the front notifications listener");
    is(state, gFrontNotifications[gFrontNotificationsPos], "Got a notification for the front notifications listener");
    gFrontNotificationsPos++;
  }
}

var gAllProgressListener = {
  onStateChange: function (aBrowser, aWebProgress, aRequest, aStateFlags, aStatus) {
    var state = "onStateChange";
    info("AllProgress: " + state + " 0x" + aStateFlags.toString(16));
    is(aBrowser, gTestBrowser, state + " notification came from the correct browser");
    ok(gAllNotificationsPos < gAllNotifications.length, "Got an expected notification for the all notifications listener");
    is(state, gAllNotifications[gAllNotificationsPos], "Got a notification for the all notifications listener");
    gAllNotificationsPos++;

    if ((aStateFlags & gCompleteState) == gCompleteState) {
      is(gAllNotificationsPos, gAllNotifications.length, "Saw the expected number of notifications");
      is(gFrontNotificationsPos, gFrontNotifications.length, "Saw the expected number of frontnotifications");
      executeSoon(gNextTest);
    }
  },

  onLocationChange: function (aBrowser, aWebProgress, aRequest, aLocationURI, aFlags) {
    var state = "onLocationChange";
    info("AllProgress: " + state + " " + aLocationURI.spec);
    is(aBrowser, gTestBrowser, state + " notification came from the correct browser");
    ok(gAllNotificationsPos < gAllNotifications.length, "Got an expected notification for the all notifications listener");
    is(state, gAllNotifications[gAllNotificationsPos], "Got a notification for the all notifications listener");
    gAllNotificationsPos++;
  },

  onStatusChange: function (aBrowser, aWebProgress, aRequest, aStatus, aMessage) {
    var state = "onStatusChange";
    is(aBrowser, gTestBrowser, state + " notification came from the correct browser");
  },

  onSecurityChange: function (aBrowser, aWebProgress, aRequest, aState) {
    var state = "onSecurityChange";
    info("AllProgress: " + state + " 0x" + aState.toString(16));
    is(aBrowser, gTestBrowser, state + " notification came from the correct browser");
    ok(gAllNotificationsPos < gAllNotifications.length, "Got an expected notification for the all notifications listener");
    is(state, gAllNotifications[gAllNotificationsPos], "Got a notification for the all notifications listener");
    gAllNotificationsPos++;
  }
}

var gFrontNotifications, gAllNotifications, gFrontNotificationsPos, gAllNotificationsPos;
var gBackgroundTab, gForegroundTab, gBackgroundBrowser, gForegroundBrowser, gTestBrowser;
var gTestPage = "/browser/suite/browser/test/browser/alltabslistener.html";
var gNextTest;

function test() {
  waitForExplicitFinish();

  gBackgroundTab = getBrowser().addTab("about:blank");
  gForegroundTab = getBrowser().addTab("about:blank");
  gBackgroundBrowser = getBrowser().getBrowserForTab(gBackgroundTab);
  gForegroundBrowser = getBrowser().getBrowserForTab(gForegroundTab);
  getBrowser().selectedTab = gForegroundTab;

  // We must wait until the about:blank page has completed loading before
  // starting tests or we get notifications from that
  gForegroundBrowser.addEventListener("load", startTests, true);
}

function runTest(browser, url, next) {
  gFrontNotificationsPos = 0;
  gAllNotificationsPos = 0;
  gNextTest = next;
  gTestBrowser = browser;
  browser.loadURI(url);
}

function startTests() {
  gForegroundBrowser.removeEventListener("load", startTests, true);
  executeSoon(startTest1);
}

function startTest1() {
  info("\nTest 1");
  getBrowser().addProgressListener(gFrontProgressListener);
  getBrowser().addTabsProgressListener(gAllProgressListener);

  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = gAllNotifications;
  runTest(gForegroundBrowser, "http://example.org" + gTestPage, startTest2);
}

function startTest2() {
  info("\nTest 2");
  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = gAllNotifications;
  runTest(gForegroundBrowser, "https://example.com" + gTestPage, startTest3);
}

function startTest3() {
  info("\nTest 3");
  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = [];
  runTest(gBackgroundBrowser, "http://example.org" + gTestPage, startTest4);
}

function startTest4() {
  info("\nTest 4");
  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = [];
  runTest(gBackgroundBrowser, "https://example.com" + gTestPage, startTest5);
}

function startTest5() {
  info("\nTest 5");
  // Switch the foreground browser
  [gForegroundBrowser, gBackgroundBrowser] = [gBackgroundBrowser, gForegroundBrowser];
  [gForegroundTab, gBackgroundTab] = [gBackgroundTab, gForegroundTab];
  // Avoid the onLocationChange this will fire
  getBrowser().removeProgressListener(gFrontProgressListener);
  getBrowser().selectedTab = gForegroundTab;
  getBrowser().addProgressListener(gFrontProgressListener);

  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = gAllNotifications;
  runTest(gForegroundBrowser, "http://example.org" + gTestPage, startTest6);
}

function startTest6() {
  info("\nTest 6");
  gAllNotifications = [
    "onStateChange",
    "onLocationChange",
    "onSecurityChange",
    "onStateChange"
  ];
  gFrontNotifications = [];
  runTest(gBackgroundBrowser, "http://example.org" + gTestPage, finishTest);
}

function finishTest() {
  getBrowser().removeProgressListener(gFrontProgressListener);
  getBrowser().removeTabsProgressListener(gAllProgressListener);
  getBrowser().removeTab(gBackgroundTab);
  getBrowser().removeTab(gForegroundTab);
  finish();
}
