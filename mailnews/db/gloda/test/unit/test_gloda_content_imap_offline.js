/* -*- Mode: JavaScript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/**
 * Tests the operation of the GlodaContent (in GlodaContent.jsm) and its exposure
 * via Gloda.getMessageContent for IMAP messages that are offline.
 */

/* import-globals-from base_gloda_content.js */
load("base_gloda_content.js");

function run_test() {
  configure_message_injection({ mode: "imap", offline: true });
  glodaHelperRunTests(tests);
}
