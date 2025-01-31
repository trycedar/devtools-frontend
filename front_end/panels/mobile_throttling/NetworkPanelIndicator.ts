// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';

const UIStrings = {
  /**
   *@description Icon title in Network Panel Indicator of the Network panel
   */
  browserCacheDisabled: 'Browser cache is disabled',
  /**
   *@description Icon title in Network Panel Indicator of the Network panel
   */
  networkThrottlingIsEnabled: 'Network throttling is enabled',
  /**
   *@description Icon title in Network Panel Indicator of the Network panel
   */
  requestsMayBeOverridden: 'Requests may be overridden locally, see the Sources panel',
  /**
   *@description Icon title in Network Panel Indicator of the Network panel
   */
  requestsMayBeBlocked: 'Requests may be blocked, see the Network request blocking panel',
  /**
   * @description Title of an icon in the Network panel that indicates that accepted content encodings have been overriden.
   */
  acceptedEncodingOverrideSet:
      'The set of accepted `Content-Encoding` headers has been modified by DevTools, see the Network conditions panel',
};
const str_ = i18n.i18n.registerUIStrings('panels/mobile_throttling/NetworkPanelIndicator.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class NetworkPanelIndicator {
  constructor() {
    // TODO: we should not access network from other modules.
    if (!UI.InspectorView.InspectorView.instance().hasPanel('network')) {
      return;
    }
    const manager = SDK.NetworkManager.MultitargetNetworkManager.instance();
    manager.addEventListener(SDK.NetworkManager.MultitargetNetworkManager.Events.ConditionsChanged, updateVisibility);
    manager.addEventListener(
        SDK.NetworkManager.MultitargetNetworkManager.Events.BlockedPatternsChanged, updateVisibility);
    manager.addEventListener(SDK.NetworkManager.MultitargetNetworkManager.Events.InterceptorsChanged, updateVisibility);
    manager.addEventListener(
        SDK.NetworkManager.MultitargetNetworkManager.Events.AcceptedEncodingsChanged, updateVisibility);
    Common.Settings.Settings.instance().moduleSetting('cacheDisabled').addChangeListener(updateVisibility, this);

    updateVisibility();

    function updateVisibility(): void {
      const warnings: Common.UIString.LocalizedString[] = [];
      if (manager.isThrottling()) {
        warnings.push(i18nString(UIStrings.networkThrottlingIsEnabled));
      }
      if (Common.Settings.Settings.instance().moduleSetting('cacheDisabled').get()) {
        warnings.push(i18nString(UIStrings.browserCacheDisabled));
      }
      if (SDK.NetworkManager.MultitargetNetworkManager.instance().isIntercepting()) {
        warnings.push(i18nString(UIStrings.requestsMayBeOverridden));
      }
      if (manager.isBlocking()) {
        warnings.push(i18nString(UIStrings.requestsMayBeBlocked));
      }
      if (manager.isAcceptedEncodingOverrideSet()) {
        warnings.push(i18nString(UIStrings.acceptedEncodingOverrideSet));
      }
      let icon: IconButton.Icon.Icon|null = null;
      if (warnings.length) {
        icon = new IconButton.Icon.Icon();
        icon.data = {iconName: 'warning-filled', color: 'var(--icon-warning)', width: '14px', height: '14px'};
        const tooltipContent = warnings.length === 1 ? warnings[0] : '· ' + warnings.join('\n· ');
        UI.Tooltip.Tooltip.install(icon, tooltipContent);
      }
      UI.InspectorView.InspectorView.instance().setPanelIcon('network', icon);
    }
  }
}
