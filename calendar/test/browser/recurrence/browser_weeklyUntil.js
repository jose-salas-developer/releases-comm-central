/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var {
  CALENDARNAME,
  CANVAS_BOX,
  EVENTPATH,
  EVENT_BOX,
  closeAllEventDialogs,
  controller,
  createCalendar,
  deleteCalendars,
  goToDate,
  handleOccurrencePrompt,
  helpersForController,
  invokeNewEventDialog,
  switchToView,
  viewForward,
} = ChromeUtils.import("resource://testing-common/mozmill/CalendarUtils.jsm");
var { menulistSelect, saveAndCloseItemDialog, setData } = ChromeUtils.import(
  "resource://testing-common/mozmill/ItemEditingHelpers.jsm"
);

var { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");

var { lookupEventBox } = helpersForController(controller);

const ENDDATE = cal.createDateTime("20090126T000000Z"); // Last Monday in month.
const HOUR = 8;

add_task(async function testWeeklyUntilRecurrence() {
  createCalendar(controller, CALENDARNAME);
  switchToView(controller, "day");
  goToDate(controller, 2009, 1, 5); // Monday

  // Create weekly recurring event.
  let eventBox = lookupEventBox("day", CANVAS_BOX, null, 1, HOUR);
  await invokeNewEventDialog(controller, eventBox, async (eventWindow, iframeWindow) => {
    await setData(eventWindow, iframeWindow, { title: "Event", repeat: setRecurrence });
    saveAndCloseItemDialog(eventWindow);
  });

  let box = lookupEventBox("day", EVENT_BOX, null, 1, null, EVENTPATH);

  // Check day view.
  for (let week = 0; week < 3; week++) {
    // Monday
    controller.waitForElement(box);
    viewForward(controller, 2);

    // Wednesday
    controller.waitForElement(box);
    viewForward(controller, 2);

    // Friday
    controller.waitForElement(box);
    viewForward(controller, 3);
  }

  // Monday, last occurrence
  controller.waitForElement(box);
  viewForward(controller, 2);

  // Wednesday
  controller.waitForElementNotPresent(box);

  // Check week view.
  switchToView(controller, "week");
  goToDate(controller, 2009, 1, 5);
  for (let week = 0; week < 3; week++) {
    // Monday
    controller.waitForElement(lookupEventBox("week", EVENT_BOX, null, 2, null, EVENTPATH));

    // Wednesday
    controller.waitForElement(lookupEventBox("week", EVENT_BOX, null, 4, null, EVENTPATH));

    // Friday
    controller.waitForElement(lookupEventBox("week", EVENT_BOX, null, 6, null, EVENTPATH));

    viewForward(controller, 1);
  }

  // Monday, last occurrence
  controller.waitForElement(lookupEventBox("week", EVENT_BOX, null, 2, null, EVENTPATH));
  // Wednesday
  Assert.ok(!lookupEventBox("week", EVENT_BOX, null, 4, null, EVENTPATH).exists());

  // Check multiweek view.
  switchToView(controller, "multiweek");
  goToDate(controller, 2009, 1, 5);
  checkMultiWeekView("multiweek");

  // Check month view.
  switchToView(controller, "month");
  goToDate(controller, 2009, 1, 5);
  checkMultiWeekView("month");

  // Delete event.
  box = lookupEventBox("month", CANVAS_BOX, 2, 2, null, EVENTPATH);
  controller.click(box);
  handleOccurrencePrompt(controller, box, "delete", true);
  controller.waitForElementNotPresent(box);

  Assert.ok(true, "Test ran to completion");
});

async function setRecurrence(recurrenceWindow) {
  let recurrenceDocument = recurrenceWindow.document;

  // weekly
  await menulistSelect(recurrenceDocument.getElementById("period-list"), "1");

  let mon = cal.l10n.getDateFmtString("day.2.Mmm");
  let wed = cal.l10n.getDateFmtString("day.4.Mmm");
  let fri = cal.l10n.getDateFmtString("day.6.Mmm");

  let dayPicker = recurrenceDocument.getElementById("daypicker-weekday");

  // Starting from Monday so it should be checked.
  Assert.ok(dayPicker.querySelector(`[label="${mon}"]`).checked, "mon checked");
  // Check Wednesday and Friday too.
  EventUtils.synthesizeMouseAtCenter(
    dayPicker.querySelector(`[label="${wed}"]`),
    {},
    recurrenceWindow
  );
  EventUtils.synthesizeMouseAtCenter(
    dayPicker.querySelector(`[label="${fri}"]`),
    {},
    recurrenceWindow
  );

  // Set until date.
  EventUtils.synthesizeMouseAtCenter(
    recurrenceDocument.getElementById("recurrence-range-until"),
    {},
    recurrenceWindow
  );

  // Delete previous date.
  let untilInput = recurrenceDocument.getElementById("repeat-until-date");
  untilInput.focus();
  EventUtils.synthesizeKey("a", { accelKey: true }, recurrenceWindow);
  untilInput.focus();
  EventUtils.synthesizeKey("VK_DELETE", {}, recurrenceWindow);

  let endDateString = cal.dtz.formatter.formatDateShort(ENDDATE);
  EventUtils.sendString(endDateString, recurrenceWindow);

  // Move focus to ensure the date is selected.
  untilInput.focus();
  EventUtils.synthesizeKey("VK_TAB", {}, recurrenceWindow);

  // Close dialog.
  EventUtils.synthesizeMouseAtCenter(
    recurrenceDocument.querySelector("dialog").getButton("accept"),
    {},
    recurrenceWindow
  );
}

function checkMultiWeekView(view) {
  let startWeek = view == "month" ? 2 : 1;

  for (let week = startWeek; week < startWeek + 3; week++) {
    // Monday
    controller.waitForElement(lookupEventBox(view, CANVAS_BOX, week, 2, null, EVENTPATH));
    // Wednesday
    Assert.ok(lookupEventBox(view, CANVAS_BOX, week, 4, null, EVENTPATH).exists());
    // Friday
    Assert.ok(lookupEventBox(view, CANVAS_BOX, week, 6, null, EVENTPATH).exists());
  }

  // Monday, last occurrence
  Assert.ok(lookupEventBox(view, CANVAS_BOX, startWeek + 3, 2, null, EVENTPATH).exists());

  // Wednesday
  Assert.ok(!lookupEventBox(view, CANVAS_BOX, startWeek + 3, 4, null, EVENTPATH).exists());
}

registerCleanupFunction(function teardownModule() {
  deleteCalendars(controller, CALENDARNAME);
  closeAllEventDialogs();
});
