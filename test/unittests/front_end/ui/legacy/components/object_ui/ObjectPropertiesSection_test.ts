// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Root from '../../../../../../../front_end/core/root/root.js';
import * as SDK from '../../../../../../../front_end/core/sdk/sdk.js';
import * as ObjectUI from '../../../../../../../front_end/ui/legacy/components/object_ui/object_ui.js';
import * as UI from '../../../../../../../front_end/ui/legacy/legacy.js';

import {assertNotNullOrUndefined} from '../../../../../../../front_end/core/platform/platform.js';
import {dispatchClickEvent} from '../../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../../helpers/EnvironmentHelpers.js';
import {someMutations} from '../../../../helpers/MutationHelpers.js';
import {describeWithRealConnection, getExecutionContext} from '../../../../helpers/RealConnection.js';
import {TestRevealer} from '../../../../helpers/RevealerHelpers.js';

describeWithRealConnection('ObjectPropertiesSection', () => {
  async function setupTreeOutline(
      code: string, accessorPropertiesOnly: boolean, generatePreview: boolean, nonIndexedPropertiesOnly?: boolean) {
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const target = targetManager.rootTarget();
    assertNotNullOrUndefined(target);
    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
    assertNotNullOrUndefined(runtimeModel);
    const executionContext = await getExecutionContext(runtimeModel);
    UI.Context.Context.instance().setFlavor(SDK.RuntimeModel.ExecutionContext, executionContext);

    const {result} = await ObjectUI.JavaScriptREPL.JavaScriptREPL.evaluateAndBuildPreview(
        code, false /* throwOnSideEffect */, true /* replMode */, 500 /* timeout */);
    if (!(result && 'object' in result && result.object)) {
      throw new Error('Cannot evaluate test object');
    }
    const {properties} =
        await result.object.getAllProperties(accessorPropertiesOnly, generatePreview, nonIndexedPropertiesOnly);

    assertNotNullOrUndefined(properties);
    const treeOutline = new ObjectUI.ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline({readOnly: true});
    ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement.populateWithProperties(
        treeOutline.rootElement(), properties, null, true /* skipProto */, false /* skipGettersAndSetters */,
        result.object);

    return treeOutline;
  }

  it('can reveal private accessor values', async () => {
    const VALUE = '42';
    const treeOutline = await setupTreeOutline(
        `(() => {
           class A {
             get #bar() { return ${VALUE}; }
           };
           return new A();
         })()`,
        true, false);

    const propertiesSection =
        treeOutline.rootElement().firstChild() as ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement;

    propertiesSection.update();

    const calculateValueButton =
        propertiesSection.valueElement.querySelector('.object-value-calculate-value-button') as HTMLElement;
    assertNotNullOrUndefined(calculateValueButton);
    const mutations = someMutations(propertiesSection.listItemElement);
    calculateValueButton.click();
    await mutations;

    assert.strictEqual(VALUE, propertiesSection.valueElement.innerHTML);
  });

  // Flaky / Blocking tree
  it.skip('[crbug.com/1442599] visually distinguishes important DOM properties for checkbox inputs', async () => {
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.IMPORTANT_DOM_PROPERTIES);
    const treeOutline = await setupTreeOutline(
        `(() => {
           const input = document.createElement('input');
           input.type = 'checkbox';
           return input;
         })()`,
        false, false);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[data-webidl="true"]');
    const expected = new Set<string>([
      'checked: false',
      'required: false',
      'type: "checkbox"',
      'value: "on"',
    ]);
    const notExpected = new Set<string>([
      'accept: ""',
      'files: FileList',
      'multiple: false',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
      if (textContent && notExpected.has(textContent)) {
        notExpected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
    assert.strictEqual(notExpected.size, 3, 'Unexpected properties were found');
  });

  // Flaky / Blocking tree
  it.skip('[crbug.com/1442599] visually distinguishes important DOM properties for file inputs', async () => {
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.IMPORTANT_DOM_PROPERTIES);
    const treeOutline = await setupTreeOutline(
        `(() => {
           const input = document.createElement('input');
           input.type = 'file';
           return input;
         })()`,
        false, false);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[data-webidl="true"]');
    const notExpected = new Set<string>([
      'checked: false',
      'type: "checkbox"',
      'value: "on"',
    ]);
    const expected = new Set<string>([
      'accept: ""',
      'files: FileList',
      'multiple: false',
      'required: false',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
      if (textContent && notExpected.has(textContent)) {
        notExpected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
    assert.strictEqual(notExpected.size, 3, 'Unexpected properties were found');
  });

  // Flaky / Blocking tree
  it.skip('[crbug.com/1442599] visually distinguishes important DOM properties for anchors', async () => {
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.IMPORTANT_DOM_PROPERTIES);
    const treeOutline = await setupTreeOutline(
        `(() => {
           const a = document.createElement('a');
           a.href = 'https://www.google.com:1234/foo/bar/baz?hello=world#what';
           const code = document.createElement('code');
           code.innerHTML = 'hello world';
           a.append(code);
           return a;
         })()`,
        false, false);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[data-webidl="true"]');
    const expected = new Set<string>([
      // https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element
      'text: "hello world"',
      // https://html.spec.whatwg.org/multipage/links.html#htmlhyperlinkelementutils
      'href: "https://www.google.com:1234/foo/bar/baz?hello=world#what"',
      'origin: "https://www.google.com:1234"',
      'protocol: "https:"',
      'hostname: "www.google.com"',
      'port: "1234"',
      'pathname: "/foo/bar/baz"',
      'search: "?hello=world"',
      'hash: "#what"',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
  });

  // Flaky
  it.skip('[crbug.com/1408761] visually distinguishes important DOM properties for the window object', async () => {
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.IMPORTANT_DOM_PROPERTIES);
    const treeOutline = await setupTreeOutline(
        `(() => {
           return window;
         })()`,
        false, false);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[data-webidl="true"]');
    const expected = new Set<string>([
      'customElements: CustomElementRegistry',
      'document: document',
      'frames: Window',
      'history: History',
      'location: Location',
      'navigator: Navigator',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
  });
});

describeWithEnvironment('ObjectPropertiesSection', () => {
  describe('ObjectPropertiesSection', () => {
    describe('appendMemoryIcon', () => {
      it('appends a memory icon for inspectable object types', () => {
        const object = sinon.createStubInstance(SDK.RemoteObject.RemoteObject);
        object.isLinearMemoryInspectable.returns(true);

        const div = document.createElement('div');
        assert.isFalse(div.hasChildNodes());
        ObjectUI.ObjectPropertiesSection.ObjectPropertiesSection.appendMemoryIcon(div, object);
        assert.isTrue(div.hasChildNodes());
        const icon = div.querySelector('devtools-icon');
        assert.isNotNull(icon);
      });

      it('doesn\'t append a memory icon for non-inspectable object types', () => {
        const object = sinon.createStubInstance(SDK.RemoteObject.RemoteObject);
        object.isLinearMemoryInspectable.returns(false);

        const div = document.createElement('div');
        assert.isFalse(div.hasChildNodes());
        ObjectUI.ObjectPropertiesSection.ObjectPropertiesSection.appendMemoryIcon(div, object);
        assert.isFalse(div.hasChildNodes());
      });

      it('triggers the correct revealer upon \'click\'', () => {
        const object = sinon.createStubInstance(SDK.RemoteObject.RemoteObject);
        object.isLinearMemoryInspectable.returns(true);
        const expression = 'foo';

        const div = document.createElement('div');
        ObjectUI.ObjectPropertiesSection.ObjectPropertiesSection.appendMemoryIcon(div, object, expression);
        const icon = div.querySelector('devtools-icon');
        assertNotNullOrUndefined(icon);
        const reveal = sinon.spy();
        TestRevealer.install(reveal);
        try {
          dispatchClickEvent(icon);

          sinon.assert.calledOnceWithMatch(reveal, sinon.match({object, expression}));
        } finally {
          TestRevealer.reset();
        }
      });
    });
  });
});
