// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../../components/helpers/helpers.js';
import InspectorScrollbarsStyles from '../inspectorScrollbars.css.js';
import TextButtonStyles from '../textButton.css.js';
import * as ThemeSupport from '../theme_support/theme_support.js';
import ThemeColors from '../themeColors.css.js';
import {appendStyle} from './append-style.js';

export function injectCoreStyles(root: Element|ShadowRoot): void {
  // TODO: Migrate inspectorCommpon.css last https://crbug.com/1222666
  appendStyle(root, 'ui/legacy/inspectorCommon.css', {enableLegacyPatching: false});

  const finalRoot = Helpers.GetRootNode.getRootNode(root);
  finalRoot.adoptedStyleSheets =
      finalRoot.adoptedStyleSheets.concat([InspectorScrollbarsStyles, ThemeColors, TextButtonStyles]);

  ThemeSupport.ThemeSupport.instance().injectHighlightStyleSheets(root);
  ThemeSupport.ThemeSupport.instance().injectCustomStyleSheets(root);
}

let bodyComputedStylesCached: CSSStyleDeclaration|null = null;
export function getThemeColorValue(variableName: string): string {
  if (!bodyComputedStylesCached) {
    /**
     * We are safe to cache this value as we're only using this code to look up
     * theme variables, and they do not change during runtime. And if the user
     * swaps from light => dark theme, or vice-versa, DevTools is entirely
     * reloaded, removing this cache.
     */
    bodyComputedStylesCached = window.getComputedStyle(document.body);
  }

  const colorValue = bodyComputedStylesCached.getPropertyValue(variableName);
  if (!colorValue) {
    throw new Error(`Could not find theme color for variable ${variableName}.`);
  }
  return colorValue;
}

export function getCurrentTheme(): 'light'|'dark' {
  if (document.documentElement.classList.contains('-theme-with-dark-background')) {
    return 'dark';
  }
  return 'light';
}
