// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToConsoleTab, waitForIssueButtonLabel} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('shows the toolbar button for no issue correctly', async () => {
    // Navigate to page which causes no issues.
    await goToResource('empty.html');
    await navigateToConsoleTab();

    await waitForIssueButtonLabel('No Issues');
  });

  // Flaky test on mac.
  it.skipOnPlatforms(['mac'], '[crbug.com/1317582]: shows the toolbar button for one issue correctly', async () => {
    // Navigate to page which causes a CookieIssue.
    await goToResource('console/cookie-issue.html');
    await navigateToConsoleTab();

    await waitForIssueButtonLabel('1 Issue:');
  });

  // Flaky test on mac.
  it.skipOnPlatforms(['mac'], '[crbug.com/1317582]:shows the toolbar button for two issues correctly', async () => {
    // Navigate to page which causes two CookieIssue.
    await goToResource('console/two-cookie-issues.html');
    await navigateToConsoleTab();

    await waitForIssueButtonLabel('2 Issues:');
  });

  it('updates the toolbar button correctly', async () => {
    // Navigate to page which causes no issues.
    await goToResource('empty.html');
    await navigateToConsoleTab();

    await waitForIssueButtonLabel('No Issues');

    const {target} = getBrowserAndPages();
    await target.evaluate(() => {
      // Trigger a CookieIssue.
      document.cookie = 'foo=bar;samesite=None';
    });

    await waitForIssueButtonLabel('1 Issue:');
  });
});
