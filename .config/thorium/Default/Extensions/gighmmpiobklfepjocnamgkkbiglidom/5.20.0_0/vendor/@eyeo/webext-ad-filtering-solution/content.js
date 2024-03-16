/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./core/lib/common.js":
/*!****************************!*\
  !*** ./core/lib/common.js ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

/** @module */



let textToRegExp =
/**
 * Converts raw text into a regular expression string
 * @param {string} text the string to convert
 * @return {string} regular expression representation of the text
 * @package
 */
exports.textToRegExp = text => text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const regexpRegexp = /^\/(.*)\/([imu]*)$/;

/**
 * Make a regular expression from a text argument.
 *
 * If it can be parsed as a regular expression, parse it and the flags.
 *
 * @param {string} text the text argument.
 *
 * @return {?RegExp} a RegExp object or null in case of error.
 */
exports.makeRegExpParameter = function makeRegExpParameter(text) {
  let [, source, flags] = regexpRegexp.exec(text) || [null, textToRegExp(text)];

  try {
    return new RegExp(source, flags);
  }
  catch (e) {
    return null;
  }
};

let splitSelector = exports.splitSelector = function splitSelector(selector) {
  if (!selector.includes(",")) {
    return [selector];
  }

  let selectors = [];
  let start = 0;
  let level = 0;
  let sep = "";

  for (let i = 0; i < selector.length; i++) {
    let chr = selector[i];

    // ignore escaped characters
    if (chr == "\\") {
      i++;
    }
    // don't split within quoted text
    else if (chr == sep) {
      sep = "";             // e.g. [attr=","]
    }
    else if (sep == "") {
      if (chr == '"' || chr == "'") {
        sep = chr;
      }
      // don't split between parentheses
      else if (chr == "(") {
        level++;            // e.g. :matches(div,span)
      }
      else if (chr == ")") {
        level = Math.max(0, level - 1);
      }
      else if (chr == "," && level == 0) {
        selectors.push(selector.substring(start, i));
        start = i + 1;
      }
    }
  }

  selectors.push(selector.substring(start));
  return selectors;
};

function findTargetSelectorIndex(selector) {
  let index = 0;
  let whitespace = 0;
  let scope = [];

  // Start from the end of the string and go character by character, where each
  // character is a Unicode code point.
  for (let character of [...selector].reverse()) {
    let currentScope = scope[scope.length - 1];

    if (character == "'" || character == "\"") {
      // If we're already within the same type of quote, close the scope;
      // otherwise open a new scope.
      if (currentScope == character) {
        scope.pop();
      }
      else {
        scope.push(character);
      }
    }
    else if (character == "]" || character == ")") {
      // For closing brackets and parentheses, open a new scope only if we're
      // not within a quote. Within quotes these characters should have no
      // meaning.
      if (currentScope != "'" && currentScope != "\"") {
        scope.push(character);
      }
    }
    else if (character == "[") {
      // If we're already within a bracket, close the scope.
      if (currentScope == "]") {
        scope.pop();
      }
    }
    else if (character == "(") {
      // If we're already within a parenthesis, close the scope.
      if (currentScope == ")") {
        scope.pop();
      }
    }
    else if (!currentScope) {
      // At the top level (not within any scope), count the whitespace if we've
      // encountered it. Otherwise if we've hit one of the combinators,
      // terminate here; otherwise if we've hit a non-colon character,
      // terminate here.
      if (/\s/.test(character)) {
        whitespace++;
      }
      else if ((character == ">" || character == "+" || character == "~") ||
               (whitespace > 0 && character != ":")) {
        break;
      }
    }

    // Zero out the whitespace count if we've entered a scope.
    if (scope.length > 0) {
      whitespace = 0;
    }

    // Increment the index by the size of the character. Note that for Unicode
    // composite characters (like emoji) this will be more than one.
    index += character.length;
  }

  return selector.length - index + whitespace;
}

/**
 * Qualifies a CSS selector with a qualifier, which may be another CSS selector
 * or an empty string. For example, given the selector "div.bar" and the
 * qualifier "#foo", this function returns "div#foo.bar".
 * @param {string} selector The selector to qualify.
 * @param {string} qualifier The qualifier with which to qualify the selector.
 * @returns {string} The qualified selector.
 * @package
 */
exports.qualifySelector = function qualifySelector(selector, qualifier) {
  let qualifiedSelector = "";

  let qualifierTargetSelectorIndex = findTargetSelectorIndex(qualifier);
  let [, qualifierType = ""] =
    /^([a-z][a-z-]*)?/i.exec(qualifier.substring(qualifierTargetSelectorIndex));

  for (let sub of splitSelector(selector)) {
    sub = sub.trim();

    qualifiedSelector += ", ";

    let index = findTargetSelectorIndex(sub);

    // Note that the first group in the regular expression is optional. If it
    // doesn't match (e.g. "#foo::nth-child(1)"), type will be an empty string.
    let [, type = "", rest] =
      /^([a-z][a-z-]*)?\*?(.*)/i.exec(sub.substring(index));

    if (type == qualifierType) {
      type = "";
    }

    // If the qualifier ends in a combinator (e.g. "body #foo>"), we put the
    // type and the rest of the selector after the qualifier
    // (e.g. "body #foo>div.bar"); otherwise (e.g. "body #foo") we merge the
    // type into the qualifier (e.g. "body div#foo.bar").
    if (/[\s>+~]$/.test(qualifier)) {
      qualifiedSelector += sub.substring(0, index) + qualifier + type + rest;
    }
    else {
      qualifiedSelector += sub.substring(0, index) + type + qualifier + rest;
    }
  }

  // Remove the initial comma and space.
  return qualifiedSelector.substring(2);
};


/***/ }),

/***/ "./core/lib/content/elemHideEmulation.js":
/*!***********************************************!*\
  !*** ./core/lib/content/elemHideEmulation.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

/** @module */



const {makeRegExpParameter, splitSelector,
       qualifySelector} = __webpack_require__(/*! ../common */ "./core/lib/common.js");
const {filterToRegExp} = __webpack_require__(/*! ../patterns */ "./core/lib/patterns.js");

const DEFAULT_MIN_INVOCATION_INTERVAL = 3000;
let minInvocationInterval = DEFAULT_MIN_INVOCATION_INTERVAL;
const DEFAULT_MAX_SYCHRONOUS_PROCESSING_TIME = 50;
let maxSynchronousProcessingTime = DEFAULT_MAX_SYCHRONOUS_PROCESSING_TIME;

let abpSelectorRegexp = /:(-abp-[\w-]+|has|has-text|xpath|not)\(/;

let testInfo = null;

function toCSSStyleDeclaration(value) {
  return Object.assign(document.createElement("test"), {style: value}).style;
}

/**
 * Enables test mode, which tracks additional metadata about the inner
 * workings for test purposes. This also allows overriding internal
 * configuration.
 *
 * @param {object} options
 * @param {number} options.minInvocationInterval Overrides how long
 *   must be waited between filter processing runs
 * @param {number} options.maxSynchronousProcessingTime Overrides how
 *   long the thread may spend processing filters before it must yield
 *   its thread
 */
exports.setTestMode = function setTestMode(options) {
  if (typeof options.minInvocationInterval !== "undefined") {
    minInvocationInterval = options.minInvocationInterval;
  }
  if (typeof options.maxSynchronousProcessingTime !== "undefined") {
    maxSynchronousProcessingTime = options.maxSynchronousProcessingTime;
  }

  testInfo = {
    lastProcessedElements: new Set(),
    failedAssertions: []
  };
};

exports.getTestInfo = function getTestInfo() {
  return testInfo;
};

exports.clearTestMode = function() {
  minInvocationInterval = DEFAULT_MIN_INVOCATION_INTERVAL;
  maxSynchronousProcessingTime = DEFAULT_MAX_SYCHRONOUS_PROCESSING_TIME;
  testInfo = null;
};

/**
 * Creates a new IdleDeadline.
 *
 * Note: This function is synchronous and does NOT request an idle
 * callback.
 *
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline}.
 * @return {IdleDeadline}
 */
function newIdleDeadline() {
  let startTime = performance.now();
  return {
    didTimeout: false,
    timeRemaining() {
      let elapsed = performance.now() - startTime;
      let remaining = maxSynchronousProcessingTime - elapsed;
      return Math.max(0, remaining);
    }
  };
}

/**
 * Returns a promise that is resolved when the browser is next idle.
 *
 * This is intended to be used for long running tasks on the UI thread
 * to allow other UI events to process.
 *
 * @return {Promise.<IdleDeadline>}
 *    A promise that is fulfilled when you can continue processing
 */
function yieldThread() {
  return new Promise(resolve => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(resolve);
    }
    else {
      setTimeout(() => {
        resolve(newIdleDeadline());
      }, 0);
    }
  });
}


function getCachedPropertyValue(object, name, defaultValueFunc = () => {}) {
  let value = object[name];
  if (typeof value == "undefined") {
    Object.defineProperty(object, name, {value: value = defaultValueFunc()});
  }
  return value;
}

/**
 * Return position of node from parent.
 * @param {Node} node the node to find the position of.
 * @return {number} One-based index like for :nth-child(), or 0 on error.
 */
function positionInParent(node) {
  let index = 0;
  for (let child of node.parentNode.children) {
    if (child == node) {
      return index + 1;
    }

    index++;
  }

  return 0;
}

function makeSelector(node, selector = "") {
  if (node == null) {
    return null;
  }
  if (!node.parentElement) {
    let newSelector = ":root";
    if (selector) {
      newSelector += " > " + selector;
    }
    return newSelector;
  }
  let idx = positionInParent(node);
  if (idx > 0) {
    let newSelector = `${node.tagName}:nth-child(${idx})`;
    if (selector) {
      newSelector += " > " + selector;
    }
    return makeSelector(node.parentElement, newSelector);
  }

  return selector;
}

function parseSelectorContent(content, startIndex) {
  let parens = 1;
  let quote = null;
  let i = startIndex;
  for (; i < content.length; i++) {
    let c = content[i];
    if (c == "\\") {
      // Ignore escaped characters
      i++;
    }
    else if (quote) {
      if (c == quote) {
        quote = null;
      }
    }
    else if (c == "'" || c == '"') {
      quote = c;
    }
    else if (c == "(") {
      parens++;
    }
    else if (c == ")") {
      parens--;
      if (parens == 0) {
        break;
      }
    }
  }

  if (parens > 0) {
    return null;
  }
  return {text: content.substring(startIndex, i), end: i};
}

/**
 * Stringified style objects
 * @typedef {Object} StringifiedStyle
 * @property {string} style CSS style represented by a string.
 * @property {string[]} subSelectors selectors the CSS properties apply to.
 */

/**
 * Produce a string representation of the stylesheet entry.
 * @param {CSSStyleRule} rule the CSS style rule.
 * @return {StringifiedStyle} the stringified style.
 */
function stringifyStyle(rule) {
  let styles = [];
  for (let i = 0; i < rule.style.length; i++) {
    let property = rule.style.item(i);
    let value = rule.style.getPropertyValue(property);
    let priority = rule.style.getPropertyPriority(property);
    styles.push(`${property}: ${value}${priority ? " !" + priority : ""};`);
  }
  styles.sort();
  return {
    style: styles.join(" "),
    subSelectors: splitSelector(rule.selectorText)
  };
}

let scopeSupported = null;

function tryQuerySelector(subtree, selector, all) {
  let elements = null;
  try {
    elements = all ? subtree.querySelectorAll(selector) :
      subtree.querySelector(selector);
    scopeSupported = true;
  }
  catch (e) {
    // Edge doesn't support ":scope"
    scopeSupported = false;
  }
  return elements;
}

/**
 * Query selector.
 *
 * If it is relative, will try :scope.
 *
 * @param {Node} subtree the element to query selector
 * @param {string} selector the selector to query
 * @param {bool} [all=false] true to perform querySelectorAll()
 *
 * @returns {?(Node|NodeList)} result of the query. null in case of error.
 */
function scopedQuerySelector(subtree, selector, all) {
  if (selector[0] == ">") {
    selector = ":scope" + selector;
    if (scopeSupported) {
      return all ? subtree.querySelectorAll(selector) :
        subtree.querySelector(selector);
    }
    if (scopeSupported == null) {
      return tryQuerySelector(subtree, selector, all);
    }
    return null;
  }
  return all ? subtree.querySelectorAll(selector) :
    subtree.querySelector(selector);
}

function scopedQuerySelectorAll(subtree, selector) {
  return scopedQuerySelector(subtree, selector, true);
}

class PlainSelector {
  constructor(selector) {
    this._selector = selector;
    this.maybeDependsOnAttributes = /[#.:]|\[.+\]/.test(selector);
    this.maybeContainsSiblingCombinators = /[~+]/.test(selector);
  }

  /**
   * Generator function returning a pair of selector string and subtree.
   * @param {string} prefix the prefix for the selector.
   * @param {Node} subtree the subtree we work on.
   * @param {Node[]} [targets] the nodes we are interested in.
   */
  *getSelectors(prefix, subtree, targets) {
    yield [prefix + this._selector, subtree];
  }
}

const incompletePrefixRegexp = /[\s>+~]$/;

class NotSelector {
  constructor(selectors) {
    this._innerPattern = new Pattern(selectors);
  }

  get dependsOnStyles() {
    return this._innerPattern.dependsOnStyles;
  }

  get dependsOnCharacterData() {
    return this._innerPattern.dependsOnCharacterData;
  }

  get maybeDependsOnAttributes() {
    return this._innerPattern.maybeDependsOnAttributes;
  }

  *getSelectors(prefix, subtree, targets) {
    for (let element of this.getElements(prefix, subtree, targets)) {
      yield [makeSelector(element), element];
    }
  }

  /**
   * Generator function returning selected elements.
   * @param {string} prefix the prefix for the selector.
   * @param {Node} subtree the subtree we work on.
   * @param {Node[]} [targets] the nodes we are interested in.
   */
  *getElements(prefix, subtree, targets) {
    let actualPrefix = (!prefix || incompletePrefixRegexp.test(prefix)) ?
      prefix + "*" : prefix;
    let elements = scopedQuerySelectorAll(subtree, actualPrefix);
    if (elements) {
      for (let element of elements) {
        // If the element is neither an ancestor nor a descendant of one of the
        // targets, we can skip it.
        if (targets && !targets.some(target => element.contains(target) ||
                                               target.contains(element))) {
          yield null;
          continue;
        }

        if (testInfo) {
          testInfo.lastProcessedElements.add(element);
        }

        if (!this._innerPattern.matches(element, subtree)) {
          yield element;
        }

        yield null;
      }
    }
  }

  setStyles(styles) {
    this._innerPattern.setStyles(styles);
  }
}

class HasSelector {
  constructor(selectors) {
    this._innerPattern = new Pattern(selectors);
  }

  get dependsOnStyles() {
    return this._innerPattern.dependsOnStyles;
  }

  get dependsOnCharacterData() {
    return this._innerPattern.dependsOnCharacterData;
  }

  get maybeDependsOnAttributes() {
    return this._innerPattern.maybeDependsOnAttributes;
  }

  *getSelectors(prefix, subtree, targets) {
    for (let element of this.getElements(prefix, subtree, targets)) {
      yield [makeSelector(element), element];
    }
  }

  /**
   * Generator function returning selected elements.
   * @param {string} prefix the prefix for the selector.
   * @param {Node} subtree the subtree we work on.
   * @param {Node[]} [targets] the nodes we are interested in.
   */
  *getElements(prefix, subtree, targets) {
    let actualPrefix = (!prefix || incompletePrefixRegexp.test(prefix)) ?
      prefix + "*" : prefix;
    let elements = scopedQuerySelectorAll(subtree, actualPrefix);
    if (elements) {
      for (let element of elements) {
        // If the element is neither an ancestor nor a descendant of one of the
        // targets, we can skip it.
        if (targets && !targets.some(target => element.contains(target) ||
                                               target.contains(element))) {
          yield null;
          continue;
        }

        if (testInfo) {
          testInfo.lastProcessedElements.add(element);
        }

        for (let selector of this._innerPattern.evaluate(element, targets)) {
          if (selector == null) {
            yield null;
          }
          else if (scopedQuerySelector(element, selector)) {
            yield element;
          }
        }

        yield null;
      }
    }
  }

  setStyles(styles) {
    this._innerPattern.setStyles(styles);
  }
}

class XPathSelector {
  constructor(textContent) {
    this.dependsOnCharacterData = true;
    this.maybeDependsOnAttributes = true;

    let evaluator = new XPathEvaluator();
    this._expression = evaluator.createExpression(textContent, null);
  }

  *getSelectors(prefix, subtree, targets) {
    for (let element of this.getElements(prefix, subtree, targets)) {
      yield [makeSelector(element), element];
    }
  }

  *getElements(prefix, subtree, targets) {
    let {ORDERED_NODE_SNAPSHOT_TYPE: flag} = XPathResult;
    let elements = prefix ? scopedQuerySelectorAll(subtree, prefix) : [subtree];
    for (let parent of elements) {
      let result = this._expression.evaluate(parent, flag, null);
      for (let i = 0, {snapshotLength} = result; i < snapshotLength; i++) {
        yield result.snapshotItem(i);
      }
    }
  }
}

class ContainsSelector {
  constructor(textContent) {
    this.dependsOnCharacterData = true;

    this._regexp = makeRegExpParameter(textContent);
  }

  *getSelectors(prefix, subtree, targets) {
    for (let element of this.getElements(prefix, subtree, targets)) {
      yield [makeSelector(element), subtree];
    }
  }

  *getElements(prefix, subtree, targets) {
    let actualPrefix = (!prefix || incompletePrefixRegexp.test(prefix)) ?
      prefix + "*" : prefix;

    let elements = scopedQuerySelectorAll(subtree, actualPrefix);

    if (elements) {
      let lastRoot = null;
      for (let element of elements) {
        // For a filter like div:-abp-contains(Hello) and a subtree like
        // <div id="a"><div id="b"><div id="c">Hello</div></div></div>
        // we're only interested in div#a
        if (lastRoot && lastRoot.contains(element)) {
          yield null;
          continue;
        }

        lastRoot = element;

        if (targets && !targets.some(target => element.contains(target) ||
                                               target.contains(element))) {
          yield null;
          continue;
        }

        if (testInfo) {
          testInfo.lastProcessedElements.add(element);
        }

        if (this._regexp && this._regexp.test(element.textContent)) {
          yield element;
        }
        else {
          yield null;
        }
      }
    }
  }
}

class PropsSelector {
  constructor(propertyExpression) {
    this.dependsOnStyles = true;
    this.maybeDependsOnAttributes = true;

    let regexpString;
    if (propertyExpression.length >= 2 && propertyExpression[0] == "/" &&
        propertyExpression[propertyExpression.length - 1] == "/") {
      regexpString = propertyExpression.slice(1, -1);
    }
    else {
      regexpString = filterToRegExp(propertyExpression);
    }

    this._regexp = new RegExp(regexpString, "i");

    this._subSelectors = [];
  }

  *getSelectors(prefix, subtree, targets) {
    for (let subSelector of this._subSelectors) {
      if (subSelector.startsWith("*") &&
          !incompletePrefixRegexp.test(prefix)) {
        subSelector = subSelector.substring(1);
      }

      yield [qualifySelector(subSelector, prefix), subtree];
    }
  }

  setStyles(styles) {
    this._subSelectors = [];
    for (let style of styles) {
      if (this._regexp.test(style.style)) {
        for (let subSelector of style.subSelectors) {
          let idx = subSelector.lastIndexOf("::");
          if (idx != -1) {
            subSelector = subSelector.substring(0, idx);
          }

          this._subSelectors.push(subSelector);
        }
      }
    }
  }
}

class Pattern {
  constructor(selectors, text) {
    this.selectors = selectors;
    this.text = text;
  }

  get dependsOnStyles() {
    return getCachedPropertyValue(
      this, "_dependsOnStyles", () => this.selectors.some(
        selector => selector.dependsOnStyles
      )
    );
  }

  get maybeDependsOnAttributes() {
    // Observe changes to attributes if either there's a plain selector that
    // looks like an ID selector, class selector, or attribute selector in one
    // of the patterns (e.g. "a[href='https://example.com/']")
    // or there's a properties selector nested inside a has selector
    // (e.g. "div:-abp-has(:-abp-properties(color: blue))")
    return getCachedPropertyValue(
      this, "_maybeDependsOnAttributes", () => this.selectors.some(
        selector => selector.maybeDependsOnAttributes ||
                    (selector instanceof HasSelector &&
                     selector.dependsOnStyles)
      )
    );
  }

  get dependsOnCharacterData() {
    // Observe changes to character data only if there's a contains selector in
    // one of the patterns.
    return getCachedPropertyValue(
      this, "_dependsOnCharacterData", () => this.selectors.some(
        selector => selector.dependsOnCharacterData
      )
    );
  }

  get maybeContainsSiblingCombinators() {
    return getCachedPropertyValue(
      this, "_maybeContainsSiblingCombinators", () => this.selectors.some(
        selector => selector.maybeContainsSiblingCombinators
      )
    );
  }

  matchesMutationTypes(mutationTypes) {
    let mutationTypeMatchMap = getCachedPropertyValue(
      this, "_mutationTypeMatchMap", () => new Map([
        // All types of DOM-dependent patterns are affected by mutations of
        // type "childList".
        ["childList", true],
        ["attributes", this.maybeDependsOnAttributes],
        ["characterData", this.dependsOnCharacterData]
      ])
    );

    for (let mutationType of mutationTypes) {
      if (mutationTypeMatchMap.get(mutationType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generator function returning CSS selectors for all elements that
   * match the pattern.
   *
   * This allows transforming from selectors that may contain custom
   * :-abp- selectors to pure CSS selectors that can be used to select
   * elements.
   *
   * The selectors returned from this function may be invalidated by DOM
   * mutations.
   *
   * @param {Node} subtree the subtree we work on
   * @param {Node[]} [targets] the nodes we are interested in. May be
   * used to optimize search.
   */
  *evaluate(subtree, targets) {
    let selectors = this.selectors;
    function* evaluateInner(index, prefix, currentSubtree) {
      if (index >= selectors.length) {
        yield prefix;
        return;
      }
      for (let [selector, element] of selectors[index].getSelectors(
        prefix, currentSubtree, targets
      )) {
        if (selector == null) {
          yield null;
        }
        else {
          yield* evaluateInner(index + 1, selector, element);
        }
      }
      // Just in case the getSelectors() generator above had to run some heavy
      // document.querySelectorAll() call which didn't produce any results, make
      // sure there is at least one point where execution can pause.
      yield null;
    }
    yield* evaluateInner(0, "", subtree);
  }

  /**
   * Checks if a pattern matches a specific element
   * @param {Node} [target] the element we're interested in checking for
   * matches on.
   * @param {Node} subtree the subtree we work on
   * @return {bool}
   */
  matches(target, subtree) {
    let targetFilter = [target];
    if (this.maybeContainsSiblingCombinators) {
      targetFilter = null;
    }

    let selectorGenerator = this.evaluate(subtree, targetFilter);
    for (let selector of selectorGenerator) {
      if (selector && target.matches(selector)) {
        return true;
      }
    }
    return false;
  }

  setStyles(styles) {
    for (let selector of this.selectors) {
      if (selector.dependsOnStyles) {
        selector.setStyles(styles);
      }
    }
  }
}

function extractMutationTypes(mutations) {
  let types = new Set();

  for (let mutation of mutations) {
    types.add(mutation.type);

    // There are only 3 types of mutations: "attributes", "characterData", and
    // "childList".
    if (types.size == 3) {
      break;
    }
  }

  return types;
}

function extractMutationTargets(mutations) {
  if (!mutations) {
    return null;
  }

  let targets = new Set();

  for (let mutation of mutations) {
    if (mutation.type == "childList") {
      // When new nodes are added, we're interested in the added nodes rather
      // than the parent.
      for (let node of mutation.addedNodes) {
        targets.add(node);
      }
      if (mutation.removedNodes.length > 0) {
        targets.add(mutation.target);
      }
    }
    else {
      targets.add(mutation.target);
    }
  }

  return [...targets];
}

function filterPatterns(patterns, {stylesheets, mutations}) {
  if (!stylesheets && !mutations) {
    return patterns.slice();
  }

  let mutationTypes = mutations ? extractMutationTypes(mutations) : null;

  return patterns.filter(
    pattern => (stylesheets && pattern.dependsOnStyles) ||
               (mutations && pattern.matchesMutationTypes(mutationTypes))
  );
}

function shouldObserveAttributes(patterns) {
  return patterns.some(pattern => pattern.maybeDependsOnAttributes);
}

function shouldObserveCharacterData(patterns) {
  return patterns.some(pattern => pattern.dependsOnCharacterData);
}

function shouldObserveStyles(patterns) {
  return patterns.some(pattern => pattern.dependsOnStyles);
}

/**
 * @callback hideElemsFunc
 * @param {Node[]} elements Elements on the page that should be hidden
 * @param {string[]} elementFilters
 *   The filter text that caused the elements to be hidden
 */

/**
 * @callback unhideElemsFunc
 * @param {Node[]} elements Elements on the page that should be hidden
 */


/**
 * Manages the front-end processing of element hiding emulation filters.
 */
exports.ElemHideEmulation = class ElemHideEmulation {
  /**
   * @param {module:content/elemHideEmulation~hideElemsFunc} hideElemsFunc
   *   A callback that should be provided to do the actual element hiding.
   * @param {module:content/elemHideEmulation~unhideElemsFunc} unhideElemsFunc
   *   A callback that should be provided to unhide previously hidden elements.
   */
  constructor(hideElemsFunc = () => {}, unhideElemsFunc = () => {}) {
    this._filteringInProgress = false;
    this._nextFilteringScheduled = false;
    this._lastInvocation = -minInvocationInterval;
    this._scheduledProcessing = null;

    this.document = document;
    this.hideElemsFunc = hideElemsFunc;
    this.unhideElemsFunc = unhideElemsFunc;
    this.observer = new MutationObserver(this.observe.bind(this));
    this.hiddenElements = new Map();
  }

  isSameOrigin(stylesheet) {
    try {
      return new URL(stylesheet.href).origin == this.document.location.origin;
    }
    catch (e) {
      // Invalid URL, assume that it is first-party.
      return true;
    }
  }

  /**
   * Parse the selector
   * @param {string} selector the selector to parse
   * @return {Array} selectors is an array of objects,
   * or null in case of errors.
   */
  parseSelector(selector) {
    if (selector.length == 0) {
      return [];
    }

    let match = abpSelectorRegexp.exec(selector);
    if (!match) {
      return [new PlainSelector(selector)];
    }

    let selectors = [];
    if (match.index > 0) {
      selectors.push(new PlainSelector(selector.substring(0, match.index)));
    }

    let startIndex = match.index + match[0].length;
    let content = parseSelectorContent(selector, startIndex);
    if (!content) {
      console.warn(new SyntaxError("Failed to parse Adblock Plus " +
                                   `selector ${selector} ` +
                                   "due to unmatched parentheses."));
      return null;
    }
    if (match[1] == "-abp-properties") {
      selectors.push(new PropsSelector(content.text));
    }
    else if (match[1] == "-abp-has" || match[1] == "has") {
      let hasSelectors = this.parseSelector(content.text);
      if (hasSelectors == null) {
        return null;
      }
      selectors.push(new HasSelector(hasSelectors));
    }
    else if (match[1] == "-abp-contains" || match[1] == "has-text") {
      selectors.push(new ContainsSelector(content.text));
    }
    else if (match[1] === "xpath") {
      try {
        selectors.push(new XPathSelector(content.text));
      }
      catch ({message}) {
        console.warn(
          new SyntaxError(
            "Failed to parse Adblock Plus " +
            `selector ${selector}, invalid ` +
            `xpath: ${content.text} ` +
            `error: ${message}.`
          )
        );

        return null;
      }
    }
    else if (match[1] == "not") {
      let notSelectors = this.parseSelector(content.text);
      if (notSelectors == null) {
        return null;
      }

      // if all of the inner selectors are PlainSelectors, then we
      // don't actually need to use our selector at all. We're better
      // off delegating to the browser :not implementation.
      if (notSelectors.every(s => s instanceof PlainSelector)) {
        selectors.push(new PlainSelector(`:not(${content.text})`));
      }
      else {
        selectors.push(new NotSelector(notSelectors));
      }
    }
    else {
      // this is an error, can't parse selector.
      console.warn(new SyntaxError("Failed to parse Adblock Plus " +
                                   `selector ${selector}, invalid ` +
                                   `pseudo-class :${match[1]}().`));
      return null;
    }

    let suffix = this.parseSelector(selector.substring(content.end + 1));
    if (suffix == null) {
      return null;
    }

    selectors.push(...suffix);

    if (selectors.length == 1 && selectors[0] instanceof ContainsSelector) {
      console.warn(new SyntaxError("Failed to parse Adblock Plus " +
                                   `selector ${selector}, can't ` +
                                   "have a lonely :-abp-contains()."));
      return null;
    }
    return selectors;
  }

  /**
   * Reads the rules out of CSS stylesheets
   * @param {CSSStyleSheet[]} [stylesheets] The list of stylesheets to
   * read.
   * @return {CSSStyleRule[]}
   */
  _readCssRules(stylesheets) {
    let cssStyles = [];

    for (let stylesheet of stylesheets || []) {
      // Explicitly ignore third-party stylesheets to ensure consistent behavior
      // between Firefox and Chrome.
      if (!this.isSameOrigin(stylesheet)) {
        continue;
      }

      let rules;
      try {
        rules = stylesheet.cssRules;
      }
      catch (e) {
        // On Firefox, there is a chance that an InvalidAccessError
        // get thrown when accessing cssRules. Just skip the stylesheet
        // in that case.
        // See https://searchfox.org/mozilla-central/rev/f65d7528e34ef1a7665b4a1a7b7cdb1388fcd3aa/layout/style/StyleSheet.cpp#699
        continue;
      }

      if (!rules) {
        continue;
      }

      for (let rule of rules) {
        if (rule.type != rule.STYLE_RULE) {
          continue;
        }

        cssStyles.push(stringifyStyle(rule));
      }
    }
    return cssStyles;
  }

  /**
   * Processes the current document and applies all rules to it.
   * @param {CSSStyleSheet[]} [stylesheets]
   *    The list of new stylesheets that have been added to the document and
   *    made reprocessing necessary. This parameter shouldn't be passed in for
   *    the initial processing, all of document's stylesheets will be considered
   *    then and all rules, including the ones not dependent on styles.
   * @param {MutationRecord[]} [mutations]
   *    The list of DOM mutations that have been applied to the document and
   *    made reprocessing necessary. This parameter shouldn't be passed in for
   *    the initial processing, the entire document will be considered
   *    then and all rules, including the ones not dependent on the DOM.
   * @return {Promise}
   *    A promise that is fulfilled once all filtering is completed
   */
  async _addSelectors(stylesheets, mutations) {
    if (testInfo) {
      testInfo.lastProcessedElements.clear();
    }

    let deadline = newIdleDeadline();

    if (shouldObserveStyles(this.patterns)) {
      this._refreshPatternStyles();
    }

    let patternsToCheck = filterPatterns(
      this.patterns, {stylesheets, mutations}
    );

    let targets = extractMutationTargets(mutations);

    let elementsToHide = [];
    let elementFilters = [];
    let elementsToUnhide = new Set(this.hiddenElements.keys());

    for (let pattern of patternsToCheck) {
      let evaluationTargets = targets;

      // If the pattern appears to contain any sibling combinators, we can't
      // easily optimize based on the mutation targets. Since this is a
      // special case, skip the optimization. By setting it to null here we
      // make sure we process the entire DOM.
      if (pattern.maybeContainsSiblingCombinators) {
        evaluationTargets = null;
      }

      let generator = pattern.evaluate(this.document, evaluationTargets);
      for (let selector of generator) {
        if (selector != null) {
          for (let element of this.document.querySelectorAll(selector)) {
            if (!this.hiddenElements.has(element)) {
              elementsToHide.push(element);
              elementFilters.push(pattern.text);
            }
            else {
              elementsToUnhide.delete(element);
            }
          }
        }

        if (deadline.timeRemaining() <= 0) {
          deadline = await yieldThread();
        }
      }
    }
    this._hideElems(elementsToHide, elementFilters);

    // The search for elements to hide it optimized to find new things
    // to hide quickly, by not checking all patterns and not checking
    // the full DOM. That's why we need to do a more thorough check
    // for each remaining element that might need to be unhidden,
    // checking all patterns.
    for (let elem of elementsToUnhide) {
      if (!elem.isConnected) {
        // elements that are no longer in the DOM should be unhidden
        // in case they're ever readded, and then forgotten about so
        // we don't cause a memory leak.
        continue;
      }
      let matchesAny = this.patterns.some(pattern => pattern.matches(
        elem, this.document
      ));
      if (matchesAny) {
        elementsToUnhide.delete(elem);
      }

      if (deadline.timeRemaining() <= 0) {
        deadline = await yieldThread();
      }
    }
    this._unhideElems(Array.from(elementsToUnhide));
  }

  _hideElems(elementsToHide, elementFilters) {
    if (elementsToHide.length > 0) {
      this.hideElemsFunc(elementsToHide, elementFilters);
      for (let i = 0; i < elementsToHide.length; i++) {
        this.hiddenElements.set(elementsToHide[i], elementFilters[i]);
      }
    }
  }

  _unhideElems(elementsToUnhide) {
    if (elementsToUnhide.length > 0) {
      this.unhideElemsFunc(elementsToUnhide);
      for (let elem of elementsToUnhide) {
        this.hiddenElements.delete(elem);
      }
    }
  }

  /**
   * Performed any scheduled processing.
   *
   * This function is asyncronous, and should not be run multiple
   * times in parallel. The flag `_filteringInProgress` is set and
   * unset so you can check if it's already running.
   * @return {Promise}
   *  A promise that is fulfilled once all filtering is completed
   */
  async _processFiltering() {
    if (this._filteringInProgress) {
      console.warn("ElemHideEmulation scheduling error: " +
                   "Tried to process filtering in parallel.");
      if (testInfo) {
        testInfo.failedAssertions.push(
          "Tried to process filtering in parallel"
        );
      }
      return;
    }
    let params = this._scheduledProcessing || {};
    this._scheduledProcessing = null;
    this._filteringInProgress = true;
    this._nextFilteringScheduled = false;
    await this._addSelectors(
      params.stylesheets,
      params.mutations
    );
    this._lastInvocation = performance.now();
    this._filteringInProgress = false;
    if (this._scheduledProcessing) {
      this._scheduleNextFiltering();
    }
  }

  /**
   * Appends new changes to the list of filters for the next time
   * filtering is run.
   * @param {CSSStyleSheet[]} [stylesheets]
   *    new stylesheets to be processed. This parameter should be omitted
   *    for full reprocessing.
   * @param {MutationRecord[]} [mutations]
   *    new DOM mutations to be processed. This parameter should be omitted
   *    for full reprocessing.
   */
  _appendScheduledProcessing(stylesheets, mutations) {
    if (!this._scheduledProcessing) {
      // There isn't anything scheduled yet. Make the schedule.
      this._scheduledProcessing = {stylesheets, mutations};
    }
    else if (!stylesheets && !mutations) {
      // The new request was to reprocess everything, and so any
      // previous filters are irrelevant.
      this._scheduledProcessing = {};
    }
    else if (this._scheduledProcessing.stylesheets ||
             this._scheduledProcessing.mutations) {
      // The previous filters are not to filter everything, so the new
      // parameters matter. Push them onto the appropriate lists.
      if (stylesheets) {
        if (!this._scheduledProcessing.stylesheets) {
          this._scheduledProcessing.stylesheets = [];
        }
        this._scheduledProcessing.stylesheets.push(...stylesheets);
      }
      if (mutations) {
        if (!this._scheduledProcessing.mutations) {
          this._scheduledProcessing.mutations = [];
        }
        this._scheduledProcessing.mutations.push(...mutations);
      }
    }
    else {
      // this._scheduledProcessing is already going to recheck
      // everything, so no need to do anything here.
    }
  }

  /**
   * Schedule filtering to be processed in the future, or start
   * processing immediately.
   *
   * If processing is already scheduled, this does nothing.
   */
  _scheduleNextFiltering() {
    if (this._nextFilteringScheduled || this._filteringInProgress) {
      // The next one has already been scheduled. Our new events are
      // on the queue, so nothing more to do.
      return;
    }

    if (this.document.readyState === "loading") {
      // Document isn't fully loaded yet, so schedule our first
      // filtering as soon as that's done.
      this.document.addEventListener(
        "DOMContentLoaded",
        () => this._processFiltering(),
        {once: true}
      );
      this._nextFilteringScheduled = true;
    }
    else if (performance.now() - this._lastInvocation <
             minInvocationInterval) {
      // It hasn't been long enough since our last filter. Set the
      // timeout for when it's time for that.
      setTimeout(
        () => this._processFiltering(),
        minInvocationInterval - (performance.now() - this._lastInvocation)
      );
      this._nextFilteringScheduled = true;
    }
    else {
      // We can actually just start filtering immediately!
      this._processFiltering();
    }
  }

  /**
   * Re-run filtering either immediately or queued.
   * @param {CSSStyleSheet[]} [stylesheets]
   *    new stylesheets to be processed. This parameter should be omitted
   *    for full reprocessing.
   * @param {MutationRecord[]} [mutations]
   *    new DOM mutations to be processed. This parameter should be omitted
   *    for full reprocessing.
   */
  queueFiltering(stylesheets, mutations) {
    this._appendScheduledProcessing(stylesheets, mutations);
    this._scheduleNextFiltering();
  }

  _refreshPatternStyles(stylesheet) {
    let allCssRules = this._readCssRules(this.document.styleSheets);
    for (let pattern of this.patterns) {
      pattern.setStyles(allCssRules);
    }
  }

  onLoad(event) {
    let stylesheet = event.target.sheet;
    if (stylesheet) {
      this.queueFiltering([stylesheet]);
    }
  }

  observe(mutations) {
    if (testInfo) {
      // In test mode, filter out any mutations likely done by us
      // (i.e. style="display: none !important"). This makes it easier to
      // observe how the code responds to DOM mutations.
      mutations = mutations.filter(
        ({type, attributeName, target: {style: newValue}, oldValue}) =>
          !(type == "attributes" && attributeName == "style" &&
            newValue.display == "none" &&
            toCSSStyleDeclaration(oldValue).display != "none")
      );

      if (mutations.length == 0) {
        return;
      }
    }

    this.queueFiltering(null, mutations);
  }

  apply(patterns) {
    if (this.patterns) {
      let removedPatterns = [];
      for (let oldPattern of this.patterns) {
        if (!patterns.find(newPattern => newPattern.text == oldPattern.text)) {
          removedPatterns.push(oldPattern);
        }
      }
      let elementsToUnhide = [];
      for (let pattern of removedPatterns) {
        for (let [element, filter] of this.hiddenElements) {
          if (filter == pattern.text) {
            elementsToUnhide.push(element);
          }
        }
      }
      if (elementsToUnhide.length > 0) {
        this._unhideElems(elementsToUnhide);
      }
    }

    this.patterns = [];
    for (let pattern of patterns) {
      let selectors = this.parseSelector(pattern.selector);
      if (selectors != null && selectors.length > 0) {
        this.patterns.push(new Pattern(selectors, pattern.text));
      }
    }

    if (this.patterns.length > 0) {
      this.queueFiltering();

      let attributes = shouldObserveAttributes(this.patterns);
      this.observer.observe(
        this.document,
        {
          childList: true,
          attributes,
          attributeOldValue: attributes && !!testInfo,
          characterData: shouldObserveCharacterData(this.patterns),
          subtree: true
        }
      );
      if (shouldObserveStyles(this.patterns)) {
        let onLoad = this.onLoad.bind(this);
        if (this.document.readyState === "loading") {
          this.document.addEventListener("DOMContentLoaded", onLoad, true);
        }
        this.document.addEventListener("load", onLoad, true);
      }
    }
  }

  disconnect() {
    this.observer.disconnect();
    this._unhideElems(Array.from(this.hiddenElements.keys()));
  }
};


/***/ }),

/***/ "./core/lib/patterns.js":
/*!******************************!*\
  !*** ./core/lib/patterns.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

/** @module */



/**
 * The maximum number of patterns that
 * `{@link module:patterns.compilePatterns compilePatterns()}` will compile
 * into regular expressions.
 * @type {number}
 */
const COMPILE_PATTERNS_MAX = 100;

/**
 * Regular expression used to match the `^` suffix in an otherwise literal
 * pattern.
 * @type {RegExp}
 */
let separatorRegExp = /[\x00-\x24\x26-\x2C\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]/;

let filterToRegExp =
/**
 * Converts filter text into regular expression string
 * @param {string} text as in Filter()
 * @return {string} regular expression representation of filter text
 * @package
 */
exports.filterToRegExp = function filterToRegExp(text) {
  // remove multiple wildcards
  text = text.replace(/\*+/g, "*");

  // remove leading wildcard
  if (text[0] == "*") {
    text = text.substring(1);
  }

  // remove trailing wildcard
  if (text[text.length - 1] == "*") {
    text = text.substring(0, text.length - 1);
  }

  return text
    // remove anchors following separator placeholder
    .replace(/\^\|$/, "^")
    // escape special symbols
    .replace(/\W/g, "\\$&")
    // replace wildcards by .*
    .replace(/\\\*/g, ".*")
    // process separator placeholders (all ANSI characters but alphanumeric
    // characters and _%.-)
    .replace(/\\\^/g, `(?:${separatorRegExp.source}|$)`)
    // process extended anchor at expression start
    .replace(/^\\\|\\\|/, "^[\\w\\-]+:\\/+(?:[^\\/]+\\.)?")
    // process anchor at expression start
    .replace(/^\\\|/, "^")
    // process anchor at expression end
    .replace(/\\\|$/, "$");
};

/**
 * Regular expression used to match the `||` prefix in an otherwise literal
 * pattern.
 * @type {RegExp}
 */
let extendedAnchorRegExp = new RegExp(filterToRegExp("||") + "$");

/**
 * Regular expression for matching a keyword in a filter.
 * @type {RegExp}
 */
let keywordRegExp = /[^a-z0-9%*][a-z0-9%]{2,}(?=[^a-z0-9%*])/;

/**
 * Regular expression for matching all keywords in a filter.
 * @type {RegExp}
 */
let allKeywordsRegExp = new RegExp(keywordRegExp, "g");

/**
 * A `CompiledPatterns` object represents the compiled version of multiple URL
 * request patterns. It is returned by
 * `{@link module:patterns.compilePatterns compilePatterns()}`.
 */
class CompiledPatterns {
  /**
   * Creates an object with the given regular expressions for case-sensitive
   * and case-insensitive matching respectively.
   * @param {?RegExp} [caseSensitive]
   * @param {?RegExp} [caseInsensitive]
   * @private
   */
  constructor(caseSensitive, caseInsensitive) {
    this._caseSensitive = caseSensitive;
    this._caseInsensitive = caseInsensitive;
  }

  /**
   * Tests whether the given URL request matches the patterns used to create
   * this object.
   * @param {module:url.URLRequest} request
   * @returns {boolean}
   */
  test(request) {
    return ((this._caseSensitive &&
             this._caseSensitive.test(request.href)) ||
            (this._caseInsensitive &&
             this._caseInsensitive.test(request.lowerCaseHref)));
  }
}

/**
 * Compiles patterns from the given filters into a single
 * `{@link module:patterns~CompiledPatterns CompiledPatterns}` object.
 *
 * @param {module:filterClasses.URLFilter|
 *         Set.<module:filterClasses.URLFilter>} filters
 *   The filters. If the number of filters exceeds
 *   `{@link module:patterns~COMPILE_PATTERNS_MAX COMPILE_PATTERNS_MAX}`, the
 *   function returns `null`.
 *
 * @returns {?module:patterns~CompiledPatterns}
 *
 * @package
 */
exports.compilePatterns = function compilePatterns(filters) {
  let list = Array.isArray(filters) ? filters : [filters];

  // If the number of filters is too large, it may choke especially on low-end
  // platforms. As a precaution, we refuse to compile. Ideally we would check
  // the length of the regular expression source rather than the number of
  // filters, but this is far more straightforward and practical.
  if (list.length > COMPILE_PATTERNS_MAX) {
    return null;
  }

  let caseSensitive = "";
  let caseInsensitive = "";

  for (let filter of filters) {
    let source = filter.urlPattern.regexpSource;

    if (filter.matchCase) {
      caseSensitive += source + "|";
    }
    else {
      caseInsensitive += source + "|";
    }
  }

  let caseSensitiveRegExp = null;
  let caseInsensitiveRegExp = null;

  try {
    if (caseSensitive) {
      caseSensitiveRegExp = new RegExp(caseSensitive.slice(0, -1));
    }

    if (caseInsensitive) {
      caseInsensitiveRegExp = new RegExp(caseInsensitive.slice(0, -1));
    }
  }
  catch (error) {
    // It is possible in theory for the regular expression to be too large
    // despite COMPILE_PATTERNS_MAX
    return null;
  }

  return new CompiledPatterns(caseSensitiveRegExp, caseInsensitiveRegExp);
};

/**
 * Patterns for matching against URLs.
 *
 * Internally, this may be a RegExp or match directly against the
 * pattern for simple literal patterns.
 */
exports.Pattern = class Pattern {
  /**
   * @param {string} pattern pattern that requests URLs should be
   * matched against in filter text notation
   * @param {bool} matchCase `true` if comparisons must be case
   * sensitive
   */
  constructor(pattern, matchCase) {
    this.matchCase = matchCase || false;

    if (!this.matchCase) {
      pattern = pattern.toLowerCase();
    }

    if (pattern.length >= 2 &&
        pattern[0] == "/" &&
        pattern[pattern.length - 1] == "/") {
      // The filter is a regular expression - convert it immediately to
      // catch syntax errors
      pattern = pattern.substring(1, pattern.length - 1);
      this._regexp = new RegExp(pattern);
    }
    else {
      // Patterns like /foo/bar/* exist so that they are not treated as regular
      // expressions. We drop any superfluous wildcards here so our
      // optimizations can kick in.
      pattern = pattern.replace(/^\*+/, "").replace(/\*+$/, "");

      // No need to convert this filter to regular expression yet, do it on
      // demand
      this.pattern = pattern;
    }
  }

  /**
   * Checks whether the pattern is a string of literal characters with
   * no wildcards or any other special characters.
   *
   * If the pattern is prefixed with a `||` or suffixed with a `^` but otherwise
   * contains no special characters, it is still considered to be a literal
   * pattern.
   *
   * @returns {boolean}
   */
  isLiteralPattern() {
    return typeof this.pattern !== "undefined" &&
      !/[*^|]/.test(this.pattern.replace(/^\|{1,2}/, "").replace(/[|^]$/, ""));
  }

  /**
   * Regular expression to be used when testing against this pattern.
   *
   * null if the pattern is matched without using regular expressions.
   * @type {RegExp}
   */
  get regexp() {
    if (typeof this._regexp == "undefined") {
      this._regexp = this.isLiteralPattern() ?
        null : new RegExp(filterToRegExp(this.pattern));
    }
    return this._regexp;
  }

  /**
   * Pattern in regular expression notation. This will have a value
   * even if `regexp` returns null.
   * @type {string}
   */
  get regexpSource() {
    return this._regexp ? this._regexp.source : filterToRegExp(this.pattern);
  }

  /**
   * Checks whether the given URL request matches this filter's pattern.
   * @param {module:url.URLRequest} request The URL request to check.
   * @returns {boolean} `true` if the URL request matches.
   */
  matchesLocation(request) {
    let location = this.matchCase ? request.href : request.lowerCaseHref;
    let regexp = this.regexp;
    if (regexp) {
      return regexp.test(location);
    }

    let pattern = this.pattern;
    let startsWithAnchor = pattern[0] == "|";
    let startsWithExtendedAnchor = startsWithAnchor && pattern[1] == "|";
    let endsWithSeparator = pattern[pattern.length - 1] == "^";
    let endsWithAnchor = !endsWithSeparator &&
        pattern[pattern.length - 1] == "|";

    if (startsWithExtendedAnchor) {
      pattern = pattern.substr(2);
    }
    else if (startsWithAnchor) {
      pattern = pattern.substr(1);
    }

    if (endsWithSeparator || endsWithAnchor) {
      pattern = pattern.slice(0, -1);
    }

    let index = location.indexOf(pattern);

    while (index != -1) {
      // The "||" prefix requires that the text that follows does not start
      // with a forward slash.
      if ((startsWithExtendedAnchor ?
           location[index] != "/" &&
           extendedAnchorRegExp.test(location.substring(0, index)) :
           startsWithAnchor ?
           index == 0 :
           true) &&
          (endsWithSeparator ?
           !location[index + pattern.length] ||
           separatorRegExp.test(location[index + pattern.length]) :
           endsWithAnchor ?
           index == location.length - pattern.length :
           true)) {
        return true;
      }

      if (pattern == "") {
        return true;
      }

      index = location.indexOf(pattern, index + 1);
    }

    return false;
  }

  /**
   * Checks whether the pattern has keywords
   * @returns {boolean}
   */
  hasKeywords() {
    return this.pattern && keywordRegExp.test(this.pattern);
  }

  /**
   * Finds all keywords that could be associated with this pattern
   * @returns {string[]}
   */
  keywordCandidates() {
    if (!this.pattern) {
      return null;
    }
    return this.pattern.toLowerCase().match(allKeywordsRegExp);
  }
};


/***/ }),

/***/ "./node_modules/webextension-polyfill/dist/browser-polyfill.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webextension-polyfill/dist/browser-polyfill.js ***!
  \*********************************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [module], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.8.0 - Tue Apr 20 2021 11:27:38 */

  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */

  /* vim: set sts=2 sw=2 et tw=80: */

  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    const SEND_RESPONSE_DEPRECATION_WARNING = "Returning a Promise is the preferred way to send a reply from an onMessage/onMessageExternal listener, as the sendResponse will be removed from the specs (See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)"; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.

    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            },
            "elements": {
              "createSidebarPane": {
                "minArgs": 1,
                "maxArgs": 1
              }
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };

      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }
      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */


      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }

        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }

          return super.get(key);
        }

      }
      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */


      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };
      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */


      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(new Error(extensionAPIs.runtime.lastError.message));
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };

      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";
      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */


      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }

          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }

          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.

                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };
      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */


      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }

        });
      };

      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },

          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.
              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,

                get() {
                  return target[prop];
                },

                set(value) {
                  target[prop] = value;
                }

              });
              return value;
            }

            cache[prop] = value;
            return value;
          },

          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }

            return true;
          },

          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },

          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }

        }; // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.

        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };
      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */


      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },

        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },

        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }

      });

      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */


        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {}
          /* wrappers */
          , {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      }); // Keep track if the deprecation warning has been logged at least once.

      let loggedSendResponseDeprecationWarning = false;
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */


        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              if (!loggedSendResponseDeprecationWarning) {
                console.warn(SEND_RESPONSE_DEPRECATION_WARNING, new Error().stack);
                loggedSendResponseDeprecationWarning = true;
              }

              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;

          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }

          const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.

          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          } // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).


          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;

              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }

              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          }; // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.


          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          } // Let Chrome know that the listener is replying.


          return true;
        };
      });

      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };

      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };

      const staticWrappers = {
        devtools: {
          network: {
            onRequestFinished: wrapEvent(onRequestFinishedWrappers)
          }
        },
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    };

    if (typeof chrome != "object" || !chrome || !chrome.runtime || !chrome.runtime.id) {
      throw new Error("This script should only be loaded in a browser extension.");
    } // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.


    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = browser;
  }
});


/***/ }),

/***/ "./sdk/content/allowlisting.js":
/*!*************************************!*\
  !*** ./sdk/content/allowlisting.js ***!
  \*************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "startOneClickAllowlisting": () => (/* binding */ startOneClickAllowlisting),
/* harmony export */   "stopOneClickAllowlisting": () => (/* binding */ stopOneClickAllowlisting)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../errors.js */ "./sdk/errors.js");
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */




const MAX_ERROR_THRESHOLD = 30;
const MAX_QUEUED_EVENTS = 20;
const EVENT_INTERVAL_MS = 100;

let errorCount = 0;
let eventProcessingInterval = null;
let eventProcessingInProgress = false;
let eventQueue = [];

function isEventTrusted(event) {
  return Object.getPrototypeOf(event) === CustomEvent.prototype &&
    !Object.hasOwnProperty.call(event, "detail");
}

async function allowlistDomain(event) {
  if (!isEventTrusted(event)) {
    return false;
  }

  return (0,_errors_js__WEBPACK_IMPORTED_MODULE_1__.ignoreNoConnectionError)(
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.sendMessage({
      type: "ewe:allowlist-page",
      timestamp: event.detail.timestamp,
      signature: event.detail.signature
    })
  );
}

async function processNextEvent() {
  if (eventProcessingInProgress) {
    return;
  }

  try {
    eventProcessingInProgress = true;
    let event = eventQueue.shift();
    if (event) {
      try {
        let allowlistingResult = await allowlistDomain(event);
        if (allowlistingResult === true) {
          document.dispatchEvent(new Event("domain_allowlisting_success"));
          stopOneClickAllowlisting();
        }
        else {
          throw new Error("Domain allowlisting rejected");
        }
      }
      catch (e) {
        errorCount++;
        if (errorCount >= MAX_ERROR_THRESHOLD) {
          stopOneClickAllowlisting();
        }
      }
    }

    if (!eventQueue.length) {
      stopProcessingInterval();
    }
  }
  finally {
    eventProcessingInProgress = false;
  }
}

function onDomainAllowlistingRequest(event) {
  if (eventQueue.length >= MAX_QUEUED_EVENTS) {
    return;
  }

  eventQueue.push(event);
  startProcessingInterval();
}

function startProcessingInterval() {
  if (!eventProcessingInterval) {
    processNextEvent();
    eventProcessingInterval = setInterval(processNextEvent, EVENT_INTERVAL_MS);
  }
}

function stopProcessingInterval() {
  clearInterval(eventProcessingInterval);
  eventProcessingInterval = null;
}

function stopOneClickAllowlisting() {
  document.removeEventListener("domain_allowlisting_request",
                               onDomainAllowlistingRequest, true);
  eventQueue = [];
  stopProcessingInterval();
}

function startOneClickAllowlisting() {
  document.addEventListener("domain_allowlisting_request",
                            onDomainAllowlistingRequest, true);
}


/***/ }),

/***/ "./sdk/content/element-collapsing.js":
/*!*******************************************!*\
  !*** ./sdk/content/element-collapsing.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hideElement": () => (/* binding */ hideElement),
/* harmony export */   "startElementCollapsing": () => (/* binding */ startElementCollapsing),
/* harmony export */   "unhideElement": () => (/* binding */ unhideElement)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../errors.js */ "./sdk/errors.js");
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */




let collapsedSelectors = new Set();
let observers = new WeakMap();

function getURLFromElement(element) {
  if (element.localName == "object") {
    if (element.data) {
      return element.data;
    }

    for (let child of element.children) {
      if (child.localName == "param" && child.name == "movie" && child.value) {
        return new URL(child.value, document.baseURI).href;
      }
    }

    return null;
  }

  return element.currentSrc || element.src;
}

function getSelectorForBlockedElement(element) {
  // Setting the "display" CSS property to "none" doesn't have any effect on
  // <frame> elements (in framesets). So we have to hide it inline through
  // the "visibility" CSS property.
  if (element.localName == "frame") {
    return null;
  }

  // If the <video> or <audio> element contains any <source> children,
  // we cannot address it in CSS by the source URL; in that case we
  // don't "collapse" it using a CSS selector but rather hide it directly by
  // setting the style="..." attribute.
  if (element.localName == "video" || element.localName == "audio") {
    for (let child of element.children) {
      if (child.localName == "source") {
        return null;
      }
    }
  }

  let selector = "";
  for (let attr of ["src", "srcset"]) {
    let value = element.getAttribute(attr);
    if (value && attr in element) {
      selector += "[" + attr + "=" + CSS.escape(value) + "]";
    }
  }

  return selector ? element.localName + selector : null;
}

function hideElement(element, properties) {
  let {style} = element;

  if (!properties) {
    if (element.localName == "frame") {
      properties = [["visibility", "hidden"]];
    }
    else {
      properties = [["display", "none"]];
    }
  }

  for (let [key, value] of properties) {
    style.setProperty(key, value, "important");
  }

  if (observers.has(element)) {
    observers.get(element).disconnect();
  }

  let observer = new MutationObserver(() => {
    for (let [key, value] of properties) {
      if (style.getPropertyValue(key) != value ||
          style.getPropertyPriority(key) != "important") {
        style.setProperty(key, value, "important");
      }
    }
  });
  observer.observe(
    element, {
      attributes: true,
      attributeFilter: ["style"]
    }
  );
  observers.set(element, observer);
}

function unhideElement(element) {
  let observer = observers.get(element);
  if (observer) {
    observer.disconnect();
    observers.delete(element);
  }

  let property = element.localName == "frame" ? "visibility" : "display";
  element.style.removeProperty(property);
}

function collapseElement(element) {
  let selector = getSelectorForBlockedElement(element);
  if (!selector) {
    hideElement(element);
    return;
  }

  if (!collapsedSelectors.has(selector)) {
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_1__.ignoreNoConnectionError)(
      webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.sendMessage({
        type: "ewe:inject-css",
        selector
      })
    );
    collapsedSelectors.add(selector);
  }
}

function hideInAboutBlankFrames(selector, urls) {
  // Resources (e.g. images) loaded into about:blank frames
  // are (sometimes) loaded with the frameId of the main_frame.
  for (let frame of document.querySelectorAll("iframe[src='about:blank']")) {
    if (!frame.contentDocument) {
      continue;
    }

    for (let element of frame.contentDocument.querySelectorAll(selector)) {
      // Use hideElement, because we don't have the correct frameId
      // for the "ewe:inject-css" message.
      if (urls.has(getURLFromElement(element))) {
        hideElement(element);
      }
    }
  }
}

function startElementCollapsing() {
  let deferred = null;

  webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.onMessage.addListener((message, sender) => {
    if (!message || message.type != "ewe:collapse") {
      return false;
    }

    if (document.readyState == "loading") {
      if (!deferred) {
        deferred = new Map();
        document.addEventListener("DOMContentLoaded", () => {
          // Under some conditions a hostile script could try to trigger
          // the event again. Since we set deferred to `null`, then
          // we assume that we should just return instead of throwing
          // a TypeError.
          if (!deferred) {
            return;
          }

          for (let [selector, urls] of deferred) {
            for (let element of document.querySelectorAll(selector)) {
              if (urls.has(getURLFromElement(element))) {
                collapseElement(element);
              }
            }

            hideInAboutBlankFrames(selector, urls);
          }

          deferred = null;
        });
      }

      let urls = deferred.get(message.selector) || new Set();
      deferred.set(message.selector, urls);
      urls.add(message.url);
    }
    else {
      for (let element of document.querySelectorAll(message.selector)) {
        if (getURLFromElement(element) == message.url) {
          collapseElement(element);
        }
      }

      hideInAboutBlankFrames(message.selector, new Set([message.url]));
    }
    return true;
  });
}


/***/ }),

/***/ "./sdk/content/element-hiding-tracer.js":
/*!**********************************************!*\
  !*** ./sdk/content/element-hiding-tracer.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ElementHidingTracer": () => (/* binding */ ElementHidingTracer)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../errors.js */ "./sdk/errors.js");
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */




class ElementHidingTracer {
  constructor(selectors) {
    this.selectors = new Map(selectors);

    this.observer = new MutationObserver(() => {
      this.observer.disconnect();
      setTimeout(() => this.trace(), 1000);
    });

    if (document.readyState == "loading") {
      document.addEventListener("DOMContentLoaded", () => this.trace());
    }
    else {
      this.trace();
    }
  }

  log(filters, selectors = []) {
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_1__.ignoreNoConnectionError)(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.sendMessage(
      {type: "ewe:trace-elem-hide", filters, selectors}
    ));
  }

  trace() {
    let filters = [];
    let selectors = [];

    for (let [selector, filter] of this.selectors) {
      try {
        if (document.querySelector(selector)) {
          this.selectors.delete(selector);
          if (filter) {
            filters.push(filter);
          }
          else {
            selectors.push(selector);
          }
        }
      }
      catch (e) {
        console.error(e.toString());
      }
    }

    if (filters.length > 0 || selectors.length > 0) {
      this.log(filters, selectors);
    }

    this.observer.observe(document, {childList: true,
                                     attributes: true,
                                     subtree: true});
  }

  disconnect() {
    this.observer.disconnect();
  }
}


/***/ }),

/***/ "./sdk/content/subscribe-links.js":
/*!****************************************!*\
  !*** ./sdk/content/subscribe-links.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "handleSubscribeLinks": () => (/* binding */ handleSubscribeLinks),
/* harmony export */   "subscribeLinksEnabled": () => (/* binding */ subscribeLinksEnabled)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../errors.js */ "./sdk/errors.js");
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */




const ALLOWED_DOMAINS = new Set([
  "abpchina.org",
  "abpindo.blogspot.com",
  "abpvn.com",
  "adblock.ee",
  "adblock.gardar.net",
  "adblockplus.me",
  "adblockplus.org",
  "commentcamarche.net",
  "droit-finances.commentcamarche.com",
  "easylist.to",
  "eyeo.com",
  "fanboy.co.nz",
  "filterlists.com",
  "forums.lanik.us",
  "gitee.com",
  "gitee.io",
  "github.com",
  "github.io",
  "gitlab.com",
  "gitlab.io",
  "gurud.ee",
  "hugolescargot.com",
  "i-dont-care-about-cookies.eu",
  "journaldesfemmes.fr",
  "journaldunet.com",
  "linternaute.com",
  "spam404.com",
  "stanev.org",
  "void.gr",
  "xfiles.noads.it",
  "zoso.ro"
]);

function isDomainAllowed(domain) {
  if (domain.endsWith(".")) {
    domain = domain.substring(0, domain.length - 1);
  }

  while (true) {
    if (ALLOWED_DOMAINS.has(domain)) {
      return true;
    }
    let index = domain.indexOf(".");
    if (index == -1) {
      return false;
    }
    domain = domain.substr(index + 1);
  }
}

function subscribeLinksEnabled(url) {
  let {protocol, hostname} = new URL(url);
  return hostname == "localhost" ||
    protocol == "https:" && isDomainAllowed(hostname);
}

function handleSubscribeLinks() {
  document.addEventListener("click", event => {
    if (event.button == 2 || !event.isTrusted) {
      return;
    }

    let link = event.target;
    while (!(link instanceof HTMLAnchorElement)) {
      link = link.parentNode;

      if (!link) {
        return;
      }
    }

    let queryString = null;
    if (link.protocol == "http:" || link.protocol == "https:") {
      if (link.host == "subscribe.adblockplus.org" && link.pathname == "/") {
        queryString = link.search.substr(1);
      }
    }
    else {
      // Firefox doesn't seem to populate the "search" property for
      // links with non-standard URL schemes so we need to extract the query
      // string manually.
      let match = /^abp:\/*subscribe\/*\?(.*)/i.exec(link.href);
      if (match) {
        queryString = match[1];
      }
    }

    if (!queryString) {
      return;
    }

    let title = null;
    let url = null;
    for (let param of queryString.split("&")) {
      let parts = param.split("=", 2);
      if (parts.length != 2 || !/\S/.test(parts[1])) {
        continue;
      }
      switch (parts[0]) {
        case "title":
          title = decodeURIComponent(parts[1]);
          break;
        case "location":
          url = decodeURIComponent(parts[1]);
          break;
      }
    }
    if (!url) {
      return;
    }

    if (!title) {
      title = url;
    }

    title = title.trim();
    url = url.trim();
    if (!/^(https?|ftp):/.test(url)) {
      return;
    }

    (0,_errors_js__WEBPACK_IMPORTED_MODULE_1__.ignoreNoConnectionError)(
      webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.sendMessage({type: "ewe:subscribe-link-clicked",
                                   title, url})
    );

    event.preventDefault();
    event.stopPropagation();
  }, true);
}


/***/ }),

/***/ "./sdk/errors.js":
/*!***********************!*\
  !*** ./sdk/errors.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ERROR_DUPLICATE_FILTERS": () => (/* binding */ ERROR_DUPLICATE_FILTERS),
/* harmony export */   "ERROR_FILTER_NOT_FOUND": () => (/* binding */ ERROR_FILTER_NOT_FOUND),
/* harmony export */   "ERROR_TOO_MANY_FILTERS": () => (/* binding */ ERROR_TOO_MANY_FILTERS),
/* harmony export */   "ignoreNoConnectionError": () => (/* binding */ ignoreNoConnectionError)
/* harmony export */ });
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

const ERROR_NO_CONNECTION = "Could not establish connection. " +
      "Receiving end does not exist.";
const ERROR_CLOSED_CONNECTION = "A listener indicated an asynchronous " +
      "response by returning true, but the message channel closed before a " +
      "response was received";
// https://bugzilla.mozilla.org/show_bug.cgi?id=1578697
const ERROR_MANAGER_DISCONNECTED = "Message manager disconnected";

const ERROR_DUPLICATE_FILTERS = "storage_duplicate_filters";
const ERROR_FILTER_NOT_FOUND = "filter_not_found";
const ERROR_TOO_MANY_FILTERS = "too_many_filters";

function ignoreNoConnectionError(promise) {
  return promise.catch(error => {
    if (typeof error == "object" &&
        (error.message == ERROR_NO_CONNECTION ||
         error.message == ERROR_CLOSED_CONNECTION ||
         error.message == ERROR_MANAGER_DISCONNECTED)) {
      return;
    }

    throw error;
  });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!******************************!*\
  !*** ./sdk/content/index.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var adblockpluscore_lib_content_elemHideEmulation_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! adblockpluscore/lib/content/elemHideEmulation.js */ "./core/lib/content/elemHideEmulation.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../errors.js */ "./sdk/errors.js");
/* harmony import */ var _element_collapsing_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./element-collapsing.js */ "./sdk/content/element-collapsing.js");
/* harmony import */ var _allowlisting_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./allowlisting.js */ "./sdk/content/allowlisting.js");
/* harmony import */ var _element_hiding_tracer_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./element-hiding-tracer.js */ "./sdk/content/element-hiding-tracer.js");
/* harmony import */ var _subscribe_links_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./subscribe-links.js */ "./sdk/content/subscribe-links.js");
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */











let tracer;
let elemHideEmulation;

async function initContentFeatures() {
  if ((0,_subscribe_links_js__WEBPACK_IMPORTED_MODULE_6__.subscribeLinksEnabled)(window.location.href)) {
    (0,_subscribe_links_js__WEBPACK_IMPORTED_MODULE_6__.handleSubscribeLinks)();
  }

  let response = await (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.ignoreNoConnectionError)(
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.sendMessage({type: "ewe:content-hello"})
  );

  if (response) {
    await applyContentFeatures(response);
  }
}

async function removeContentFeatures() {
  if (tracer) {
    tracer.disconnect();
  }
}

async function applyContentFeatures(response) {
  if (response.tracedSelectors) {
    tracer = new _element_hiding_tracer_js__WEBPACK_IMPORTED_MODULE_5__.ElementHidingTracer(response.tracedSelectors);
  }

  if (response.emulatedPatterns.length > 0) {
    if (!elemHideEmulation) {
      elemHideEmulation = new adblockpluscore_lib_content_elemHideEmulation_js__WEBPACK_IMPORTED_MODULE_1__.ElemHideEmulation((elements, filters) => {
        for (let element of elements) {
          (0,_element_collapsing_js__WEBPACK_IMPORTED_MODULE_3__.hideElement)(element, response.cssProperties);
        }

        if (tracer) {
          tracer.log(filters);
        }
      }, elements => {
        for (let element of elements) {
          (0,_element_collapsing_js__WEBPACK_IMPORTED_MODULE_3__.unhideElement)(element);
        }
      });
    }
    elemHideEmulation.apply(response.emulatedPatterns);
  }
  else if (elemHideEmulation) {
    elemHideEmulation.apply(response.emulatedPatterns);
  }
}

function onMessage(message) {
  if (typeof message == "object" && message != null &&
    message.type && message.type == "ewe:apply-content-features") {
    removeContentFeatures();
    applyContentFeatures(message);
  }
}
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__.runtime.onMessage.addListener(onMessage);

(0,_element_collapsing_js__WEBPACK_IMPORTED_MODULE_3__.startElementCollapsing)();
(0,_allowlisting_js__WEBPACK_IMPORTED_MODULE_4__.startOneClickAllowlisting)();
initContentFeatures();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTLGtDQUFrQztBQUMzQztBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsZ0JBQWdCLFVBQVUsb0JBQW9CO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQLE9BQU8sb0JBQW9CO0FBQzNCO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQUksbUVBQXVCO0FBQzNCLE1BQU0sc0VBQTJCLEVBQUU7QUFDbkMsOENBQThDO0FBQzlDOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNBO0FBQ0E7O0FBRUE7QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDs7Ozs7OztVQ3hDQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRTRDOztBQUdjOztBQUVMO0FBRXBCO0FBQzJCO0FBQ0c7QUFDa0I7O0FBRWpGO0FBQ0E7O0FBRUE7QUFDQSxNQUFNLDBFQUFxQjtBQUMzQixJQUFJLHlFQUFvQjtBQUN4Qjs7QUFFQSx1QkFBdUIsbUVBQXVCO0FBQzlDLElBQUksc0VBQTJCLEVBQUUsMEJBQTBCO0FBQzNEOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQiwwRUFBbUI7QUFDcEM7O0FBRUE7QUFDQTtBQUNBLDhCQUE4QiwrRkFBaUI7QUFDL0M7QUFDQSxVQUFVLG1FQUFXO0FBQ3JCOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLFVBQVUscUVBQWE7QUFDdkI7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBcUM7O0FBRXJDLDhFQUFzQjtBQUN0QiwyRUFBeUI7QUFDekIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uLy4vY29yZS9saWIvY29tbW9uLmpzIiwid2VicGFjazovL0BleWVvL3dlYmV4dC1hZC1maWx0ZXJpbmctc29sdXRpb24vLi9jb3JlL2xpYi9jb250ZW50L2VsZW1IaWRlRW11bGF0aW9uLmpzIiwid2VicGFjazovL0BleWVvL3dlYmV4dC1hZC1maWx0ZXJpbmctc29sdXRpb24vLi9jb3JlL2xpYi9wYXR0ZXJucy5qcyIsIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uLy4vbm9kZV9tb2R1bGVzL3dlYmV4dGVuc2lvbi1wb2x5ZmlsbC9kaXN0L2Jyb3dzZXItcG9seWZpbGwuanMiLCJ3ZWJwYWNrOi8vQGV5ZW8vd2ViZXh0LWFkLWZpbHRlcmluZy1zb2x1dGlvbi8uL3Nkay9jb250ZW50L2FsbG93bGlzdGluZy5qcyIsIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uLy4vc2RrL2NvbnRlbnQvZWxlbWVudC1jb2xsYXBzaW5nLmpzIiwid2VicGFjazovL0BleWVvL3dlYmV4dC1hZC1maWx0ZXJpbmctc29sdXRpb24vLi9zZGsvY29udGVudC9lbGVtZW50LWhpZGluZy10cmFjZXIuanMiLCJ3ZWJwYWNrOi8vQGV5ZW8vd2ViZXh0LWFkLWZpbHRlcmluZy1zb2x1dGlvbi8uL3Nkay9jb250ZW50L3N1YnNjcmliZS1saW5rcy5qcyIsIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uLy4vc2RrL2Vycm9ycy5qcyIsIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0BleWVvL3dlYmV4dC1hZC1maWx0ZXJpbmctc29sdXRpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL0BleWVvL3dlYmV4dC1hZC1maWx0ZXJpbmctc29sdXRpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9AZXllby93ZWJleHQtYWQtZmlsdGVyaW5nLXNvbHV0aW9uL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQGV5ZW8vd2ViZXh0LWFkLWZpbHRlcmluZy1zb2x1dGlvbi8uL3Nkay9jb250ZW50L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBZGJsb2NrIFBsdXMgPGh0dHBzOi8vYWRibG9ja3BsdXMub3JnLz4sXG4gKiBDb3B5cmlnaHQgKEMpIDIwMDYtcHJlc2VudCBleWVvIEdtYkhcbiAqXG4gKiBBZGJsb2NrIFBsdXMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgYXNcbiAqIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLlxuICpcbiAqIEFkYmxvY2sgUGx1cyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggQWRibG9jayBQbHVzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qKiBAbW9kdWxlICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5sZXQgdGV4dFRvUmVnRXhwID1cbi8qKlxuICogQ29udmVydHMgcmF3IHRleHQgaW50byBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IHRoZSBzdHJpbmcgdG8gY29udmVydFxuICogQHJldHVybiB7c3RyaW5nfSByZWd1bGFyIGV4cHJlc3Npb24gcmVwcmVzZW50YXRpb24gb2YgdGhlIHRleHRcbiAqIEBwYWNrYWdlXG4gKi9cbmV4cG9ydHMudGV4dFRvUmVnRXhwID0gdGV4dCA9PiB0ZXh0LnJlcGxhY2UoL1stL1xcXFxeJCorPy4oKXxbXFxde31dL2csIFwiXFxcXCQmXCIpO1xuXG5jb25zdCByZWdleHBSZWdleHAgPSAvXlxcLyguKilcXC8oW2ltdV0qKSQvO1xuXG4vKipcbiAqIE1ha2UgYSByZWd1bGFyIGV4cHJlc3Npb24gZnJvbSBhIHRleHQgYXJndW1lbnQuXG4gKlxuICogSWYgaXQgY2FuIGJlIHBhcnNlZCBhcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgcGFyc2UgaXQgYW5kIHRoZSBmbGFncy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCB0aGUgdGV4dCBhcmd1bWVudC5cbiAqXG4gKiBAcmV0dXJuIHs/UmVnRXhwfSBhIFJlZ0V4cCBvYmplY3Qgb3IgbnVsbCBpbiBjYXNlIG9mIGVycm9yLlxuICovXG5leHBvcnRzLm1ha2VSZWdFeHBQYXJhbWV0ZXIgPSBmdW5jdGlvbiBtYWtlUmVnRXhwUGFyYW1ldGVyKHRleHQpIHtcbiAgbGV0IFssIHNvdXJjZSwgZmxhZ3NdID0gcmVnZXhwUmVnZXhwLmV4ZWModGV4dCkgfHwgW251bGwsIHRleHRUb1JlZ0V4cCh0ZXh0KV07XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChzb3VyY2UsIGZsYWdzKTtcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG5sZXQgc3BsaXRTZWxlY3RvciA9IGV4cG9ydHMuc3BsaXRTZWxlY3RvciA9IGZ1bmN0aW9uIHNwbGl0U2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgaWYgKCFzZWxlY3Rvci5pbmNsdWRlcyhcIixcIikpIHtcbiAgICByZXR1cm4gW3NlbGVjdG9yXTtcbiAgfVxuXG4gIGxldCBzZWxlY3RvcnMgPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGxldmVsID0gMDtcbiAgbGV0IHNlcCA9IFwiXCI7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaHIgPSBzZWxlY3RvcltpXTtcblxuICAgIC8vIGlnbm9yZSBlc2NhcGVkIGNoYXJhY3RlcnNcbiAgICBpZiAoY2hyID09IFwiXFxcXFwiKSB7XG4gICAgICBpKys7XG4gICAgfVxuICAgIC8vIGRvbid0IHNwbGl0IHdpdGhpbiBxdW90ZWQgdGV4dFxuICAgIGVsc2UgaWYgKGNociA9PSBzZXApIHtcbiAgICAgIHNlcCA9IFwiXCI7ICAgICAgICAgICAgIC8vIGUuZy4gW2F0dHI9XCIsXCJdXG4gICAgfVxuICAgIGVsc2UgaWYgKHNlcCA9PSBcIlwiKSB7XG4gICAgICBpZiAoY2hyID09ICdcIicgfHwgY2hyID09IFwiJ1wiKSB7XG4gICAgICAgIHNlcCA9IGNocjtcbiAgICAgIH1cbiAgICAgIC8vIGRvbid0IHNwbGl0IGJldHdlZW4gcGFyZW50aGVzZXNcbiAgICAgIGVsc2UgaWYgKGNociA9PSBcIihcIikge1xuICAgICAgICBsZXZlbCsrOyAgICAgICAgICAgIC8vIGUuZy4gOm1hdGNoZXMoZGl2LHNwYW4pXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChjaHIgPT0gXCIpXCIpIHtcbiAgICAgICAgbGV2ZWwgPSBNYXRoLm1heCgwLCBsZXZlbCAtIDEpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoY2hyID09IFwiLFwiICYmIGxldmVsID09IDApIHtcbiAgICAgICAgc2VsZWN0b3JzLnB1c2goc2VsZWN0b3Iuc3Vic3RyaW5nKHN0YXJ0LCBpKSk7XG4gICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2VsZWN0b3JzLnB1c2goc2VsZWN0b3Iuc3Vic3RyaW5nKHN0YXJ0KSk7XG4gIHJldHVybiBzZWxlY3RvcnM7XG59O1xuXG5mdW5jdGlvbiBmaW5kVGFyZ2V0U2VsZWN0b3JJbmRleChzZWxlY3Rvcikge1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgd2hpdGVzcGFjZSA9IDA7XG4gIGxldCBzY29wZSA9IFtdO1xuXG4gIC8vIFN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgc3RyaW5nIGFuZCBnbyBjaGFyYWN0ZXIgYnkgY2hhcmFjdGVyLCB3aGVyZSBlYWNoXG4gIC8vIGNoYXJhY3RlciBpcyBhIFVuaWNvZGUgY29kZSBwb2ludC5cbiAgZm9yIChsZXQgY2hhcmFjdGVyIG9mIFsuLi5zZWxlY3Rvcl0ucmV2ZXJzZSgpKSB7XG4gICAgbGV0IGN1cnJlbnRTY29wZSA9IHNjb3BlW3Njb3BlLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKGNoYXJhY3RlciA9PSBcIidcIiB8fCBjaGFyYWN0ZXIgPT0gXCJcXFwiXCIpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGFscmVhZHkgd2l0aGluIHRoZSBzYW1lIHR5cGUgb2YgcXVvdGUsIGNsb3NlIHRoZSBzY29wZTtcbiAgICAgIC8vIG90aGVyd2lzZSBvcGVuIGEgbmV3IHNjb3BlLlxuICAgICAgaWYgKGN1cnJlbnRTY29wZSA9PSBjaGFyYWN0ZXIpIHtcbiAgICAgICAgc2NvcGUucG9wKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc2NvcGUucHVzaChjaGFyYWN0ZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChjaGFyYWN0ZXIgPT0gXCJdXCIgfHwgY2hhcmFjdGVyID09IFwiKVwiKSB7XG4gICAgICAvLyBGb3IgY2xvc2luZyBicmFja2V0cyBhbmQgcGFyZW50aGVzZXMsIG9wZW4gYSBuZXcgc2NvcGUgb25seSBpZiB3ZSdyZVxuICAgICAgLy8gbm90IHdpdGhpbiBhIHF1b3RlLiBXaXRoaW4gcXVvdGVzIHRoZXNlIGNoYXJhY3RlcnMgc2hvdWxkIGhhdmUgbm9cbiAgICAgIC8vIG1lYW5pbmcuXG4gICAgICBpZiAoY3VycmVudFNjb3BlICE9IFwiJ1wiICYmIGN1cnJlbnRTY29wZSAhPSBcIlxcXCJcIikge1xuICAgICAgICBzY29wZS5wdXNoKGNoYXJhY3Rlcik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGNoYXJhY3RlciA9PSBcIltcIikge1xuICAgICAgLy8gSWYgd2UncmUgYWxyZWFkeSB3aXRoaW4gYSBicmFja2V0LCBjbG9zZSB0aGUgc2NvcGUuXG4gICAgICBpZiAoY3VycmVudFNjb3BlID09IFwiXVwiKSB7XG4gICAgICAgIHNjb3BlLnBvcCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChjaGFyYWN0ZXIgPT0gXCIoXCIpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGFscmVhZHkgd2l0aGluIGEgcGFyZW50aGVzaXMsIGNsb3NlIHRoZSBzY29wZS5cbiAgICAgIGlmIChjdXJyZW50U2NvcGUgPT0gXCIpXCIpIHtcbiAgICAgICAgc2NvcGUucG9wKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKCFjdXJyZW50U2NvcGUpIHtcbiAgICAgIC8vIEF0IHRoZSB0b3AgbGV2ZWwgKG5vdCB3aXRoaW4gYW55IHNjb3BlKSwgY291bnQgdGhlIHdoaXRlc3BhY2UgaWYgd2UndmVcbiAgICAgIC8vIGVuY291bnRlcmVkIGl0LiBPdGhlcndpc2UgaWYgd2UndmUgaGl0IG9uZSBvZiB0aGUgY29tYmluYXRvcnMsXG4gICAgICAvLyB0ZXJtaW5hdGUgaGVyZTsgb3RoZXJ3aXNlIGlmIHdlJ3ZlIGhpdCBhIG5vbi1jb2xvbiBjaGFyYWN0ZXIsXG4gICAgICAvLyB0ZXJtaW5hdGUgaGVyZS5cbiAgICAgIGlmICgvXFxzLy50ZXN0KGNoYXJhY3RlcikpIHtcbiAgICAgICAgd2hpdGVzcGFjZSsrO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoKGNoYXJhY3RlciA9PSBcIj5cIiB8fCBjaGFyYWN0ZXIgPT0gXCIrXCIgfHwgY2hhcmFjdGVyID09IFwiflwiKSB8fFxuICAgICAgICAgICAgICAgKHdoaXRlc3BhY2UgPiAwICYmIGNoYXJhY3RlciAhPSBcIjpcIikpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gWmVybyBvdXQgdGhlIHdoaXRlc3BhY2UgY291bnQgaWYgd2UndmUgZW50ZXJlZCBhIHNjb3BlLlxuICAgIGlmIChzY29wZS5sZW5ndGggPiAwKSB7XG4gICAgICB3aGl0ZXNwYWNlID0gMDtcbiAgICB9XG5cbiAgICAvLyBJbmNyZW1lbnQgdGhlIGluZGV4IGJ5IHRoZSBzaXplIG9mIHRoZSBjaGFyYWN0ZXIuIE5vdGUgdGhhdCBmb3IgVW5pY29kZVxuICAgIC8vIGNvbXBvc2l0ZSBjaGFyYWN0ZXJzIChsaWtlIGVtb2ppKSB0aGlzIHdpbGwgYmUgbW9yZSB0aGFuIG9uZS5cbiAgICBpbmRleCArPSBjaGFyYWN0ZXIubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yLmxlbmd0aCAtIGluZGV4ICsgd2hpdGVzcGFjZTtcbn1cblxuLyoqXG4gKiBRdWFsaWZpZXMgYSBDU1Mgc2VsZWN0b3Igd2l0aCBhIHF1YWxpZmllciwgd2hpY2ggbWF5IGJlIGFub3RoZXIgQ1NTIHNlbGVjdG9yXG4gKiBvciBhbiBlbXB0eSBzdHJpbmcuIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgc2VsZWN0b3IgXCJkaXYuYmFyXCIgYW5kIHRoZVxuICogcXVhbGlmaWVyIFwiI2Zvb1wiLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgXCJkaXYjZm9vLmJhclwiLlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIFRoZSBzZWxlY3RvciB0byBxdWFsaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IHF1YWxpZmllciBUaGUgcXVhbGlmaWVyIHdpdGggd2hpY2ggdG8gcXVhbGlmeSB0aGUgc2VsZWN0b3IuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgcXVhbGlmaWVkIHNlbGVjdG9yLlxuICogQHBhY2thZ2VcbiAqL1xuZXhwb3J0cy5xdWFsaWZ5U2VsZWN0b3IgPSBmdW5jdGlvbiBxdWFsaWZ5U2VsZWN0b3Ioc2VsZWN0b3IsIHF1YWxpZmllcikge1xuICBsZXQgcXVhbGlmaWVkU2VsZWN0b3IgPSBcIlwiO1xuXG4gIGxldCBxdWFsaWZpZXJUYXJnZXRTZWxlY3RvckluZGV4ID0gZmluZFRhcmdldFNlbGVjdG9ySW5kZXgocXVhbGlmaWVyKTtcbiAgbGV0IFssIHF1YWxpZmllclR5cGUgPSBcIlwiXSA9XG4gICAgL14oW2Etel1bYS16LV0qKT8vaS5leGVjKHF1YWxpZmllci5zdWJzdHJpbmcocXVhbGlmaWVyVGFyZ2V0U2VsZWN0b3JJbmRleCkpO1xuXG4gIGZvciAobGV0IHN1YiBvZiBzcGxpdFNlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgIHN1YiA9IHN1Yi50cmltKCk7XG5cbiAgICBxdWFsaWZpZWRTZWxlY3RvciArPSBcIiwgXCI7XG5cbiAgICBsZXQgaW5kZXggPSBmaW5kVGFyZ2V0U2VsZWN0b3JJbmRleChzdWIpO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBmaXJzdCBncm91cCBpbiB0aGUgcmVndWxhciBleHByZXNzaW9uIGlzIG9wdGlvbmFsLiBJZiBpdFxuICAgIC8vIGRvZXNuJ3QgbWF0Y2ggKGUuZy4gXCIjZm9vOjpudGgtY2hpbGQoMSlcIiksIHR5cGUgd2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcuXG4gICAgbGV0IFssIHR5cGUgPSBcIlwiLCByZXN0XSA9XG4gICAgICAvXihbYS16XVthLXotXSopP1xcKj8oLiopL2kuZXhlYyhzdWIuc3Vic3RyaW5nKGluZGV4KSk7XG5cbiAgICBpZiAodHlwZSA9PSBxdWFsaWZpZXJUeXBlKSB7XG4gICAgICB0eXBlID0gXCJcIjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcXVhbGlmaWVyIGVuZHMgaW4gYSBjb21iaW5hdG9yIChlLmcuIFwiYm9keSAjZm9vPlwiKSwgd2UgcHV0IHRoZVxuICAgIC8vIHR5cGUgYW5kIHRoZSByZXN0IG9mIHRoZSBzZWxlY3RvciBhZnRlciB0aGUgcXVhbGlmaWVyXG4gICAgLy8gKGUuZy4gXCJib2R5ICNmb28+ZGl2LmJhclwiKTsgb3RoZXJ3aXNlIChlLmcuIFwiYm9keSAjZm9vXCIpIHdlIG1lcmdlIHRoZVxuICAgIC8vIHR5cGUgaW50byB0aGUgcXVhbGlmaWVyIChlLmcuIFwiYm9keSBkaXYjZm9vLmJhclwiKS5cbiAgICBpZiAoL1tcXHM+K35dJC8udGVzdChxdWFsaWZpZXIpKSB7XG4gICAgICBxdWFsaWZpZWRTZWxlY3RvciArPSBzdWIuc3Vic3RyaW5nKDAsIGluZGV4KSArIHF1YWxpZmllciArIHR5cGUgKyByZXN0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHF1YWxpZmllZFNlbGVjdG9yICs9IHN1Yi5zdWJzdHJpbmcoMCwgaW5kZXgpICsgdHlwZSArIHF1YWxpZmllciArIHJlc3Q7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIHRoZSBpbml0aWFsIGNvbW1hIGFuZCBzcGFjZS5cbiAgcmV0dXJuIHF1YWxpZmllZFNlbGVjdG9yLnN1YnN0cmluZygyKTtcbn07XG4iLCIvKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWRibG9jayBQbHVzIDxodHRwczovL2FkYmxvY2twbHVzLm9yZy8+LFxuICogQ29weXJpZ2h0IChDKSAyMDA2LXByZXNlbnQgZXllbyBHbWJIXG4gKlxuICogQWRibG9jayBQbHVzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzIGFzXG4gKiBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbi5cbiAqXG4gKiBBZGJsb2NrIFBsdXMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIEFkYmxvY2sgUGx1cy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiogQG1vZHVsZSAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qge21ha2VSZWdFeHBQYXJhbWV0ZXIsIHNwbGl0U2VsZWN0b3IsXG4gICAgICAgcXVhbGlmeVNlbGVjdG9yfSA9IHJlcXVpcmUoXCIuLi9jb21tb25cIik7XG5jb25zdCB7ZmlsdGVyVG9SZWdFeHB9ID0gcmVxdWlyZShcIi4uL3BhdHRlcm5zXCIpO1xuXG5jb25zdCBERUZBVUxUX01JTl9JTlZPQ0FUSU9OX0lOVEVSVkFMID0gMzAwMDtcbmxldCBtaW5JbnZvY2F0aW9uSW50ZXJ2YWwgPSBERUZBVUxUX01JTl9JTlZPQ0FUSU9OX0lOVEVSVkFMO1xuY29uc3QgREVGQVVMVF9NQVhfU1lDSFJPTk9VU19QUk9DRVNTSU5HX1RJTUUgPSA1MDtcbmxldCBtYXhTeW5jaHJvbm91c1Byb2Nlc3NpbmdUaW1lID0gREVGQVVMVF9NQVhfU1lDSFJPTk9VU19QUk9DRVNTSU5HX1RJTUU7XG5cbmxldCBhYnBTZWxlY3RvclJlZ2V4cCA9IC86KC1hYnAtW1xcdy1dK3xoYXN8aGFzLXRleHR8eHBhdGh8bm90KVxcKC87XG5cbmxldCB0ZXN0SW5mbyA9IG51bGw7XG5cbmZ1bmN0aW9uIHRvQ1NTU3R5bGVEZWNsYXJhdGlvbih2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVzdFwiKSwge3N0eWxlOiB2YWx1ZX0pLnN0eWxlO1xufVxuXG4vKipcbiAqIEVuYWJsZXMgdGVzdCBtb2RlLCB3aGljaCB0cmFja3MgYWRkaXRpb25hbCBtZXRhZGF0YSBhYm91dCB0aGUgaW5uZXJcbiAqIHdvcmtpbmdzIGZvciB0ZXN0IHB1cnBvc2VzLiBUaGlzIGFsc28gYWxsb3dzIG92ZXJyaWRpbmcgaW50ZXJuYWxcbiAqIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRpb25zLm1pbkludm9jYXRpb25JbnRlcnZhbCBPdmVycmlkZXMgaG93IGxvbmdcbiAqICAgbXVzdCBiZSB3YWl0ZWQgYmV0d2VlbiBmaWx0ZXIgcHJvY2Vzc2luZyBydW5zXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0aW9ucy5tYXhTeW5jaHJvbm91c1Byb2Nlc3NpbmdUaW1lIE92ZXJyaWRlcyBob3dcbiAqICAgbG9uZyB0aGUgdGhyZWFkIG1heSBzcGVuZCBwcm9jZXNzaW5nIGZpbHRlcnMgYmVmb3JlIGl0IG11c3QgeWllbGRcbiAqICAgaXRzIHRocmVhZFxuICovXG5leHBvcnRzLnNldFRlc3RNb2RlID0gZnVuY3Rpb24gc2V0VGVzdE1vZGUob3B0aW9ucykge1xuICBpZiAodHlwZW9mIG9wdGlvbnMubWluSW52b2NhdGlvbkludGVydmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbWluSW52b2NhdGlvbkludGVydmFsID0gb3B0aW9ucy5taW5JbnZvY2F0aW9uSW50ZXJ2YWw7XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zLm1heFN5bmNocm9ub3VzUHJvY2Vzc2luZ1RpbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtYXhTeW5jaHJvbm91c1Byb2Nlc3NpbmdUaW1lID0gb3B0aW9ucy5tYXhTeW5jaHJvbm91c1Byb2Nlc3NpbmdUaW1lO1xuICB9XG5cbiAgdGVzdEluZm8gPSB7XG4gICAgbGFzdFByb2Nlc3NlZEVsZW1lbnRzOiBuZXcgU2V0KCksXG4gICAgZmFpbGVkQXNzZXJ0aW9uczogW11cbiAgfTtcbn07XG5cbmV4cG9ydHMuZ2V0VGVzdEluZm8gPSBmdW5jdGlvbiBnZXRUZXN0SW5mbygpIHtcbiAgcmV0dXJuIHRlc3RJbmZvO1xufTtcblxuZXhwb3J0cy5jbGVhclRlc3RNb2RlID0gZnVuY3Rpb24oKSB7XG4gIG1pbkludm9jYXRpb25JbnRlcnZhbCA9IERFRkFVTFRfTUlOX0lOVk9DQVRJT05fSU5URVJWQUw7XG4gIG1heFN5bmNocm9ub3VzUHJvY2Vzc2luZ1RpbWUgPSBERUZBVUxUX01BWF9TWUNIUk9OT1VTX1BST0NFU1NJTkdfVElNRTtcbiAgdGVzdEluZm8gPSBudWxsO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IElkbGVEZWFkbGluZS5cbiAqXG4gKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIHN5bmNocm9ub3VzIGFuZCBkb2VzIE5PVCByZXF1ZXN0IGFuIGlkbGVcbiAqIGNhbGxiYWNrLlxuICpcbiAqIFNlZSB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lkbGVEZWFkbGluZX0uXG4gKiBAcmV0dXJuIHtJZGxlRGVhZGxpbmV9XG4gKi9cbmZ1bmN0aW9uIG5ld0lkbGVEZWFkbGluZSgpIHtcbiAgbGV0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICByZXR1cm4ge1xuICAgIGRpZFRpbWVvdXQ6IGZhbHNlLFxuICAgIHRpbWVSZW1haW5pbmcoKSB7XG4gICAgICBsZXQgZWxhcHNlZCA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbGV0IHJlbWFpbmluZyA9IG1heFN5bmNocm9ub3VzUHJvY2Vzc2luZ1RpbWUgLSBlbGFwc2VkO1xuICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgYnJvd3NlciBpcyBuZXh0IGlkbGUuXG4gKlxuICogVGhpcyBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBsb25nIHJ1bm5pbmcgdGFza3Mgb24gdGhlIFVJIHRocmVhZFxuICogdG8gYWxsb3cgb3RoZXIgVUkgZXZlbnRzIHRvIHByb2Nlc3MuXG4gKlxuICogQHJldHVybiB7UHJvbWlzZS48SWRsZURlYWRsaW5lPn1cbiAqICAgIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIHlvdSBjYW4gY29udGludWUgcHJvY2Vzc2luZ1xuICovXG5mdW5jdGlvbiB5aWVsZFRocmVhZCgpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgIGlmICh0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXF1ZXN0SWRsZUNhbGxiYWNrKHJlc29sdmUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZXNvbHZlKG5ld0lkbGVEZWFkbGluZSgpKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gZ2V0Q2FjaGVkUHJvcGVydHlWYWx1ZShvYmplY3QsIG5hbWUsIGRlZmF1bHRWYWx1ZUZ1bmMgPSAoKSA9PiB7fSkge1xuICBsZXQgdmFsdWUgPSBvYmplY3RbbmFtZV07XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIHt2YWx1ZTogdmFsdWUgPSBkZWZhdWx0VmFsdWVGdW5jKCl9KTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0dXJuIHBvc2l0aW9uIG9mIG5vZGUgZnJvbSBwYXJlbnQuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgdGhlIG5vZGUgdG8gZmluZCB0aGUgcG9zaXRpb24gb2YuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IE9uZS1iYXNlZCBpbmRleCBsaWtlIGZvciA6bnRoLWNoaWxkKCksIG9yIDAgb24gZXJyb3IuXG4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uSW5QYXJlbnQobm9kZSkge1xuICBsZXQgaW5kZXggPSAwO1xuICBmb3IgKGxldCBjaGlsZCBvZiBub2RlLnBhcmVudE5vZGUuY2hpbGRyZW4pIHtcbiAgICBpZiAoY2hpbGQgPT0gbm9kZSkge1xuICAgICAgcmV0dXJuIGluZGV4ICsgMTtcbiAgICB9XG5cbiAgICBpbmRleCsrO1xuICB9XG5cbiAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIG1ha2VTZWxlY3Rvcihub2RlLCBzZWxlY3RvciA9IFwiXCIpIHtcbiAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICghbm9kZS5wYXJlbnRFbGVtZW50KSB7XG4gICAgbGV0IG5ld1NlbGVjdG9yID0gXCI6cm9vdFwiO1xuICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgbmV3U2VsZWN0b3IgKz0gXCIgPiBcIiArIHNlbGVjdG9yO1xuICAgIH1cbiAgICByZXR1cm4gbmV3U2VsZWN0b3I7XG4gIH1cbiAgbGV0IGlkeCA9IHBvc2l0aW9uSW5QYXJlbnQobm9kZSk7XG4gIGlmIChpZHggPiAwKSB7XG4gICAgbGV0IG5ld1NlbGVjdG9yID0gYCR7bm9kZS50YWdOYW1lfTpudGgtY2hpbGQoJHtpZHh9KWA7XG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICBuZXdTZWxlY3RvciArPSBcIiA+IFwiICsgc2VsZWN0b3I7XG4gICAgfVxuICAgIHJldHVybiBtYWtlU2VsZWN0b3Iobm9kZS5wYXJlbnRFbGVtZW50LCBuZXdTZWxlY3Rvcik7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0b3JDb250ZW50KGNvbnRlbnQsIHN0YXJ0SW5kZXgpIHtcbiAgbGV0IHBhcmVucyA9IDE7XG4gIGxldCBxdW90ZSA9IG51bGw7XG4gIGxldCBpID0gc3RhcnRJbmRleDtcbiAgZm9yICg7IGkgPCBjb250ZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGMgPSBjb250ZW50W2ldO1xuICAgIGlmIChjID09IFwiXFxcXFwiKSB7XG4gICAgICAvLyBJZ25vcmUgZXNjYXBlZCBjaGFyYWN0ZXJzXG4gICAgICBpKys7XG4gICAgfVxuICAgIGVsc2UgaWYgKHF1b3RlKSB7XG4gICAgICBpZiAoYyA9PSBxdW90ZSkge1xuICAgICAgICBxdW90ZSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGMgPT0gXCInXCIgfHwgYyA9PSAnXCInKSB7XG4gICAgICBxdW90ZSA9IGM7XG4gICAgfVxuICAgIGVsc2UgaWYgKGMgPT0gXCIoXCIpIHtcbiAgICAgIHBhcmVucysrO1xuICAgIH1cbiAgICBlbHNlIGlmIChjID09IFwiKVwiKSB7XG4gICAgICBwYXJlbnMtLTtcbiAgICAgIGlmIChwYXJlbnMgPT0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAocGFyZW5zID4gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7dGV4dDogY29udGVudC5zdWJzdHJpbmcoc3RhcnRJbmRleCwgaSksIGVuZDogaX07XG59XG5cbi8qKlxuICogU3RyaW5naWZpZWQgc3R5bGUgb2JqZWN0c1xuICogQHR5cGVkZWYge09iamVjdH0gU3RyaW5naWZpZWRTdHlsZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0eWxlIENTUyBzdHlsZSByZXByZXNlbnRlZCBieSBhIHN0cmluZy5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IHN1YlNlbGVjdG9ycyBzZWxlY3RvcnMgdGhlIENTUyBwcm9wZXJ0aWVzIGFwcGx5IHRvLlxuICovXG5cbi8qKlxuICogUHJvZHVjZSBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgc3R5bGVzaGVldCBlbnRyeS5cbiAqIEBwYXJhbSB7Q1NTU3R5bGVSdWxlfSBydWxlIHRoZSBDU1Mgc3R5bGUgcnVsZS5cbiAqIEByZXR1cm4ge1N0cmluZ2lmaWVkU3R5bGV9IHRoZSBzdHJpbmdpZmllZCBzdHlsZS5cbiAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5U3R5bGUocnVsZSkge1xuICBsZXQgc3R5bGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZS5zdHlsZS5sZW5ndGg7IGkrKykge1xuICAgIGxldCBwcm9wZXJ0eSA9IHJ1bGUuc3R5bGUuaXRlbShpKTtcbiAgICBsZXQgdmFsdWUgPSBydWxlLnN0eWxlLmdldFByb3BlcnR5VmFsdWUocHJvcGVydHkpO1xuICAgIGxldCBwcmlvcml0eSA9IHJ1bGUuc3R5bGUuZ2V0UHJvcGVydHlQcmlvcml0eShwcm9wZXJ0eSk7XG4gICAgc3R5bGVzLnB1c2goYCR7cHJvcGVydHl9OiAke3ZhbHVlfSR7cHJpb3JpdHkgPyBcIiAhXCIgKyBwcmlvcml0eSA6IFwiXCJ9O2ApO1xuICB9XG4gIHN0eWxlcy5zb3J0KCk7XG4gIHJldHVybiB7XG4gICAgc3R5bGU6IHN0eWxlcy5qb2luKFwiIFwiKSxcbiAgICBzdWJTZWxlY3RvcnM6IHNwbGl0U2VsZWN0b3IocnVsZS5zZWxlY3RvclRleHQpXG4gIH07XG59XG5cbmxldCBzY29wZVN1cHBvcnRlZCA9IG51bGw7XG5cbmZ1bmN0aW9uIHRyeVF1ZXJ5U2VsZWN0b3Ioc3VidHJlZSwgc2VsZWN0b3IsIGFsbCkge1xuICBsZXQgZWxlbWVudHMgPSBudWxsO1xuICB0cnkge1xuICAgIGVsZW1lbnRzID0gYWxsID8gc3VidHJlZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSA6XG4gICAgICBzdWJ0cmVlLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIHNjb3BlU3VwcG9ydGVkID0gdHJ1ZTtcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIC8vIEVkZ2UgZG9lc24ndCBzdXBwb3J0IFwiOnNjb3BlXCJcbiAgICBzY29wZVN1cHBvcnRlZCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn1cblxuLyoqXG4gKiBRdWVyeSBzZWxlY3Rvci5cbiAqXG4gKiBJZiBpdCBpcyByZWxhdGl2ZSwgd2lsbCB0cnkgOnNjb3BlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gc3VidHJlZSB0aGUgZWxlbWVudCB0byBxdWVyeSBzZWxlY3RvclxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIHRoZSBzZWxlY3RvciB0byBxdWVyeVxuICogQHBhcmFtIHtib29sfSBbYWxsPWZhbHNlXSB0cnVlIHRvIHBlcmZvcm0gcXVlcnlTZWxlY3RvckFsbCgpXG4gKlxuICogQHJldHVybnMgez8oTm9kZXxOb2RlTGlzdCl9IHJlc3VsdCBvZiB0aGUgcXVlcnkuIG51bGwgaW4gY2FzZSBvZiBlcnJvci5cbiAqL1xuZnVuY3Rpb24gc2NvcGVkUXVlcnlTZWxlY3RvcihzdWJ0cmVlLCBzZWxlY3RvciwgYWxsKSB7XG4gIGlmIChzZWxlY3RvclswXSA9PSBcIj5cIikge1xuICAgIHNlbGVjdG9yID0gXCI6c2NvcGVcIiArIHNlbGVjdG9yO1xuICAgIGlmIChzY29wZVN1cHBvcnRlZCkge1xuICAgICAgcmV0dXJuIGFsbCA/IHN1YnRyZWUucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikgOlxuICAgICAgICBzdWJ0cmVlLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIH1cbiAgICBpZiAoc2NvcGVTdXBwb3J0ZWQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRyeVF1ZXJ5U2VsZWN0b3Ioc3VidHJlZSwgc2VsZWN0b3IsIGFsbCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBhbGwgPyBzdWJ0cmVlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpIDpcbiAgICBzdWJ0cmVlLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBzY29wZWRRdWVyeVNlbGVjdG9yQWxsKHN1YnRyZWUsIHNlbGVjdG9yKSB7XG4gIHJldHVybiBzY29wZWRRdWVyeVNlbGVjdG9yKHN1YnRyZWUsIHNlbGVjdG9yLCB0cnVlKTtcbn1cblxuY2xhc3MgUGxhaW5TZWxlY3RvciB7XG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XG4gICAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICB0aGlzLm1heWJlRGVwZW5kc09uQXR0cmlidXRlcyA9IC9bIy46XXxcXFsuK1xcXS8udGVzdChzZWxlY3Rvcik7XG4gICAgdGhpcy5tYXliZUNvbnRhaW5zU2libGluZ0NvbWJpbmF0b3JzID0gL1t+K10vLnRlc3Qoc2VsZWN0b3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRvciBmdW5jdGlvbiByZXR1cm5pbmcgYSBwYWlyIG9mIHNlbGVjdG9yIHN0cmluZyBhbmQgc3VidHJlZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCB0aGUgcHJlZml4IGZvciB0aGUgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSB7Tm9kZX0gc3VidHJlZSB0aGUgc3VidHJlZSB3ZSB3b3JrIG9uLlxuICAgKiBAcGFyYW0ge05vZGVbXX0gW3RhcmdldHNdIHRoZSBub2RlcyB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAgICovXG4gICpnZXRTZWxlY3RvcnMocHJlZml4LCBzdWJ0cmVlLCB0YXJnZXRzKSB7XG4gICAgeWllbGQgW3ByZWZpeCArIHRoaXMuX3NlbGVjdG9yLCBzdWJ0cmVlXTtcbiAgfVxufVxuXG5jb25zdCBpbmNvbXBsZXRlUHJlZml4UmVnZXhwID0gL1tcXHM+K35dJC87XG5cbmNsYXNzIE5vdFNlbGVjdG9yIHtcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3JzKSB7XG4gICAgdGhpcy5faW5uZXJQYXR0ZXJuID0gbmV3IFBhdHRlcm4oc2VsZWN0b3JzKTtcbiAgfVxuXG4gIGdldCBkZXBlbmRzT25TdHlsZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lubmVyUGF0dGVybi5kZXBlbmRzT25TdHlsZXM7XG4gIH1cblxuICBnZXQgZGVwZW5kc09uQ2hhcmFjdGVyRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5faW5uZXJQYXR0ZXJuLmRlcGVuZHNPbkNoYXJhY3RlckRhdGE7XG4gIH1cblxuICBnZXQgbWF5YmVEZXBlbmRzT25BdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLl9pbm5lclBhdHRlcm4ubWF5YmVEZXBlbmRzT25BdHRyaWJ1dGVzO1xuICB9XG5cbiAgKmdldFNlbGVjdG9ycyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpIHtcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMuZ2V0RWxlbWVudHMocHJlZml4LCBzdWJ0cmVlLCB0YXJnZXRzKSkge1xuICAgICAgeWllbGQgW21ha2VTZWxlY3RvcihlbGVtZW50KSwgZWxlbWVudF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRvciBmdW5jdGlvbiByZXR1cm5pbmcgc2VsZWN0ZWQgZWxlbWVudHMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggdGhlIHByZWZpeCBmb3IgdGhlIHNlbGVjdG9yLlxuICAgKiBAcGFyYW0ge05vZGV9IHN1YnRyZWUgdGhlIHN1YnRyZWUgd2Ugd29yayBvbi5cbiAgICogQHBhcmFtIHtOb2RlW119IFt0YXJnZXRzXSB0aGUgbm9kZXMgd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gICAqL1xuICAqZ2V0RWxlbWVudHMocHJlZml4LCBzdWJ0cmVlLCB0YXJnZXRzKSB7XG4gICAgbGV0IGFjdHVhbFByZWZpeCA9ICghcHJlZml4IHx8IGluY29tcGxldGVQcmVmaXhSZWdleHAudGVzdChwcmVmaXgpKSA/XG4gICAgICBwcmVmaXggKyBcIipcIiA6IHByZWZpeDtcbiAgICBsZXQgZWxlbWVudHMgPSBzY29wZWRRdWVyeVNlbGVjdG9yQWxsKHN1YnRyZWUsIGFjdHVhbFByZWZpeCk7XG4gICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICBmb3IgKGxldCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIG5laXRoZXIgYW4gYW5jZXN0b3Igbm9yIGEgZGVzY2VuZGFudCBvZiBvbmUgb2YgdGhlXG4gICAgICAgIC8vIHRhcmdldHMsIHdlIGNhbiBza2lwIGl0LlxuICAgICAgICBpZiAodGFyZ2V0cyAmJiAhdGFyZ2V0cy5zb21lKHRhcmdldCA9PiBlbGVtZW50LmNvbnRhaW5zKHRhcmdldCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICAgIHlpZWxkIG51bGw7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdEluZm8pIHtcbiAgICAgICAgICB0ZXN0SW5mby5sYXN0UHJvY2Vzc2VkRWxlbWVudHMuYWRkKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9pbm5lclBhdHRlcm4ubWF0Y2hlcyhlbGVtZW50LCBzdWJ0cmVlKSkge1xuICAgICAgICAgIHlpZWxkIGVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICB5aWVsZCBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldFN0eWxlcyhzdHlsZXMpIHtcbiAgICB0aGlzLl9pbm5lclBhdHRlcm4uc2V0U3R5bGVzKHN0eWxlcyk7XG4gIH1cbn1cblxuY2xhc3MgSGFzU2VsZWN0b3Ige1xuICBjb25zdHJ1Y3RvcihzZWxlY3RvcnMpIHtcbiAgICB0aGlzLl9pbm5lclBhdHRlcm4gPSBuZXcgUGF0dGVybihzZWxlY3RvcnMpO1xuICB9XG5cbiAgZ2V0IGRlcGVuZHNPblN0eWxlcygpIHtcbiAgICByZXR1cm4gdGhpcy5faW5uZXJQYXR0ZXJuLmRlcGVuZHNPblN0eWxlcztcbiAgfVxuXG4gIGdldCBkZXBlbmRzT25DaGFyYWN0ZXJEYXRhKCkge1xuICAgIHJldHVybiB0aGlzLl9pbm5lclBhdHRlcm4uZGVwZW5kc09uQ2hhcmFjdGVyRGF0YTtcbiAgfVxuXG4gIGdldCBtYXliZURlcGVuZHNPbkF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lubmVyUGF0dGVybi5tYXliZURlcGVuZHNPbkF0dHJpYnV0ZXM7XG4gIH1cblxuICAqZ2V0U2VsZWN0b3JzKHByZWZpeCwgc3VidHJlZSwgdGFyZ2V0cykge1xuICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5nZXRFbGVtZW50cyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpKSB7XG4gICAgICB5aWVsZCBbbWFrZVNlbGVjdG9yKGVsZW1lbnQpLCBlbGVtZW50XTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdG9yIGZ1bmN0aW9uIHJldHVybmluZyBzZWxlY3RlZCBlbGVtZW50cy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCB0aGUgcHJlZml4IGZvciB0aGUgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSB7Tm9kZX0gc3VidHJlZSB0aGUgc3VidHJlZSB3ZSB3b3JrIG9uLlxuICAgKiBAcGFyYW0ge05vZGVbXX0gW3RhcmdldHNdIHRoZSBub2RlcyB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAgICovXG4gICpnZXRFbGVtZW50cyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpIHtcbiAgICBsZXQgYWN0dWFsUHJlZml4ID0gKCFwcmVmaXggfHwgaW5jb21wbGV0ZVByZWZpeFJlZ2V4cC50ZXN0KHByZWZpeCkpID9cbiAgICAgIHByZWZpeCArIFwiKlwiIDogcHJlZml4O1xuICAgIGxldCBlbGVtZW50cyA9IHNjb3BlZFF1ZXJ5U2VsZWN0b3JBbGwoc3VidHJlZSwgYWN0dWFsUHJlZml4KTtcbiAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbmVpdGhlciBhbiBhbmNlc3RvciBub3IgYSBkZXNjZW5kYW50IG9mIG9uZSBvZiB0aGVcbiAgICAgICAgLy8gdGFyZ2V0cywgd2UgY2FuIHNraXAgaXQuXG4gICAgICAgIGlmICh0YXJnZXRzICYmICF0YXJnZXRzLnNvbWUodGFyZ2V0ID0+IGVsZW1lbnQuY29udGFpbnModGFyZ2V0KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY29udGFpbnMoZWxlbWVudCkpKSB7XG4gICAgICAgICAgeWllbGQgbnVsbDtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZXN0SW5mbykge1xuICAgICAgICAgIHRlc3RJbmZvLmxhc3RQcm9jZXNzZWRFbGVtZW50cy5hZGQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBzZWxlY3RvciBvZiB0aGlzLl9pbm5lclBhdHRlcm4uZXZhbHVhdGUoZWxlbWVudCwgdGFyZ2V0cykpIHtcbiAgICAgICAgICBpZiAoc2VsZWN0b3IgPT0gbnVsbCkge1xuICAgICAgICAgICAgeWllbGQgbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc2NvcGVkUXVlcnlTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHlpZWxkIGVsZW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgeWllbGQgbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRTdHlsZXMoc3R5bGVzKSB7XG4gICAgdGhpcy5faW5uZXJQYXR0ZXJuLnNldFN0eWxlcyhzdHlsZXMpO1xuICB9XG59XG5cbmNsYXNzIFhQYXRoU2VsZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcih0ZXh0Q29udGVudCkge1xuICAgIHRoaXMuZGVwZW5kc09uQ2hhcmFjdGVyRGF0YSA9IHRydWU7XG4gICAgdGhpcy5tYXliZURlcGVuZHNPbkF0dHJpYnV0ZXMgPSB0cnVlO1xuXG4gICAgbGV0IGV2YWx1YXRvciA9IG5ldyBYUGF0aEV2YWx1YXRvcigpO1xuICAgIHRoaXMuX2V4cHJlc3Npb24gPSBldmFsdWF0b3IuY3JlYXRlRXhwcmVzc2lvbih0ZXh0Q29udGVudCwgbnVsbCk7XG4gIH1cblxuICAqZ2V0U2VsZWN0b3JzKHByZWZpeCwgc3VidHJlZSwgdGFyZ2V0cykge1xuICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5nZXRFbGVtZW50cyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpKSB7XG4gICAgICB5aWVsZCBbbWFrZVNlbGVjdG9yKGVsZW1lbnQpLCBlbGVtZW50XTtcbiAgICB9XG4gIH1cblxuICAqZ2V0RWxlbWVudHMocHJlZml4LCBzdWJ0cmVlLCB0YXJnZXRzKSB7XG4gICAgbGV0IHtPUkRFUkVEX05PREVfU05BUFNIT1RfVFlQRTogZmxhZ30gPSBYUGF0aFJlc3VsdDtcbiAgICBsZXQgZWxlbWVudHMgPSBwcmVmaXggPyBzY29wZWRRdWVyeVNlbGVjdG9yQWxsKHN1YnRyZWUsIHByZWZpeCkgOiBbc3VidHJlZV07XG4gICAgZm9yIChsZXQgcGFyZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gdGhpcy5fZXhwcmVzc2lvbi5ldmFsdWF0ZShwYXJlbnQsIGZsYWcsIG51bGwpO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIHtzbmFwc2hvdExlbmd0aH0gPSByZXN1bHQ7IGkgPCBzbmFwc2hvdExlbmd0aDsgaSsrKSB7XG4gICAgICAgIHlpZWxkIHJlc3VsdC5zbmFwc2hvdEl0ZW0oaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIENvbnRhaW5zU2VsZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcih0ZXh0Q29udGVudCkge1xuICAgIHRoaXMuZGVwZW5kc09uQ2hhcmFjdGVyRGF0YSA9IHRydWU7XG5cbiAgICB0aGlzLl9yZWdleHAgPSBtYWtlUmVnRXhwUGFyYW1ldGVyKHRleHRDb250ZW50KTtcbiAgfVxuXG4gICpnZXRTZWxlY3RvcnMocHJlZml4LCBzdWJ0cmVlLCB0YXJnZXRzKSB7XG4gICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzLmdldEVsZW1lbnRzKHByZWZpeCwgc3VidHJlZSwgdGFyZ2V0cykpIHtcbiAgICAgIHlpZWxkIFttYWtlU2VsZWN0b3IoZWxlbWVudCksIHN1YnRyZWVdO1xuICAgIH1cbiAgfVxuXG4gICpnZXRFbGVtZW50cyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpIHtcbiAgICBsZXQgYWN0dWFsUHJlZml4ID0gKCFwcmVmaXggfHwgaW5jb21wbGV0ZVByZWZpeFJlZ2V4cC50ZXN0KHByZWZpeCkpID9cbiAgICAgIHByZWZpeCArIFwiKlwiIDogcHJlZml4O1xuXG4gICAgbGV0IGVsZW1lbnRzID0gc2NvcGVkUXVlcnlTZWxlY3RvckFsbChzdWJ0cmVlLCBhY3R1YWxQcmVmaXgpO1xuXG4gICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICBsZXQgbGFzdFJvb3QgPSBudWxsO1xuICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICAvLyBGb3IgYSBmaWx0ZXIgbGlrZSBkaXY6LWFicC1jb250YWlucyhIZWxsbykgYW5kIGEgc3VidHJlZSBsaWtlXG4gICAgICAgIC8vIDxkaXYgaWQ9XCJhXCI+PGRpdiBpZD1cImJcIj48ZGl2IGlkPVwiY1wiPkhlbGxvPC9kaXY+PC9kaXY+PC9kaXY+XG4gICAgICAgIC8vIHdlJ3JlIG9ubHkgaW50ZXJlc3RlZCBpbiBkaXYjYVxuICAgICAgICBpZiAobGFzdFJvb3QgJiYgbGFzdFJvb3QuY29udGFpbnMoZWxlbWVudCkpIHtcbiAgICAgICAgICB5aWVsZCBudWxsO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGFzdFJvb3QgPSBlbGVtZW50O1xuXG4gICAgICAgIGlmICh0YXJnZXRzICYmICF0YXJnZXRzLnNvbWUodGFyZ2V0ID0+IGVsZW1lbnQuY29udGFpbnModGFyZ2V0KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY29udGFpbnMoZWxlbWVudCkpKSB7XG4gICAgICAgICAgeWllbGQgbnVsbDtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZXN0SW5mbykge1xuICAgICAgICAgIHRlc3RJbmZvLmxhc3RQcm9jZXNzZWRFbGVtZW50cy5hZGQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fcmVnZXhwICYmIHRoaXMuX3JlZ2V4cC50ZXN0KGVsZW1lbnQudGV4dENvbnRlbnQpKSB7XG4gICAgICAgICAgeWllbGQgZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5aWVsZCBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFByb3BzU2VsZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wZXJ0eUV4cHJlc3Npb24pIHtcbiAgICB0aGlzLmRlcGVuZHNPblN0eWxlcyA9IHRydWU7XG4gICAgdGhpcy5tYXliZURlcGVuZHNPbkF0dHJpYnV0ZXMgPSB0cnVlO1xuXG4gICAgbGV0IHJlZ2V4cFN0cmluZztcbiAgICBpZiAocHJvcGVydHlFeHByZXNzaW9uLmxlbmd0aCA+PSAyICYmIHByb3BlcnR5RXhwcmVzc2lvblswXSA9PSBcIi9cIiAmJlxuICAgICAgICBwcm9wZXJ0eUV4cHJlc3Npb25bcHJvcGVydHlFeHByZXNzaW9uLmxlbmd0aCAtIDFdID09IFwiL1wiKSB7XG4gICAgICByZWdleHBTdHJpbmcgPSBwcm9wZXJ0eUV4cHJlc3Npb24uc2xpY2UoMSwgLTEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlZ2V4cFN0cmluZyA9IGZpbHRlclRvUmVnRXhwKHByb3BlcnR5RXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVnZXhwID0gbmV3IFJlZ0V4cChyZWdleHBTdHJpbmcsIFwiaVwiKTtcblxuICAgIHRoaXMuX3N1YlNlbGVjdG9ycyA9IFtdO1xuICB9XG5cbiAgKmdldFNlbGVjdG9ycyhwcmVmaXgsIHN1YnRyZWUsIHRhcmdldHMpIHtcbiAgICBmb3IgKGxldCBzdWJTZWxlY3RvciBvZiB0aGlzLl9zdWJTZWxlY3RvcnMpIHtcbiAgICAgIGlmIChzdWJTZWxlY3Rvci5zdGFydHNXaXRoKFwiKlwiKSAmJlxuICAgICAgICAgICFpbmNvbXBsZXRlUHJlZml4UmVnZXhwLnRlc3QocHJlZml4KSkge1xuICAgICAgICBzdWJTZWxlY3RvciA9IHN1YlNlbGVjdG9yLnN1YnN0cmluZygxKTtcbiAgICAgIH1cblxuICAgICAgeWllbGQgW3F1YWxpZnlTZWxlY3RvcihzdWJTZWxlY3RvciwgcHJlZml4KSwgc3VidHJlZV07XG4gICAgfVxuICB9XG5cbiAgc2V0U3R5bGVzKHN0eWxlcykge1xuICAgIHRoaXMuX3N1YlNlbGVjdG9ycyA9IFtdO1xuICAgIGZvciAobGV0IHN0eWxlIG9mIHN0eWxlcykge1xuICAgICAgaWYgKHRoaXMuX3JlZ2V4cC50ZXN0KHN0eWxlLnN0eWxlKSkge1xuICAgICAgICBmb3IgKGxldCBzdWJTZWxlY3RvciBvZiBzdHlsZS5zdWJTZWxlY3RvcnMpIHtcbiAgICAgICAgICBsZXQgaWR4ID0gc3ViU2VsZWN0b3IubGFzdEluZGV4T2YoXCI6OlwiKTtcbiAgICAgICAgICBpZiAoaWR4ICE9IC0xKSB7XG4gICAgICAgICAgICBzdWJTZWxlY3RvciA9IHN1YlNlbGVjdG9yLnN1YnN0cmluZygwLCBpZHgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3N1YlNlbGVjdG9ycy5wdXNoKHN1YlNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBQYXR0ZXJuIHtcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3JzLCB0ZXh0KSB7XG4gICAgdGhpcy5zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgfVxuXG4gIGdldCBkZXBlbmRzT25TdHlsZXMoKSB7XG4gICAgcmV0dXJuIGdldENhY2hlZFByb3BlcnR5VmFsdWUoXG4gICAgICB0aGlzLCBcIl9kZXBlbmRzT25TdHlsZXNcIiwgKCkgPT4gdGhpcy5zZWxlY3RvcnMuc29tZShcbiAgICAgICAgc2VsZWN0b3IgPT4gc2VsZWN0b3IuZGVwZW5kc09uU3R5bGVzXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGdldCBtYXliZURlcGVuZHNPbkF0dHJpYnV0ZXMoKSB7XG4gICAgLy8gT2JzZXJ2ZSBjaGFuZ2VzIHRvIGF0dHJpYnV0ZXMgaWYgZWl0aGVyIHRoZXJlJ3MgYSBwbGFpbiBzZWxlY3RvciB0aGF0XG4gICAgLy8gbG9va3MgbGlrZSBhbiBJRCBzZWxlY3RvciwgY2xhc3Mgc2VsZWN0b3IsIG9yIGF0dHJpYnV0ZSBzZWxlY3RvciBpbiBvbmVcbiAgICAvLyBvZiB0aGUgcGF0dGVybnMgKGUuZy4gXCJhW2hyZWY9J2h0dHBzOi8vZXhhbXBsZS5jb20vJ11cIilcbiAgICAvLyBvciB0aGVyZSdzIGEgcHJvcGVydGllcyBzZWxlY3RvciBuZXN0ZWQgaW5zaWRlIGEgaGFzIHNlbGVjdG9yXG4gICAgLy8gKGUuZy4gXCJkaXY6LWFicC1oYXMoOi1hYnAtcHJvcGVydGllcyhjb2xvcjogYmx1ZSkpXCIpXG4gICAgcmV0dXJuIGdldENhY2hlZFByb3BlcnR5VmFsdWUoXG4gICAgICB0aGlzLCBcIl9tYXliZURlcGVuZHNPbkF0dHJpYnV0ZXNcIiwgKCkgPT4gdGhpcy5zZWxlY3RvcnMuc29tZShcbiAgICAgICAgc2VsZWN0b3IgPT4gc2VsZWN0b3IubWF5YmVEZXBlbmRzT25BdHRyaWJ1dGVzIHx8XG4gICAgICAgICAgICAgICAgICAgIChzZWxlY3RvciBpbnN0YW5jZW9mIEhhc1NlbGVjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICBzZWxlY3Rvci5kZXBlbmRzT25TdHlsZXMpXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGdldCBkZXBlbmRzT25DaGFyYWN0ZXJEYXRhKCkge1xuICAgIC8vIE9ic2VydmUgY2hhbmdlcyB0byBjaGFyYWN0ZXIgZGF0YSBvbmx5IGlmIHRoZXJlJ3MgYSBjb250YWlucyBzZWxlY3RvciBpblxuICAgIC8vIG9uZSBvZiB0aGUgcGF0dGVybnMuXG4gICAgcmV0dXJuIGdldENhY2hlZFByb3BlcnR5VmFsdWUoXG4gICAgICB0aGlzLCBcIl9kZXBlbmRzT25DaGFyYWN0ZXJEYXRhXCIsICgpID0+IHRoaXMuc2VsZWN0b3JzLnNvbWUoXG4gICAgICAgIHNlbGVjdG9yID0+IHNlbGVjdG9yLmRlcGVuZHNPbkNoYXJhY3RlckRhdGFcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgZ2V0IG1heWJlQ29udGFpbnNTaWJsaW5nQ29tYmluYXRvcnMoKSB7XG4gICAgcmV0dXJuIGdldENhY2hlZFByb3BlcnR5VmFsdWUoXG4gICAgICB0aGlzLCBcIl9tYXliZUNvbnRhaW5zU2libGluZ0NvbWJpbmF0b3JzXCIsICgpID0+IHRoaXMuc2VsZWN0b3JzLnNvbWUoXG4gICAgICAgIHNlbGVjdG9yID0+IHNlbGVjdG9yLm1heWJlQ29udGFpbnNTaWJsaW5nQ29tYmluYXRvcnNcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgbWF0Y2hlc011dGF0aW9uVHlwZXMobXV0YXRpb25UeXBlcykge1xuICAgIGxldCBtdXRhdGlvblR5cGVNYXRjaE1hcCA9IGdldENhY2hlZFByb3BlcnR5VmFsdWUoXG4gICAgICB0aGlzLCBcIl9tdXRhdGlvblR5cGVNYXRjaE1hcFwiLCAoKSA9PiBuZXcgTWFwKFtcbiAgICAgICAgLy8gQWxsIHR5cGVzIG9mIERPTS1kZXBlbmRlbnQgcGF0dGVybnMgYXJlIGFmZmVjdGVkIGJ5IG11dGF0aW9ucyBvZlxuICAgICAgICAvLyB0eXBlIFwiY2hpbGRMaXN0XCIuXG4gICAgICAgIFtcImNoaWxkTGlzdFwiLCB0cnVlXSxcbiAgICAgICAgW1wiYXR0cmlidXRlc1wiLCB0aGlzLm1heWJlRGVwZW5kc09uQXR0cmlidXRlc10sXG4gICAgICAgIFtcImNoYXJhY3RlckRhdGFcIiwgdGhpcy5kZXBlbmRzT25DaGFyYWN0ZXJEYXRhXVxuICAgICAgXSlcbiAgICApO1xuXG4gICAgZm9yIChsZXQgbXV0YXRpb25UeXBlIG9mIG11dGF0aW9uVHlwZXMpIHtcbiAgICAgIGlmIChtdXRhdGlvblR5cGVNYXRjaE1hcC5nZXQobXV0YXRpb25UeXBlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdG9yIGZ1bmN0aW9uIHJldHVybmluZyBDU1Mgc2VsZWN0b3JzIGZvciBhbGwgZWxlbWVudHMgdGhhdFxuICAgKiBtYXRjaCB0aGUgcGF0dGVybi5cbiAgICpcbiAgICogVGhpcyBhbGxvd3MgdHJhbnNmb3JtaW5nIGZyb20gc2VsZWN0b3JzIHRoYXQgbWF5IGNvbnRhaW4gY3VzdG9tXG4gICAqIDotYWJwLSBzZWxlY3RvcnMgdG8gcHVyZSBDU1Mgc2VsZWN0b3JzIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VsZWN0XG4gICAqIGVsZW1lbnRzLlxuICAgKlxuICAgKiBUaGUgc2VsZWN0b3JzIHJldHVybmVkIGZyb20gdGhpcyBmdW5jdGlvbiBtYXkgYmUgaW52YWxpZGF0ZWQgYnkgRE9NXG4gICAqIG11dGF0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBzdWJ0cmVlIHRoZSBzdWJ0cmVlIHdlIHdvcmsgb25cbiAgICogQHBhcmFtIHtOb2RlW119IFt0YXJnZXRzXSB0aGUgbm9kZXMgd2UgYXJlIGludGVyZXN0ZWQgaW4uIE1heSBiZVxuICAgKiB1c2VkIHRvIG9wdGltaXplIHNlYXJjaC5cbiAgICovXG4gICpldmFsdWF0ZShzdWJ0cmVlLCB0YXJnZXRzKSB7XG4gICAgbGV0IHNlbGVjdG9ycyA9IHRoaXMuc2VsZWN0b3JzO1xuICAgIGZ1bmN0aW9uKiBldmFsdWF0ZUlubmVyKGluZGV4LCBwcmVmaXgsIGN1cnJlbnRTdWJ0cmVlKSB7XG4gICAgICBpZiAoaW5kZXggPj0gc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICB5aWVsZCBwcmVmaXg7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IFtzZWxlY3RvciwgZWxlbWVudF0gb2Ygc2VsZWN0b3JzW2luZGV4XS5nZXRTZWxlY3RvcnMoXG4gICAgICAgIHByZWZpeCwgY3VycmVudFN1YnRyZWUsIHRhcmdldHNcbiAgICAgICkpIHtcbiAgICAgICAgaWYgKHNlbGVjdG9yID09IG51bGwpIHtcbiAgICAgICAgICB5aWVsZCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlpZWxkKiBldmFsdWF0ZUlubmVyKGluZGV4ICsgMSwgc2VsZWN0b3IsIGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIGdldFNlbGVjdG9ycygpIGdlbmVyYXRvciBhYm92ZSBoYWQgdG8gcnVuIHNvbWUgaGVhdnlcbiAgICAgIC8vIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoKSBjYWxsIHdoaWNoIGRpZG4ndCBwcm9kdWNlIGFueSByZXN1bHRzLCBtYWtlXG4gICAgICAvLyBzdXJlIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBwb2ludCB3aGVyZSBleGVjdXRpb24gY2FuIHBhdXNlLlxuICAgICAgeWllbGQgbnVsbDtcbiAgICB9XG4gICAgeWllbGQqIGV2YWx1YXRlSW5uZXIoMCwgXCJcIiwgc3VidHJlZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgcGF0dGVybiBtYXRjaGVzIGEgc3BlY2lmaWMgZWxlbWVudFxuICAgKiBAcGFyYW0ge05vZGV9IFt0YXJnZXRdIHRoZSBlbGVtZW50IHdlJ3JlIGludGVyZXN0ZWQgaW4gY2hlY2tpbmcgZm9yXG4gICAqIG1hdGNoZXMgb24uXG4gICAqIEBwYXJhbSB7Tm9kZX0gc3VidHJlZSB0aGUgc3VidHJlZSB3ZSB3b3JrIG9uXG4gICAqIEByZXR1cm4ge2Jvb2x9XG4gICAqL1xuICBtYXRjaGVzKHRhcmdldCwgc3VidHJlZSkge1xuICAgIGxldCB0YXJnZXRGaWx0ZXIgPSBbdGFyZ2V0XTtcbiAgICBpZiAodGhpcy5tYXliZUNvbnRhaW5zU2libGluZ0NvbWJpbmF0b3JzKSB7XG4gICAgICB0YXJnZXRGaWx0ZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGxldCBzZWxlY3RvckdlbmVyYXRvciA9IHRoaXMuZXZhbHVhdGUoc3VidHJlZSwgdGFyZ2V0RmlsdGVyKTtcbiAgICBmb3IgKGxldCBzZWxlY3RvciBvZiBzZWxlY3RvckdlbmVyYXRvcikge1xuICAgICAgaWYgKHNlbGVjdG9yICYmIHRhcmdldC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc2V0U3R5bGVzKHN0eWxlcykge1xuICAgIGZvciAobGV0IHNlbGVjdG9yIG9mIHRoaXMuc2VsZWN0b3JzKSB7XG4gICAgICBpZiAoc2VsZWN0b3IuZGVwZW5kc09uU3R5bGVzKSB7XG4gICAgICAgIHNlbGVjdG9yLnNldFN0eWxlcyhzdHlsZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0TXV0YXRpb25UeXBlcyhtdXRhdGlvbnMpIHtcbiAgbGV0IHR5cGVzID0gbmV3IFNldCgpO1xuXG4gIGZvciAobGV0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuICAgIHR5cGVzLmFkZChtdXRhdGlvbi50eXBlKTtcblxuICAgIC8vIFRoZXJlIGFyZSBvbmx5IDMgdHlwZXMgb2YgbXV0YXRpb25zOiBcImF0dHJpYnV0ZXNcIiwgXCJjaGFyYWN0ZXJEYXRhXCIsIGFuZFxuICAgIC8vIFwiY2hpbGRMaXN0XCIuXG4gICAgaWYgKHR5cGVzLnNpemUgPT0gMykge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHR5cGVzO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0TXV0YXRpb25UYXJnZXRzKG11dGF0aW9ucykge1xuICBpZiAoIW11dGF0aW9ucykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbGV0IHRhcmdldHMgPSBuZXcgU2V0KCk7XG5cbiAgZm9yIChsZXQgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG4gICAgaWYgKG11dGF0aW9uLnR5cGUgPT0gXCJjaGlsZExpc3RcIikge1xuICAgICAgLy8gV2hlbiBuZXcgbm9kZXMgYXJlIGFkZGVkLCB3ZSdyZSBpbnRlcmVzdGVkIGluIHRoZSBhZGRlZCBub2RlcyByYXRoZXJcbiAgICAgIC8vIHRoYW4gdGhlIHBhcmVudC5cbiAgICAgIGZvciAobGV0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuICAgICAgICB0YXJnZXRzLmFkZChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChtdXRhdGlvbi5yZW1vdmVkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB0YXJnZXRzLmFkZChtdXRhdGlvbi50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRhcmdldHMuYWRkKG11dGF0aW9uLnRhcmdldCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFsuLi50YXJnZXRzXTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyUGF0dGVybnMocGF0dGVybnMsIHtzdHlsZXNoZWV0cywgbXV0YXRpb25zfSkge1xuICBpZiAoIXN0eWxlc2hlZXRzICYmICFtdXRhdGlvbnMpIHtcbiAgICByZXR1cm4gcGF0dGVybnMuc2xpY2UoKTtcbiAgfVxuXG4gIGxldCBtdXRhdGlvblR5cGVzID0gbXV0YXRpb25zID8gZXh0cmFjdE11dGF0aW9uVHlwZXMobXV0YXRpb25zKSA6IG51bGw7XG5cbiAgcmV0dXJuIHBhdHRlcm5zLmZpbHRlcihcbiAgICBwYXR0ZXJuID0+IChzdHlsZXNoZWV0cyAmJiBwYXR0ZXJuLmRlcGVuZHNPblN0eWxlcykgfHxcbiAgICAgICAgICAgICAgIChtdXRhdGlvbnMgJiYgcGF0dGVybi5tYXRjaGVzTXV0YXRpb25UeXBlcyhtdXRhdGlvblR5cGVzKSlcbiAgKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkT2JzZXJ2ZUF0dHJpYnV0ZXMocGF0dGVybnMpIHtcbiAgcmV0dXJuIHBhdHRlcm5zLnNvbWUocGF0dGVybiA9PiBwYXR0ZXJuLm1heWJlRGVwZW5kc09uQXR0cmlidXRlcyk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZE9ic2VydmVDaGFyYWN0ZXJEYXRhKHBhdHRlcm5zKSB7XG4gIHJldHVybiBwYXR0ZXJucy5zb21lKHBhdHRlcm4gPT4gcGF0dGVybi5kZXBlbmRzT25DaGFyYWN0ZXJEYXRhKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkT2JzZXJ2ZVN0eWxlcyhwYXR0ZXJucykge1xuICByZXR1cm4gcGF0dGVybnMuc29tZShwYXR0ZXJuID0+IHBhdHRlcm4uZGVwZW5kc09uU3R5bGVzKTtcbn1cblxuLyoqXG4gKiBAY2FsbGJhY2sgaGlkZUVsZW1zRnVuY1xuICogQHBhcmFtIHtOb2RlW119IGVsZW1lbnRzIEVsZW1lbnRzIG9uIHRoZSBwYWdlIHRoYXQgc2hvdWxkIGJlIGhpZGRlblxuICogQHBhcmFtIHtzdHJpbmdbXX0gZWxlbWVudEZpbHRlcnNcbiAqICAgVGhlIGZpbHRlciB0ZXh0IHRoYXQgY2F1c2VkIHRoZSBlbGVtZW50cyB0byBiZSBoaWRkZW5cbiAqL1xuXG4vKipcbiAqIEBjYWxsYmFjayB1bmhpZGVFbGVtc0Z1bmNcbiAqIEBwYXJhbSB7Tm9kZVtdfSBlbGVtZW50cyBFbGVtZW50cyBvbiB0aGUgcGFnZSB0aGF0IHNob3VsZCBiZSBoaWRkZW5cbiAqL1xuXG5cbi8qKlxuICogTWFuYWdlcyB0aGUgZnJvbnQtZW5kIHByb2Nlc3Npbmcgb2YgZWxlbWVudCBoaWRpbmcgZW11bGF0aW9uIGZpbHRlcnMuXG4gKi9cbmV4cG9ydHMuRWxlbUhpZGVFbXVsYXRpb24gPSBjbGFzcyBFbGVtSGlkZUVtdWxhdGlvbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge21vZHVsZTpjb250ZW50L2VsZW1IaWRlRW11bGF0aW9ufmhpZGVFbGVtc0Z1bmN9IGhpZGVFbGVtc0Z1bmNcbiAgICogICBBIGNhbGxiYWNrIHRoYXQgc2hvdWxkIGJlIHByb3ZpZGVkIHRvIGRvIHRoZSBhY3R1YWwgZWxlbWVudCBoaWRpbmcuXG4gICAqIEBwYXJhbSB7bW9kdWxlOmNvbnRlbnQvZWxlbUhpZGVFbXVsYXRpb25+dW5oaWRlRWxlbXNGdW5jfSB1bmhpZGVFbGVtc0Z1bmNcbiAgICogICBBIGNhbGxiYWNrIHRoYXQgc2hvdWxkIGJlIHByb3ZpZGVkIHRvIHVuaGlkZSBwcmV2aW91c2x5IGhpZGRlbiBlbGVtZW50cy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGhpZGVFbGVtc0Z1bmMgPSAoKSA9PiB7fSwgdW5oaWRlRWxlbXNGdW5jID0gKCkgPT4ge30pIHtcbiAgICB0aGlzLl9maWx0ZXJpbmdJblByb2dyZXNzID0gZmFsc2U7XG4gICAgdGhpcy5fbmV4dEZpbHRlcmluZ1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2xhc3RJbnZvY2F0aW9uID0gLW1pbkludm9jYXRpb25JbnRlcnZhbDtcbiAgICB0aGlzLl9zY2hlZHVsZWRQcm9jZXNzaW5nID0gbnVsbDtcblxuICAgIHRoaXMuZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLmhpZGVFbGVtc0Z1bmMgPSBoaWRlRWxlbXNGdW5jO1xuICAgIHRoaXMudW5oaWRlRWxlbXNGdW5jID0gdW5oaWRlRWxlbXNGdW5jO1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLm9ic2VydmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5oaWRkZW5FbGVtZW50cyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGlzU2FtZU9yaWdpbihzdHlsZXNoZWV0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBuZXcgVVJMKHN0eWxlc2hlZXQuaHJlZikub3JpZ2luID09IHRoaXMuZG9jdW1lbnQubG9jYXRpb24ub3JpZ2luO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgLy8gSW52YWxpZCBVUkwsIGFzc3VtZSB0aGF0IGl0IGlzIGZpcnN0LXBhcnR5LlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBzZWxlY3RvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgdGhlIHNlbGVjdG9yIHRvIHBhcnNlXG4gICAqIEByZXR1cm4ge0FycmF5fSBzZWxlY3RvcnMgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0cyxcbiAgICogb3IgbnVsbCBpbiBjYXNlIG9mIGVycm9ycy5cbiAgICovXG4gIHBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgICBpZiAoc2VsZWN0b3IubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBsZXQgbWF0Y2ggPSBhYnBTZWxlY3RvclJlZ2V4cC5leGVjKHNlbGVjdG9yKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICByZXR1cm4gW25ldyBQbGFpblNlbGVjdG9yKHNlbGVjdG9yKV07XG4gICAgfVxuXG4gICAgbGV0IHNlbGVjdG9ycyA9IFtdO1xuICAgIGlmIChtYXRjaC5pbmRleCA+IDApIHtcbiAgICAgIHNlbGVjdG9ycy5wdXNoKG5ldyBQbGFpblNlbGVjdG9yKHNlbGVjdG9yLnN1YnN0cmluZygwLCBtYXRjaC5pbmRleCkpKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRJbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgIGxldCBjb250ZW50ID0gcGFyc2VTZWxlY3RvckNvbnRlbnQoc2VsZWN0b3IsIHN0YXJ0SW5kZXgpO1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgY29uc29sZS53YXJuKG5ldyBTeW50YXhFcnJvcihcIkZhaWxlZCB0byBwYXJzZSBBZGJsb2NrIFBsdXMgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgc2VsZWN0b3IgJHtzZWxlY3Rvcn0gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZHVlIHRvIHVubWF0Y2hlZCBwYXJlbnRoZXNlcy5cIikpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChtYXRjaFsxXSA9PSBcIi1hYnAtcHJvcGVydGllc1wiKSB7XG4gICAgICBzZWxlY3RvcnMucHVzaChuZXcgUHJvcHNTZWxlY3Rvcihjb250ZW50LnRleHQpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobWF0Y2hbMV0gPT0gXCItYWJwLWhhc1wiIHx8IG1hdGNoWzFdID09IFwiaGFzXCIpIHtcbiAgICAgIGxldCBoYXNTZWxlY3RvcnMgPSB0aGlzLnBhcnNlU2VsZWN0b3IoY29udGVudC50ZXh0KTtcbiAgICAgIGlmIChoYXNTZWxlY3RvcnMgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHNlbGVjdG9ycy5wdXNoKG5ldyBIYXNTZWxlY3RvcihoYXNTZWxlY3RvcnMpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobWF0Y2hbMV0gPT0gXCItYWJwLWNvbnRhaW5zXCIgfHwgbWF0Y2hbMV0gPT0gXCJoYXMtdGV4dFwiKSB7XG4gICAgICBzZWxlY3RvcnMucHVzaChuZXcgQ29udGFpbnNTZWxlY3Rvcihjb250ZW50LnRleHQpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwieHBhdGhcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VsZWN0b3JzLnB1c2gobmV3IFhQYXRoU2VsZWN0b3IoY29udGVudC50ZXh0KSk7XG4gICAgICB9XG4gICAgICBjYXRjaCAoe21lc3NhZ2V9KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICAgICBcIkZhaWxlZCB0byBwYXJzZSBBZGJsb2NrIFBsdXMgXCIgK1xuICAgICAgICAgICAgYHNlbGVjdG9yICR7c2VsZWN0b3J9LCBpbnZhbGlkIGAgK1xuICAgICAgICAgICAgYHhwYXRoOiAke2NvbnRlbnQudGV4dH0gYCArXG4gICAgICAgICAgICBgZXJyb3I6ICR7bWVzc2FnZX0uYFxuICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobWF0Y2hbMV0gPT0gXCJub3RcIikge1xuICAgICAgbGV0IG5vdFNlbGVjdG9ycyA9IHRoaXMucGFyc2VTZWxlY3Rvcihjb250ZW50LnRleHQpO1xuICAgICAgaWYgKG5vdFNlbGVjdG9ycyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBhbGwgb2YgdGhlIGlubmVyIHNlbGVjdG9ycyBhcmUgUGxhaW5TZWxlY3RvcnMsIHRoZW4gd2VcbiAgICAgIC8vIGRvbid0IGFjdHVhbGx5IG5lZWQgdG8gdXNlIG91ciBzZWxlY3RvciBhdCBhbGwuIFdlJ3JlIGJldHRlclxuICAgICAgLy8gb2ZmIGRlbGVnYXRpbmcgdG8gdGhlIGJyb3dzZXIgOm5vdCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgIGlmIChub3RTZWxlY3RvcnMuZXZlcnkocyA9PiBzIGluc3RhbmNlb2YgUGxhaW5TZWxlY3RvcikpIHtcbiAgICAgICAgc2VsZWN0b3JzLnB1c2gobmV3IFBsYWluU2VsZWN0b3IoYDpub3QoJHtjb250ZW50LnRleHR9KWApKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzZWxlY3RvcnMucHVzaChuZXcgTm90U2VsZWN0b3Iobm90U2VsZWN0b3JzKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gdGhpcyBpcyBhbiBlcnJvciwgY2FuJ3QgcGFyc2Ugc2VsZWN0b3IuXG4gICAgICBjb25zb2xlLndhcm4obmV3IFN5bnRheEVycm9yKFwiRmFpbGVkIHRvIHBhcnNlIEFkYmxvY2sgUGx1cyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBzZWxlY3RvciAke3NlbGVjdG9yfSwgaW52YWxpZCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYHBzZXVkby1jbGFzcyA6JHttYXRjaFsxXX0oKS5gKSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgc3VmZml4ID0gdGhpcy5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yLnN1YnN0cmluZyhjb250ZW50LmVuZCArIDEpKTtcbiAgICBpZiAoc3VmZml4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHNlbGVjdG9ycy5wdXNoKC4uLnN1ZmZpeCk7XG5cbiAgICBpZiAoc2VsZWN0b3JzLmxlbmd0aCA9PSAxICYmIHNlbGVjdG9yc1swXSBpbnN0YW5jZW9mIENvbnRhaW5zU2VsZWN0b3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihuZXcgU3ludGF4RXJyb3IoXCJGYWlsZWQgdG8gcGFyc2UgQWRibG9jayBQbHVzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYHNlbGVjdG9yICR7c2VsZWN0b3J9LCBjYW4ndCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJoYXZlIGEgbG9uZWx5IDotYWJwLWNvbnRhaW5zKCkuXCIpKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0b3JzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHRoZSBydWxlcyBvdXQgb2YgQ1NTIHN0eWxlc2hlZXRzXG4gICAqIEBwYXJhbSB7Q1NTU3R5bGVTaGVldFtdfSBbc3R5bGVzaGVldHNdIFRoZSBsaXN0IG9mIHN0eWxlc2hlZXRzIHRvXG4gICAqIHJlYWQuXG4gICAqIEByZXR1cm4ge0NTU1N0eWxlUnVsZVtdfVxuICAgKi9cbiAgX3JlYWRDc3NSdWxlcyhzdHlsZXNoZWV0cykge1xuICAgIGxldCBjc3NTdHlsZXMgPSBbXTtcblxuICAgIGZvciAobGV0IHN0eWxlc2hlZXQgb2Ygc3R5bGVzaGVldHMgfHwgW10pIHtcbiAgICAgIC8vIEV4cGxpY2l0bHkgaWdub3JlIHRoaXJkLXBhcnR5IHN0eWxlc2hlZXRzIHRvIGVuc3VyZSBjb25zaXN0ZW50IGJlaGF2aW9yXG4gICAgICAvLyBiZXR3ZWVuIEZpcmVmb3ggYW5kIENocm9tZS5cbiAgICAgIGlmICghdGhpcy5pc1NhbWVPcmlnaW4oc3R5bGVzaGVldCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBydWxlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIHJ1bGVzID0gc3R5bGVzaGVldC5jc3NSdWxlcztcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIE9uIEZpcmVmb3gsIHRoZXJlIGlzIGEgY2hhbmNlIHRoYXQgYW4gSW52YWxpZEFjY2Vzc0Vycm9yXG4gICAgICAgIC8vIGdldCB0aHJvd24gd2hlbiBhY2Nlc3NpbmcgY3NzUnVsZXMuIEp1c3Qgc2tpcCB0aGUgc3R5bGVzaGVldFxuICAgICAgICAvLyBpbiB0aGF0IGNhc2UuXG4gICAgICAgIC8vIFNlZSBodHRwczovL3NlYXJjaGZveC5vcmcvbW96aWxsYS1jZW50cmFsL3Jldi9mNjVkNzUyOGUzNGVmMWE3NjY1YjRhMWE3YjdjZGIxMzg4ZmNkM2FhL2xheW91dC9zdHlsZS9TdHlsZVNoZWV0LmNwcCM2OTlcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICghcnVsZXMpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgICAgaWYgKHJ1bGUudHlwZSAhPSBydWxlLlNUWUxFX1JVTEUpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNzc1N0eWxlcy5wdXNoKHN0cmluZ2lmeVN0eWxlKHJ1bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNzc1N0eWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgdGhlIGN1cnJlbnQgZG9jdW1lbnQgYW5kIGFwcGxpZXMgYWxsIHJ1bGVzIHRvIGl0LlxuICAgKiBAcGFyYW0ge0NTU1N0eWxlU2hlZXRbXX0gW3N0eWxlc2hlZXRzXVxuICAgKiAgICBUaGUgbGlzdCBvZiBuZXcgc3R5bGVzaGVldHMgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIGRvY3VtZW50IGFuZFxuICAgKiAgICBtYWRlIHJlcHJvY2Vzc2luZyBuZWNlc3NhcnkuIFRoaXMgcGFyYW1ldGVyIHNob3VsZG4ndCBiZSBwYXNzZWQgaW4gZm9yXG4gICAqICAgIHRoZSBpbml0aWFsIHByb2Nlc3NpbmcsIGFsbCBvZiBkb2N1bWVudCdzIHN0eWxlc2hlZXRzIHdpbGwgYmUgY29uc2lkZXJlZFxuICAgKiAgICB0aGVuIGFuZCBhbGwgcnVsZXMsIGluY2x1ZGluZyB0aGUgb25lcyBub3QgZGVwZW5kZW50IG9uIHN0eWxlcy5cbiAgICogQHBhcmFtIHtNdXRhdGlvblJlY29yZFtdfSBbbXV0YXRpb25zXVxuICAgKiAgICBUaGUgbGlzdCBvZiBET00gbXV0YXRpb25zIHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGFuZFxuICAgKiAgICBtYWRlIHJlcHJvY2Vzc2luZyBuZWNlc3NhcnkuIFRoaXMgcGFyYW1ldGVyIHNob3VsZG4ndCBiZSBwYXNzZWQgaW4gZm9yXG4gICAqICAgIHRoZSBpbml0aWFsIHByb2Nlc3NpbmcsIHRoZSBlbnRpcmUgZG9jdW1lbnQgd2lsbCBiZSBjb25zaWRlcmVkXG4gICAqICAgIHRoZW4gYW5kIGFsbCBydWxlcywgaW5jbHVkaW5nIHRoZSBvbmVzIG5vdCBkZXBlbmRlbnQgb24gdGhlIERPTS5cbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICogICAgQSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIG9uY2UgYWxsIGZpbHRlcmluZyBpcyBjb21wbGV0ZWRcbiAgICovXG4gIGFzeW5jIF9hZGRTZWxlY3RvcnMoc3R5bGVzaGVldHMsIG11dGF0aW9ucykge1xuICAgIGlmICh0ZXN0SW5mbykge1xuICAgICAgdGVzdEluZm8ubGFzdFByb2Nlc3NlZEVsZW1lbnRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgbGV0IGRlYWRsaW5lID0gbmV3SWRsZURlYWRsaW5lKCk7XG5cbiAgICBpZiAoc2hvdWxkT2JzZXJ2ZVN0eWxlcyh0aGlzLnBhdHRlcm5zKSkge1xuICAgICAgdGhpcy5fcmVmcmVzaFBhdHRlcm5TdHlsZXMoKTtcbiAgICB9XG5cbiAgICBsZXQgcGF0dGVybnNUb0NoZWNrID0gZmlsdGVyUGF0dGVybnMoXG4gICAgICB0aGlzLnBhdHRlcm5zLCB7c3R5bGVzaGVldHMsIG11dGF0aW9uc31cbiAgICApO1xuXG4gICAgbGV0IHRhcmdldHMgPSBleHRyYWN0TXV0YXRpb25UYXJnZXRzKG11dGF0aW9ucyk7XG5cbiAgICBsZXQgZWxlbWVudHNUb0hpZGUgPSBbXTtcbiAgICBsZXQgZWxlbWVudEZpbHRlcnMgPSBbXTtcbiAgICBsZXQgZWxlbWVudHNUb1VuaGlkZSA9IG5ldyBTZXQodGhpcy5oaWRkZW5FbGVtZW50cy5rZXlzKCkpO1xuXG4gICAgZm9yIChsZXQgcGF0dGVybiBvZiBwYXR0ZXJuc1RvQ2hlY2spIHtcbiAgICAgIGxldCBldmFsdWF0aW9uVGFyZ2V0cyA9IHRhcmdldHM7XG5cbiAgICAgIC8vIElmIHRoZSBwYXR0ZXJuIGFwcGVhcnMgdG8gY29udGFpbiBhbnkgc2libGluZyBjb21iaW5hdG9ycywgd2UgY2FuJ3RcbiAgICAgIC8vIGVhc2lseSBvcHRpbWl6ZSBiYXNlZCBvbiB0aGUgbXV0YXRpb24gdGFyZ2V0cy4gU2luY2UgdGhpcyBpcyBhXG4gICAgICAvLyBzcGVjaWFsIGNhc2UsIHNraXAgdGhlIG9wdGltaXphdGlvbi4gQnkgc2V0dGluZyBpdCB0byBudWxsIGhlcmUgd2VcbiAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBwcm9jZXNzIHRoZSBlbnRpcmUgRE9NLlxuICAgICAgaWYgKHBhdHRlcm4ubWF5YmVDb250YWluc1NpYmxpbmdDb21iaW5hdG9ycykge1xuICAgICAgICBldmFsdWF0aW9uVGFyZ2V0cyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGxldCBnZW5lcmF0b3IgPSBwYXR0ZXJuLmV2YWx1YXRlKHRoaXMuZG9jdW1lbnQsIGV2YWx1YXRpb25UYXJnZXRzKTtcbiAgICAgIGZvciAobGV0IHNlbGVjdG9yIG9mIGdlbmVyYXRvcikge1xuICAgICAgICBpZiAoc2VsZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmhpZGRlbkVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgICAgICAgICBlbGVtZW50c1RvSGlkZS5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgICBlbGVtZW50RmlsdGVycy5wdXNoKHBhdHRlcm4udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudHNUb1VuaGlkZS5kZWxldGUoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlYWRsaW5lLnRpbWVSZW1haW5pbmcoKSA8PSAwKSB7XG4gICAgICAgICAgZGVhZGxpbmUgPSBhd2FpdCB5aWVsZFRocmVhZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2hpZGVFbGVtcyhlbGVtZW50c1RvSGlkZSwgZWxlbWVudEZpbHRlcnMpO1xuXG4gICAgLy8gVGhlIHNlYXJjaCBmb3IgZWxlbWVudHMgdG8gaGlkZSBpdCBvcHRpbWl6ZWQgdG8gZmluZCBuZXcgdGhpbmdzXG4gICAgLy8gdG8gaGlkZSBxdWlja2x5LCBieSBub3QgY2hlY2tpbmcgYWxsIHBhdHRlcm5zIGFuZCBub3QgY2hlY2tpbmdcbiAgICAvLyB0aGUgZnVsbCBET00uIFRoYXQncyB3aHkgd2UgbmVlZCB0byBkbyBhIG1vcmUgdGhvcm91Z2ggY2hlY2tcbiAgICAvLyBmb3IgZWFjaCByZW1haW5pbmcgZWxlbWVudCB0aGF0IG1pZ2h0IG5lZWQgdG8gYmUgdW5oaWRkZW4sXG4gICAgLy8gY2hlY2tpbmcgYWxsIHBhdHRlcm5zLlxuICAgIGZvciAobGV0IGVsZW0gb2YgZWxlbWVudHNUb1VuaGlkZSkge1xuICAgICAgaWYgKCFlbGVtLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgIC8vIGVsZW1lbnRzIHRoYXQgYXJlIG5vIGxvbmdlciBpbiB0aGUgRE9NIHNob3VsZCBiZSB1bmhpZGRlblxuICAgICAgICAvLyBpbiBjYXNlIHRoZXkncmUgZXZlciByZWFkZGVkLCBhbmQgdGhlbiBmb3Jnb3R0ZW4gYWJvdXQgc29cbiAgICAgICAgLy8gd2UgZG9uJ3QgY2F1c2UgYSBtZW1vcnkgbGVhay5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgbWF0Y2hlc0FueSA9IHRoaXMucGF0dGVybnMuc29tZShwYXR0ZXJuID0+IHBhdHRlcm4ubWF0Y2hlcyhcbiAgICAgICAgZWxlbSwgdGhpcy5kb2N1bWVudFxuICAgICAgKSk7XG4gICAgICBpZiAobWF0Y2hlc0FueSkge1xuICAgICAgICBlbGVtZW50c1RvVW5oaWRlLmRlbGV0ZShlbGVtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlYWRsaW5lLnRpbWVSZW1haW5pbmcoKSA8PSAwKSB7XG4gICAgICAgIGRlYWRsaW5lID0gYXdhaXQgeWllbGRUaHJlYWQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fdW5oaWRlRWxlbXMoQXJyYXkuZnJvbShlbGVtZW50c1RvVW5oaWRlKSk7XG4gIH1cblxuICBfaGlkZUVsZW1zKGVsZW1lbnRzVG9IaWRlLCBlbGVtZW50RmlsdGVycykge1xuICAgIGlmIChlbGVtZW50c1RvSGlkZS5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmhpZGVFbGVtc0Z1bmMoZWxlbWVudHNUb0hpZGUsIGVsZW1lbnRGaWx0ZXJzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHNUb0hpZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5oaWRkZW5FbGVtZW50cy5zZXQoZWxlbWVudHNUb0hpZGVbaV0sIGVsZW1lbnRGaWx0ZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfdW5oaWRlRWxlbXMoZWxlbWVudHNUb1VuaGlkZSkge1xuICAgIGlmIChlbGVtZW50c1RvVW5oaWRlLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMudW5oaWRlRWxlbXNGdW5jKGVsZW1lbnRzVG9VbmhpZGUpO1xuICAgICAgZm9yIChsZXQgZWxlbSBvZiBlbGVtZW50c1RvVW5oaWRlKSB7XG4gICAgICAgIHRoaXMuaGlkZGVuRWxlbWVudHMuZGVsZXRlKGVsZW0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtZWQgYW55IHNjaGVkdWxlZCBwcm9jZXNzaW5nLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGFzeW5jcm9ub3VzLCBhbmQgc2hvdWxkIG5vdCBiZSBydW4gbXVsdGlwbGVcbiAgICogdGltZXMgaW4gcGFyYWxsZWwuIFRoZSBmbGFnIGBfZmlsdGVyaW5nSW5Qcm9ncmVzc2AgaXMgc2V0IGFuZFxuICAgKiB1bnNldCBzbyB5b3UgY2FuIGNoZWNrIGlmIGl0J3MgYWxyZWFkeSBydW5uaW5nLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKiAgQSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIG9uY2UgYWxsIGZpbHRlcmluZyBpcyBjb21wbGV0ZWRcbiAgICovXG4gIGFzeW5jIF9wcm9jZXNzRmlsdGVyaW5nKCkge1xuICAgIGlmICh0aGlzLl9maWx0ZXJpbmdJblByb2dyZXNzKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJFbGVtSGlkZUVtdWxhdGlvbiBzY2hlZHVsaW5nIGVycm9yOiBcIiArXG4gICAgICAgICAgICAgICAgICAgXCJUcmllZCB0byBwcm9jZXNzIGZpbHRlcmluZyBpbiBwYXJhbGxlbC5cIik7XG4gICAgICBpZiAodGVzdEluZm8pIHtcbiAgICAgICAgdGVzdEluZm8uZmFpbGVkQXNzZXJ0aW9ucy5wdXNoKFxuICAgICAgICAgIFwiVHJpZWQgdG8gcHJvY2VzcyBmaWx0ZXJpbmcgaW4gcGFyYWxsZWxcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcGFyYW1zID0gdGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZyB8fCB7fTtcbiAgICB0aGlzLl9zY2hlZHVsZWRQcm9jZXNzaW5nID0gbnVsbDtcbiAgICB0aGlzLl9maWx0ZXJpbmdJblByb2dyZXNzID0gdHJ1ZTtcbiAgICB0aGlzLl9uZXh0RmlsdGVyaW5nU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5fYWRkU2VsZWN0b3JzKFxuICAgICAgcGFyYW1zLnN0eWxlc2hlZXRzLFxuICAgICAgcGFyYW1zLm11dGF0aW9uc1xuICAgICk7XG4gICAgdGhpcy5fbGFzdEludm9jYXRpb24gPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB0aGlzLl9maWx0ZXJpbmdJblByb2dyZXNzID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuX3NjaGVkdWxlZFByb2Nlc3NpbmcpIHtcbiAgICAgIHRoaXMuX3NjaGVkdWxlTmV4dEZpbHRlcmluZygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIG5ldyBjaGFuZ2VzIHRvIHRoZSBsaXN0IG9mIGZpbHRlcnMgZm9yIHRoZSBuZXh0IHRpbWVcbiAgICogZmlsdGVyaW5nIGlzIHJ1bi5cbiAgICogQHBhcmFtIHtDU1NTdHlsZVNoZWV0W119IFtzdHlsZXNoZWV0c11cbiAgICogICAgbmV3IHN0eWxlc2hlZXRzIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIG9taXR0ZWRcbiAgICogICAgZm9yIGZ1bGwgcmVwcm9jZXNzaW5nLlxuICAgKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkW119IFttdXRhdGlvbnNdXG4gICAqICAgIG5ldyBET00gbXV0YXRpb25zIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIG9taXR0ZWRcbiAgICogICAgZm9yIGZ1bGwgcmVwcm9jZXNzaW5nLlxuICAgKi9cbiAgX2FwcGVuZFNjaGVkdWxlZFByb2Nlc3Npbmcoc3R5bGVzaGVldHMsIG11dGF0aW9ucykge1xuICAgIGlmICghdGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZykge1xuICAgICAgLy8gVGhlcmUgaXNuJ3QgYW55dGhpbmcgc2NoZWR1bGVkIHlldC4gTWFrZSB0aGUgc2NoZWR1bGUuXG4gICAgICB0aGlzLl9zY2hlZHVsZWRQcm9jZXNzaW5nID0ge3N0eWxlc2hlZXRzLCBtdXRhdGlvbnN9O1xuICAgIH1cbiAgICBlbHNlIGlmICghc3R5bGVzaGVldHMgJiYgIW11dGF0aW9ucykge1xuICAgICAgLy8gVGhlIG5ldyByZXF1ZXN0IHdhcyB0byByZXByb2Nlc3MgZXZlcnl0aGluZywgYW5kIHNvIGFueVxuICAgICAgLy8gcHJldmlvdXMgZmlsdGVycyBhcmUgaXJyZWxldmFudC5cbiAgICAgIHRoaXMuX3NjaGVkdWxlZFByb2Nlc3NpbmcgPSB7fTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZy5zdHlsZXNoZWV0cyB8fFxuICAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlZFByb2Nlc3NpbmcubXV0YXRpb25zKSB7XG4gICAgICAvLyBUaGUgcHJldmlvdXMgZmlsdGVycyBhcmUgbm90IHRvIGZpbHRlciBldmVyeXRoaW5nLCBzbyB0aGUgbmV3XG4gICAgICAvLyBwYXJhbWV0ZXJzIG1hdHRlci4gUHVzaCB0aGVtIG9udG8gdGhlIGFwcHJvcHJpYXRlIGxpc3RzLlxuICAgICAgaWYgKHN0eWxlc2hlZXRzKSB7XG4gICAgICAgIGlmICghdGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZy5zdHlsZXNoZWV0cykge1xuICAgICAgICAgIHRoaXMuX3NjaGVkdWxlZFByb2Nlc3Npbmcuc3R5bGVzaGVldHMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zY2hlZHVsZWRQcm9jZXNzaW5nLnN0eWxlc2hlZXRzLnB1c2goLi4uc3R5bGVzaGVldHMpO1xuICAgICAgfVxuICAgICAgaWYgKG11dGF0aW9ucykge1xuICAgICAgICBpZiAoIXRoaXMuX3NjaGVkdWxlZFByb2Nlc3NpbmcubXV0YXRpb25zKSB7XG4gICAgICAgICAgdGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZy5tdXRhdGlvbnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zY2hlZHVsZWRQcm9jZXNzaW5nLm11dGF0aW9ucy5wdXNoKC4uLm11dGF0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gdGhpcy5fc2NoZWR1bGVkUHJvY2Vzc2luZyBpcyBhbHJlYWR5IGdvaW5nIHRvIHJlY2hlY2tcbiAgICAgIC8vIGV2ZXJ5dGhpbmcsIHNvIG5vIG5lZWQgdG8gZG8gYW55dGhpbmcgaGVyZS5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGUgZmlsdGVyaW5nIHRvIGJlIHByb2Nlc3NlZCBpbiB0aGUgZnV0dXJlLCBvciBzdGFydFxuICAgKiBwcm9jZXNzaW5nIGltbWVkaWF0ZWx5LlxuICAgKlxuICAgKiBJZiBwcm9jZXNzaW5nIGlzIGFscmVhZHkgc2NoZWR1bGVkLCB0aGlzIGRvZXMgbm90aGluZy5cbiAgICovXG4gIF9zY2hlZHVsZU5leHRGaWx0ZXJpbmcoKSB7XG4gICAgaWYgKHRoaXMuX25leHRGaWx0ZXJpbmdTY2hlZHVsZWQgfHwgdGhpcy5fZmlsdGVyaW5nSW5Qcm9ncmVzcykge1xuICAgICAgLy8gVGhlIG5leHQgb25lIGhhcyBhbHJlYWR5IGJlZW4gc2NoZWR1bGVkLiBPdXIgbmV3IGV2ZW50cyBhcmVcbiAgICAgIC8vIG9uIHRoZSBxdWV1ZSwgc28gbm90aGluZyBtb3JlIHRvIGRvLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAvLyBEb2N1bWVudCBpc24ndCBmdWxseSBsb2FkZWQgeWV0LCBzbyBzY2hlZHVsZSBvdXIgZmlyc3RcbiAgICAgIC8vIGZpbHRlcmluZyBhcyBzb29uIGFzIHRoYXQncyBkb25lLlxuICAgICAgdGhpcy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcIkRPTUNvbnRlbnRMb2FkZWRcIixcbiAgICAgICAgKCkgPT4gdGhpcy5fcHJvY2Vzc0ZpbHRlcmluZygpLFxuICAgICAgICB7b25jZTogdHJ1ZX1cbiAgICAgICk7XG4gICAgICB0aGlzLl9uZXh0RmlsdGVyaW5nU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9sYXN0SW52b2NhdGlvbiA8XG4gICAgICAgICAgICAgbWluSW52b2NhdGlvbkludGVydmFsKSB7XG4gICAgICAvLyBJdCBoYXNuJ3QgYmVlbiBsb25nIGVub3VnaCBzaW5jZSBvdXIgbGFzdCBmaWx0ZXIuIFNldCB0aGVcbiAgICAgIC8vIHRpbWVvdXQgZm9yIHdoZW4gaXQncyB0aW1lIGZvciB0aGF0LlxuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgKCkgPT4gdGhpcy5fcHJvY2Vzc0ZpbHRlcmluZygpLFxuICAgICAgICBtaW5JbnZvY2F0aW9uSW50ZXJ2YWwgLSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9sYXN0SW52b2NhdGlvbilcbiAgICAgICk7XG4gICAgICB0aGlzLl9uZXh0RmlsdGVyaW5nU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXZSBjYW4gYWN0dWFsbHkganVzdCBzdGFydCBmaWx0ZXJpbmcgaW1tZWRpYXRlbHkhXG4gICAgICB0aGlzLl9wcm9jZXNzRmlsdGVyaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlLXJ1biBmaWx0ZXJpbmcgZWl0aGVyIGltbWVkaWF0ZWx5IG9yIHF1ZXVlZC5cbiAgICogQHBhcmFtIHtDU1NTdHlsZVNoZWV0W119IFtzdHlsZXNoZWV0c11cbiAgICogICAgbmV3IHN0eWxlc2hlZXRzIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIG9taXR0ZWRcbiAgICogICAgZm9yIGZ1bGwgcmVwcm9jZXNzaW5nLlxuICAgKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkW119IFttdXRhdGlvbnNdXG4gICAqICAgIG5ldyBET00gbXV0YXRpb25zIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIG9taXR0ZWRcbiAgICogICAgZm9yIGZ1bGwgcmVwcm9jZXNzaW5nLlxuICAgKi9cbiAgcXVldWVGaWx0ZXJpbmcoc3R5bGVzaGVldHMsIG11dGF0aW9ucykge1xuICAgIHRoaXMuX2FwcGVuZFNjaGVkdWxlZFByb2Nlc3Npbmcoc3R5bGVzaGVldHMsIG11dGF0aW9ucyk7XG4gICAgdGhpcy5fc2NoZWR1bGVOZXh0RmlsdGVyaW5nKCk7XG4gIH1cblxuICBfcmVmcmVzaFBhdHRlcm5TdHlsZXMoc3R5bGVzaGVldCkge1xuICAgIGxldCBhbGxDc3NSdWxlcyA9IHRoaXMuX3JlYWRDc3NSdWxlcyh0aGlzLmRvY3VtZW50LnN0eWxlU2hlZXRzKTtcbiAgICBmb3IgKGxldCBwYXR0ZXJuIG9mIHRoaXMucGF0dGVybnMpIHtcbiAgICAgIHBhdHRlcm4uc2V0U3R5bGVzKGFsbENzc1J1bGVzKTtcbiAgICB9XG4gIH1cblxuICBvbkxvYWQoZXZlbnQpIHtcbiAgICBsZXQgc3R5bGVzaGVldCA9IGV2ZW50LnRhcmdldC5zaGVldDtcbiAgICBpZiAoc3R5bGVzaGVldCkge1xuICAgICAgdGhpcy5xdWV1ZUZpbHRlcmluZyhbc3R5bGVzaGVldF0pO1xuICAgIH1cbiAgfVxuXG4gIG9ic2VydmUobXV0YXRpb25zKSB7XG4gICAgaWYgKHRlc3RJbmZvKSB7XG4gICAgICAvLyBJbiB0ZXN0IG1vZGUsIGZpbHRlciBvdXQgYW55IG11dGF0aW9ucyBsaWtlbHkgZG9uZSBieSB1c1xuICAgICAgLy8gKGkuZS4gc3R5bGU9XCJkaXNwbGF5OiBub25lICFpbXBvcnRhbnRcIikuIFRoaXMgbWFrZXMgaXQgZWFzaWVyIHRvXG4gICAgICAvLyBvYnNlcnZlIGhvdyB0aGUgY29kZSByZXNwb25kcyB0byBET00gbXV0YXRpb25zLlxuICAgICAgbXV0YXRpb25zID0gbXV0YXRpb25zLmZpbHRlcihcbiAgICAgICAgKHt0eXBlLCBhdHRyaWJ1dGVOYW1lLCB0YXJnZXQ6IHtzdHlsZTogbmV3VmFsdWV9LCBvbGRWYWx1ZX0pID0+XG4gICAgICAgICAgISh0eXBlID09IFwiYXR0cmlidXRlc1wiICYmIGF0dHJpYnV0ZU5hbWUgPT0gXCJzdHlsZVwiICYmXG4gICAgICAgICAgICBuZXdWYWx1ZS5kaXNwbGF5ID09IFwibm9uZVwiICYmXG4gICAgICAgICAgICB0b0NTU1N0eWxlRGVjbGFyYXRpb24ob2xkVmFsdWUpLmRpc3BsYXkgIT0gXCJub25lXCIpXG4gICAgICApO1xuXG4gICAgICBpZiAobXV0YXRpb25zLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnF1ZXVlRmlsdGVyaW5nKG51bGwsIG11dGF0aW9ucyk7XG4gIH1cblxuICBhcHBseShwYXR0ZXJucykge1xuICAgIGlmICh0aGlzLnBhdHRlcm5zKSB7XG4gICAgICBsZXQgcmVtb3ZlZFBhdHRlcm5zID0gW107XG4gICAgICBmb3IgKGxldCBvbGRQYXR0ZXJuIG9mIHRoaXMucGF0dGVybnMpIHtcbiAgICAgICAgaWYgKCFwYXR0ZXJucy5maW5kKG5ld1BhdHRlcm4gPT4gbmV3UGF0dGVybi50ZXh0ID09IG9sZFBhdHRlcm4udGV4dCkpIHtcbiAgICAgICAgICByZW1vdmVkUGF0dGVybnMucHVzaChvbGRQYXR0ZXJuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGVsZW1lbnRzVG9VbmhpZGUgPSBbXTtcbiAgICAgIGZvciAobGV0IHBhdHRlcm4gb2YgcmVtb3ZlZFBhdHRlcm5zKSB7XG4gICAgICAgIGZvciAobGV0IFtlbGVtZW50LCBmaWx0ZXJdIG9mIHRoaXMuaGlkZGVuRWxlbWVudHMpIHtcbiAgICAgICAgICBpZiAoZmlsdGVyID09IHBhdHRlcm4udGV4dCkge1xuICAgICAgICAgICAgZWxlbWVudHNUb1VuaGlkZS5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnRzVG9VbmhpZGUubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl91bmhpZGVFbGVtcyhlbGVtZW50c1RvVW5oaWRlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBhdHRlcm5zID0gW107XG4gICAgZm9yIChsZXQgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgbGV0IHNlbGVjdG9ycyA9IHRoaXMucGFyc2VTZWxlY3RvcihwYXR0ZXJuLnNlbGVjdG9yKTtcbiAgICAgIGlmIChzZWxlY3RvcnMgIT0gbnVsbCAmJiBzZWxlY3RvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLnBhdHRlcm5zLnB1c2gobmV3IFBhdHRlcm4oc2VsZWN0b3JzLCBwYXR0ZXJuLnRleHQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYXR0ZXJucy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnF1ZXVlRmlsdGVyaW5nKCk7XG5cbiAgICAgIGxldCBhdHRyaWJ1dGVzID0gc2hvdWxkT2JzZXJ2ZUF0dHJpYnV0ZXModGhpcy5wYXR0ZXJucyk7XG4gICAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoXG4gICAgICAgIHRoaXMuZG9jdW1lbnQsXG4gICAgICAgIHtcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgYXR0cmlidXRlcyxcbiAgICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogYXR0cmlidXRlcyAmJiAhIXRlc3RJbmZvLFxuICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHNob3VsZE9ic2VydmVDaGFyYWN0ZXJEYXRhKHRoaXMucGF0dGVybnMpLFxuICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChzaG91bGRPYnNlcnZlU3R5bGVzKHRoaXMucGF0dGVybnMpKSB7XG4gICAgICAgIGxldCBvbkxvYWQgPSB0aGlzLm9uTG9hZC5iaW5kKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5kb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICAgICAgICAgIHRoaXMuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgb25Mb2FkLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIG9uTG9hZCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGlzY29ubmVjdCgpIHtcbiAgICB0aGlzLm9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLl91bmhpZGVFbGVtcyhBcnJheS5mcm9tKHRoaXMuaGlkZGVuRWxlbWVudHMua2V5cygpKSk7XG4gIH1cbn07XG4iLCIvKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWRibG9jayBQbHVzIDxodHRwczovL2FkYmxvY2twbHVzLm9yZy8+LFxuICogQ29weXJpZ2h0IChDKSAyMDA2LXByZXNlbnQgZXllbyBHbWJIXG4gKlxuICogQWRibG9jayBQbHVzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzIGFzXG4gKiBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbi5cbiAqXG4gKiBBZGJsb2NrIFBsdXMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIEFkYmxvY2sgUGx1cy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiogQG1vZHVsZSAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgcGF0dGVybnMgdGhhdFxuICogYHtAbGluayBtb2R1bGU6cGF0dGVybnMuY29tcGlsZVBhdHRlcm5zIGNvbXBpbGVQYXR0ZXJucygpfWAgd2lsbCBjb21waWxlXG4gKiBpbnRvIHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG4gKiBAdHlwZSB7bnVtYmVyfVxuICovXG5jb25zdCBDT01QSUxFX1BBVFRFUk5TX01BWCA9IDEwMDtcblxuLyoqXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBtYXRjaCB0aGUgYF5gIHN1ZmZpeCBpbiBhbiBvdGhlcndpc2UgbGl0ZXJhbFxuICogcGF0dGVybi5cbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbmxldCBzZXBhcmF0b3JSZWdFeHAgPSAvW1xceDAwLVxceDI0XFx4MjYtXFx4MkNcXHgyRlxceDNBLVxceDQwXFx4NUItXFx4NUVcXHg2MFxceDdCLVxceDdGXS87XG5cbmxldCBmaWx0ZXJUb1JlZ0V4cCA9XG4vKipcbiAqIENvbnZlcnRzIGZpbHRlciB0ZXh0IGludG8gcmVndWxhciBleHByZXNzaW9uIHN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgYXMgaW4gRmlsdGVyKClcbiAqIEByZXR1cm4ge3N0cmluZ30gcmVndWxhciBleHByZXNzaW9uIHJlcHJlc2VudGF0aW9uIG9mIGZpbHRlciB0ZXh0XG4gKiBAcGFja2FnZVxuICovXG5leHBvcnRzLmZpbHRlclRvUmVnRXhwID0gZnVuY3Rpb24gZmlsdGVyVG9SZWdFeHAodGV4dCkge1xuICAvLyByZW1vdmUgbXVsdGlwbGUgd2lsZGNhcmRzXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcKisvZywgXCIqXCIpO1xuXG4gIC8vIHJlbW92ZSBsZWFkaW5nIHdpbGRjYXJkXG4gIGlmICh0ZXh0WzBdID09IFwiKlwiKSB7XG4gICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDEpO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHRyYWlsaW5nIHdpbGRjYXJkXG4gIGlmICh0ZXh0W3RleHQubGVuZ3RoIC0gMV0gPT0gXCIqXCIpIHtcbiAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgdGV4dC5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gcmVtb3ZlIGFuY2hvcnMgZm9sbG93aW5nIHNlcGFyYXRvciBwbGFjZWhvbGRlclxuICAgIC5yZXBsYWNlKC9cXF5cXHwkLywgXCJeXCIpXG4gICAgLy8gZXNjYXBlIHNwZWNpYWwgc3ltYm9sc1xuICAgIC5yZXBsYWNlKC9cXFcvZywgXCJcXFxcJCZcIilcbiAgICAvLyByZXBsYWNlIHdpbGRjYXJkcyBieSAuKlxuICAgIC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIilcbiAgICAvLyBwcm9jZXNzIHNlcGFyYXRvciBwbGFjZWhvbGRlcnMgKGFsbCBBTlNJIGNoYXJhY3RlcnMgYnV0IGFscGhhbnVtZXJpY1xuICAgIC8vIGNoYXJhY3RlcnMgYW5kIF8lLi0pXG4gICAgLnJlcGxhY2UoL1xcXFxcXF4vZywgYCg/OiR7c2VwYXJhdG9yUmVnRXhwLnNvdXJjZX18JClgKVxuICAgIC8vIHByb2Nlc3MgZXh0ZW5kZWQgYW5jaG9yIGF0IGV4cHJlc3Npb24gc3RhcnRcbiAgICAucmVwbGFjZSgvXlxcXFxcXHxcXFxcXFx8LywgXCJeW1xcXFx3XFxcXC1dKzpcXFxcLysoPzpbXlxcXFwvXStcXFxcLik/XCIpXG4gICAgLy8gcHJvY2VzcyBhbmNob3IgYXQgZXhwcmVzc2lvbiBzdGFydFxuICAgIC5yZXBsYWNlKC9eXFxcXFxcfC8sIFwiXlwiKVxuICAgIC8vIHByb2Nlc3MgYW5jaG9yIGF0IGV4cHJlc3Npb24gZW5kXG4gICAgLnJlcGxhY2UoL1xcXFxcXHwkLywgXCIkXCIpO1xufTtcblxuLyoqXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBtYXRjaCB0aGUgYHx8YCBwcmVmaXggaW4gYW4gb3RoZXJ3aXNlIGxpdGVyYWxcbiAqIHBhdHRlcm4uXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG5sZXQgZXh0ZW5kZWRBbmNob3JSZWdFeHAgPSBuZXcgUmVnRXhwKGZpbHRlclRvUmVnRXhwKFwifHxcIikgKyBcIiRcIik7XG5cbi8qKlxuICogUmVndWxhciBleHByZXNzaW9uIGZvciBtYXRjaGluZyBhIGtleXdvcmQgaW4gYSBmaWx0ZXIuXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG5sZXQga2V5d29yZFJlZ0V4cCA9IC9bXmEtejAtOSUqXVthLXowLTklXXsyLH0oPz1bXmEtejAtOSUqXSkvO1xuXG4vKipcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgbWF0Y2hpbmcgYWxsIGtleXdvcmRzIGluIGEgZmlsdGVyLlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xubGV0IGFsbEtleXdvcmRzUmVnRXhwID0gbmV3IFJlZ0V4cChrZXl3b3JkUmVnRXhwLCBcImdcIik7XG5cbi8qKlxuICogQSBgQ29tcGlsZWRQYXR0ZXJuc2Agb2JqZWN0IHJlcHJlc2VudHMgdGhlIGNvbXBpbGVkIHZlcnNpb24gb2YgbXVsdGlwbGUgVVJMXG4gKiByZXF1ZXN0IHBhdHRlcm5zLiBJdCBpcyByZXR1cm5lZCBieVxuICogYHtAbGluayBtb2R1bGU6cGF0dGVybnMuY29tcGlsZVBhdHRlcm5zIGNvbXBpbGVQYXR0ZXJucygpfWAuXG4gKi9cbmNsYXNzIENvbXBpbGVkUGF0dGVybnMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3Qgd2l0aCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9ucyBmb3IgY2FzZS1zZW5zaXRpdmVcbiAgICogYW5kIGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2hpbmcgcmVzcGVjdGl2ZWx5LlxuICAgKiBAcGFyYW0gez9SZWdFeHB9IFtjYXNlU2Vuc2l0aXZlXVxuICAgKiBAcGFyYW0gez9SZWdFeHB9IFtjYXNlSW5zZW5zaXRpdmVdXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjYXNlU2Vuc2l0aXZlLCBjYXNlSW5zZW5zaXRpdmUpIHtcbiAgICB0aGlzLl9jYXNlU2Vuc2l0aXZlID0gY2FzZVNlbnNpdGl2ZTtcbiAgICB0aGlzLl9jYXNlSW5zZW5zaXRpdmUgPSBjYXNlSW5zZW5zaXRpdmU7XG4gIH1cblxuICAvKipcbiAgICogVGVzdHMgd2hldGhlciB0aGUgZ2l2ZW4gVVJMIHJlcXVlc3QgbWF0Y2hlcyB0aGUgcGF0dGVybnMgdXNlZCB0byBjcmVhdGVcbiAgICogdGhpcyBvYmplY3QuXG4gICAqIEBwYXJhbSB7bW9kdWxlOnVybC5VUkxSZXF1ZXN0fSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgdGVzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuICgodGhpcy5fY2FzZVNlbnNpdGl2ZSAmJlxuICAgICAgICAgICAgIHRoaXMuX2Nhc2VTZW5zaXRpdmUudGVzdChyZXF1ZXN0LmhyZWYpKSB8fFxuICAgICAgICAgICAgKHRoaXMuX2Nhc2VJbnNlbnNpdGl2ZSAmJlxuICAgICAgICAgICAgIHRoaXMuX2Nhc2VJbnNlbnNpdGl2ZS50ZXN0KHJlcXVlc3QubG93ZXJDYXNlSHJlZikpKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGVzIHBhdHRlcm5zIGZyb20gdGhlIGdpdmVuIGZpbHRlcnMgaW50byBhIHNpbmdsZVxuICogYHtAbGluayBtb2R1bGU6cGF0dGVybnN+Q29tcGlsZWRQYXR0ZXJucyBDb21waWxlZFBhdHRlcm5zfWAgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7bW9kdWxlOmZpbHRlckNsYXNzZXMuVVJMRmlsdGVyfFxuICogICAgICAgICBTZXQuPG1vZHVsZTpmaWx0ZXJDbGFzc2VzLlVSTEZpbHRlcj59IGZpbHRlcnNcbiAqICAgVGhlIGZpbHRlcnMuIElmIHRoZSBudW1iZXIgb2YgZmlsdGVycyBleGNlZWRzXG4gKiAgIGB7QGxpbmsgbW9kdWxlOnBhdHRlcm5zfkNPTVBJTEVfUEFUVEVSTlNfTUFYIENPTVBJTEVfUEFUVEVSTlNfTUFYfWAsIHRoZVxuICogICBmdW5jdGlvbiByZXR1cm5zIGBudWxsYC5cbiAqXG4gKiBAcmV0dXJucyB7P21vZHVsZTpwYXR0ZXJuc35Db21waWxlZFBhdHRlcm5zfVxuICpcbiAqIEBwYWNrYWdlXG4gKi9cbmV4cG9ydHMuY29tcGlsZVBhdHRlcm5zID0gZnVuY3Rpb24gY29tcGlsZVBhdHRlcm5zKGZpbHRlcnMpIHtcbiAgbGV0IGxpc3QgPSBBcnJheS5pc0FycmF5KGZpbHRlcnMpID8gZmlsdGVycyA6IFtmaWx0ZXJzXTtcblxuICAvLyBJZiB0aGUgbnVtYmVyIG9mIGZpbHRlcnMgaXMgdG9vIGxhcmdlLCBpdCBtYXkgY2hva2UgZXNwZWNpYWxseSBvbiBsb3ctZW5kXG4gIC8vIHBsYXRmb3Jtcy4gQXMgYSBwcmVjYXV0aW9uLCB3ZSByZWZ1c2UgdG8gY29tcGlsZS4gSWRlYWxseSB3ZSB3b3VsZCBjaGVja1xuICAvLyB0aGUgbGVuZ3RoIG9mIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gc291cmNlIHJhdGhlciB0aGFuIHRoZSBudW1iZXIgb2ZcbiAgLy8gZmlsdGVycywgYnV0IHRoaXMgaXMgZmFyIG1vcmUgc3RyYWlnaHRmb3J3YXJkIGFuZCBwcmFjdGljYWwuXG4gIGlmIChsaXN0Lmxlbmd0aCA+IENPTVBJTEVfUEFUVEVSTlNfTUFYKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBsZXQgY2FzZVNlbnNpdGl2ZSA9IFwiXCI7XG4gIGxldCBjYXNlSW5zZW5zaXRpdmUgPSBcIlwiO1xuXG4gIGZvciAobGV0IGZpbHRlciBvZiBmaWx0ZXJzKSB7XG4gICAgbGV0IHNvdXJjZSA9IGZpbHRlci51cmxQYXR0ZXJuLnJlZ2V4cFNvdXJjZTtcblxuICAgIGlmIChmaWx0ZXIubWF0Y2hDYXNlKSB7XG4gICAgICBjYXNlU2Vuc2l0aXZlICs9IHNvdXJjZSArIFwifFwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNhc2VJbnNlbnNpdGl2ZSArPSBzb3VyY2UgKyBcInxcIjtcbiAgICB9XG4gIH1cblxuICBsZXQgY2FzZVNlbnNpdGl2ZVJlZ0V4cCA9IG51bGw7XG4gIGxldCBjYXNlSW5zZW5zaXRpdmVSZWdFeHAgPSBudWxsO1xuXG4gIHRyeSB7XG4gICAgaWYgKGNhc2VTZW5zaXRpdmUpIHtcbiAgICAgIGNhc2VTZW5zaXRpdmVSZWdFeHAgPSBuZXcgUmVnRXhwKGNhc2VTZW5zaXRpdmUuc2xpY2UoMCwgLTEpKTtcbiAgICB9XG5cbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBjYXNlSW5zZW5zaXRpdmVSZWdFeHAgPSBuZXcgUmVnRXhwKGNhc2VJbnNlbnNpdGl2ZS5zbGljZSgwLCAtMSkpO1xuICAgIH1cbiAgfVxuICBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJdCBpcyBwb3NzaWJsZSBpbiB0aGVvcnkgZm9yIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYmUgdG9vIGxhcmdlXG4gICAgLy8gZGVzcGl0ZSBDT01QSUxFX1BBVFRFUk5TX01BWFxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21waWxlZFBhdHRlcm5zKGNhc2VTZW5zaXRpdmVSZWdFeHAsIGNhc2VJbnNlbnNpdGl2ZVJlZ0V4cCk7XG59O1xuXG4vKipcbiAqIFBhdHRlcm5zIGZvciBtYXRjaGluZyBhZ2FpbnN0IFVSTHMuXG4gKlxuICogSW50ZXJuYWxseSwgdGhpcyBtYXkgYmUgYSBSZWdFeHAgb3IgbWF0Y2ggZGlyZWN0bHkgYWdhaW5zdCB0aGVcbiAqIHBhdHRlcm4gZm9yIHNpbXBsZSBsaXRlcmFsIHBhdHRlcm5zLlxuICovXG5leHBvcnRzLlBhdHRlcm4gPSBjbGFzcyBQYXR0ZXJuIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXR0ZXJuIHBhdHRlcm4gdGhhdCByZXF1ZXN0cyBVUkxzIHNob3VsZCBiZVxuICAgKiBtYXRjaGVkIGFnYWluc3QgaW4gZmlsdGVyIHRleHQgbm90YXRpb25cbiAgICogQHBhcmFtIHtib29sfSBtYXRjaENhc2UgYHRydWVgIGlmIGNvbXBhcmlzb25zIG11c3QgYmUgY2FzZVxuICAgKiBzZW5zaXRpdmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4sIG1hdGNoQ2FzZSkge1xuICAgIHRoaXMubWF0Y2hDYXNlID0gbWF0Y2hDYXNlIHx8IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLm1hdGNoQ2FzZSkge1xuICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcbiAgICB9XG5cbiAgICBpZiAocGF0dGVybi5sZW5ndGggPj0gMiAmJlxuICAgICAgICBwYXR0ZXJuWzBdID09IFwiL1wiICYmXG4gICAgICAgIHBhdHRlcm5bcGF0dGVybi5sZW5ndGggLSAxXSA9PSBcIi9cIikge1xuICAgICAgLy8gVGhlIGZpbHRlciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiAtIGNvbnZlcnQgaXQgaW1tZWRpYXRlbHkgdG9cbiAgICAgIC8vIGNhdGNoIHN5bnRheCBlcnJvcnNcbiAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnN1YnN0cmluZygxLCBwYXR0ZXJuLmxlbmd0aCAtIDEpO1xuICAgICAgdGhpcy5fcmVnZXhwID0gbmV3IFJlZ0V4cChwYXR0ZXJuKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBQYXR0ZXJucyBsaWtlIC9mb28vYmFyLyogZXhpc3Qgc28gdGhhdCB0aGV5IGFyZSBub3QgdHJlYXRlZCBhcyByZWd1bGFyXG4gICAgICAvLyBleHByZXNzaW9ucy4gV2UgZHJvcCBhbnkgc3VwZXJmbHVvdXMgd2lsZGNhcmRzIGhlcmUgc28gb3VyXG4gICAgICAvLyBvcHRpbWl6YXRpb25zIGNhbiBraWNrIGluLlxuICAgICAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZSgvXlxcKisvLCBcIlwiKS5yZXBsYWNlKC9cXCorJC8sIFwiXCIpO1xuXG4gICAgICAvLyBObyBuZWVkIHRvIGNvbnZlcnQgdGhpcyBmaWx0ZXIgdG8gcmVndWxhciBleHByZXNzaW9uIHlldCwgZG8gaXQgb25cbiAgICAgIC8vIGRlbWFuZFxuICAgICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHBhdHRlcm4gaXMgYSBzdHJpbmcgb2YgbGl0ZXJhbCBjaGFyYWN0ZXJzIHdpdGhcbiAgICogbm8gd2lsZGNhcmRzIG9yIGFueSBvdGhlciBzcGVjaWFsIGNoYXJhY3RlcnMuXG4gICAqXG4gICAqIElmIHRoZSBwYXR0ZXJuIGlzIHByZWZpeGVkIHdpdGggYSBgfHxgIG9yIHN1ZmZpeGVkIHdpdGggYSBgXmAgYnV0IG90aGVyd2lzZVxuICAgKiBjb250YWlucyBubyBzcGVjaWFsIGNoYXJhY3RlcnMsIGl0IGlzIHN0aWxsIGNvbnNpZGVyZWQgdG8gYmUgYSBsaXRlcmFsXG4gICAqIHBhdHRlcm4uXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaXNMaXRlcmFsUGF0dGVybigpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMucGF0dGVybiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgIS9bKl58XS8udGVzdCh0aGlzLnBhdHRlcm4ucmVwbGFjZSgvXlxcfHsxLDJ9LywgXCJcIikucmVwbGFjZSgvW3xeXSQvLCBcIlwiKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVndWxhciBleHByZXNzaW9uIHRvIGJlIHVzZWQgd2hlbiB0ZXN0aW5nIGFnYWluc3QgdGhpcyBwYXR0ZXJuLlxuICAgKlxuICAgKiBudWxsIGlmIHRoZSBwYXR0ZXJuIGlzIG1hdGNoZWQgd2l0aG91dCB1c2luZyByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgKiBAdHlwZSB7UmVnRXhwfVxuICAgKi9cbiAgZ2V0IHJlZ2V4cCgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuX3JlZ2V4cCA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLl9yZWdleHAgPSB0aGlzLmlzTGl0ZXJhbFBhdHRlcm4oKSA/XG4gICAgICAgIG51bGwgOiBuZXcgUmVnRXhwKGZpbHRlclRvUmVnRXhwKHRoaXMucGF0dGVybikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVnZXhwO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhdHRlcm4gaW4gcmVndWxhciBleHByZXNzaW9uIG5vdGF0aW9uLiBUaGlzIHdpbGwgaGF2ZSBhIHZhbHVlXG4gICAqIGV2ZW4gaWYgYHJlZ2V4cGAgcmV0dXJucyBudWxsLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IHJlZ2V4cFNvdXJjZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVnZXhwID8gdGhpcy5fcmVnZXhwLnNvdXJjZSA6IGZpbHRlclRvUmVnRXhwKHRoaXMucGF0dGVybik7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIFVSTCByZXF1ZXN0IG1hdGNoZXMgdGhpcyBmaWx0ZXIncyBwYXR0ZXJuLlxuICAgKiBAcGFyYW0ge21vZHVsZTp1cmwuVVJMUmVxdWVzdH0gcmVxdWVzdCBUaGUgVVJMIHJlcXVlc3QgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgdGhlIFVSTCByZXF1ZXN0IG1hdGNoZXMuXG4gICAqL1xuICBtYXRjaGVzTG9jYXRpb24ocmVxdWVzdCkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMubWF0Y2hDYXNlID8gcmVxdWVzdC5ocmVmIDogcmVxdWVzdC5sb3dlckNhc2VIcmVmO1xuICAgIGxldCByZWdleHAgPSB0aGlzLnJlZ2V4cDtcbiAgICBpZiAocmVnZXhwKSB7XG4gICAgICByZXR1cm4gcmVnZXhwLnRlc3QobG9jYXRpb24pO1xuICAgIH1cblxuICAgIGxldCBwYXR0ZXJuID0gdGhpcy5wYXR0ZXJuO1xuICAgIGxldCBzdGFydHNXaXRoQW5jaG9yID0gcGF0dGVyblswXSA9PSBcInxcIjtcbiAgICBsZXQgc3RhcnRzV2l0aEV4dGVuZGVkQW5jaG9yID0gc3RhcnRzV2l0aEFuY2hvciAmJiBwYXR0ZXJuWzFdID09IFwifFwiO1xuICAgIGxldCBlbmRzV2l0aFNlcGFyYXRvciA9IHBhdHRlcm5bcGF0dGVybi5sZW5ndGggLSAxXSA9PSBcIl5cIjtcbiAgICBsZXQgZW5kc1dpdGhBbmNob3IgPSAhZW5kc1dpdGhTZXBhcmF0b3IgJiZcbiAgICAgICAgcGF0dGVybltwYXR0ZXJuLmxlbmd0aCAtIDFdID09IFwifFwiO1xuXG4gICAgaWYgKHN0YXJ0c1dpdGhFeHRlbmRlZEFuY2hvcikge1xuICAgICAgcGF0dGVybiA9IHBhdHRlcm4uc3Vic3RyKDIpO1xuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydHNXaXRoQW5jaG9yKSB7XG4gICAgICBwYXR0ZXJuID0gcGF0dGVybi5zdWJzdHIoMSk7XG4gICAgfVxuXG4gICAgaWYgKGVuZHNXaXRoU2VwYXJhdG9yIHx8IGVuZHNXaXRoQW5jaG9yKSB7XG4gICAgICBwYXR0ZXJuID0gcGF0dGVybi5zbGljZSgwLCAtMSk7XG4gICAgfVxuXG4gICAgbGV0IGluZGV4ID0gbG9jYXRpb24uaW5kZXhPZihwYXR0ZXJuKTtcblxuICAgIHdoaWxlIChpbmRleCAhPSAtMSkge1xuICAgICAgLy8gVGhlIFwifHxcIiBwcmVmaXggcmVxdWlyZXMgdGhhdCB0aGUgdGV4dCB0aGF0IGZvbGxvd3MgZG9lcyBub3Qgc3RhcnRcbiAgICAgIC8vIHdpdGggYSBmb3J3YXJkIHNsYXNoLlxuICAgICAgaWYgKChzdGFydHNXaXRoRXh0ZW5kZWRBbmNob3IgP1xuICAgICAgICAgICBsb2NhdGlvbltpbmRleF0gIT0gXCIvXCIgJiZcbiAgICAgICAgICAgZXh0ZW5kZWRBbmNob3JSZWdFeHAudGVzdChsb2NhdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpKSA6XG4gICAgICAgICAgIHN0YXJ0c1dpdGhBbmNob3IgP1xuICAgICAgICAgICBpbmRleCA9PSAwIDpcbiAgICAgICAgICAgdHJ1ZSkgJiZcbiAgICAgICAgICAoZW5kc1dpdGhTZXBhcmF0b3IgP1xuICAgICAgICAgICAhbG9jYXRpb25baW5kZXggKyBwYXR0ZXJuLmxlbmd0aF0gfHxcbiAgICAgICAgICAgc2VwYXJhdG9yUmVnRXhwLnRlc3QobG9jYXRpb25baW5kZXggKyBwYXR0ZXJuLmxlbmd0aF0pIDpcbiAgICAgICAgICAgZW5kc1dpdGhBbmNob3IgP1xuICAgICAgICAgICBpbmRleCA9PSBsb2NhdGlvbi5sZW5ndGggLSBwYXR0ZXJuLmxlbmd0aCA6XG4gICAgICAgICAgIHRydWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAocGF0dGVybiA9PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpbmRleCA9IGxvY2F0aW9uLmluZGV4T2YocGF0dGVybiwgaW5kZXggKyAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHBhdHRlcm4gaGFzIGtleXdvcmRzXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaGFzS2V5d29yZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMucGF0dGVybiAmJiBrZXl3b3JkUmVnRXhwLnRlc3QodGhpcy5wYXR0ZXJuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwga2V5d29yZHMgdGhhdCBjb3VsZCBiZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBwYXR0ZXJuXG4gICAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAgICovXG4gIGtleXdvcmRDYW5kaWRhdGVzKCkge1xuICAgIGlmICghdGhpcy5wYXR0ZXJuKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucGF0dGVybi50b0xvd2VyQ2FzZSgpLm1hdGNoKGFsbEtleXdvcmRzUmVnRXhwKTtcbiAgfVxufTtcbiIsIi8qIHdlYmV4dGVuc2lvbi1wb2x5ZmlsbCAtIHYwLjguMCAtIFR1ZSBBcHIgMjAgMjAyMSAxMToyNzozOCAqL1xuLyogLSotIE1vZGU6IGluZGVudC10YWJzLW1vZGU6IG5pbDsganMtaW5kZW50LWxldmVsOiAyIC0qLSAqL1xuLyogdmltOiBzZXQgc3RzPTIgc3c9MiBldCB0dz04MDogKi9cbi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uICovXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKHR5cGVvZiBicm93c2VyID09PSBcInVuZGVmaW5lZFwiIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihicm93c2VyKSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICBjb25zdCBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UgPSBcIlRoZSBtZXNzYWdlIHBvcnQgY2xvc2VkIGJlZm9yZSBhIHJlc3BvbnNlIHdhcyByZWNlaXZlZC5cIjtcbiAgY29uc3QgU0VORF9SRVNQT05TRV9ERVBSRUNBVElPTl9XQVJOSU5HID0gXCJSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5IHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSlcIjtcblxuICAvLyBXcmFwcGluZyB0aGUgYnVsayBvZiB0aGlzIHBvbHlmaWxsIGluIGEgb25lLXRpbWUtdXNlIGZ1bmN0aW9uIGlzIGEgbWlub3JcbiAgLy8gb3B0aW1pemF0aW9uIGZvciBGaXJlZm94LiBTaW5jZSBTcGlkZXJtb25rZXkgZG9lcyBub3QgZnVsbHkgcGFyc2UgdGhlXG4gIC8vIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gdW50aWwgdGhlIGZpcnN0IHRpbWUgaXQncyBjYWxsZWQsIGFuZCBzaW5jZSBpdCB3aWxsXG4gIC8vIG5ldmVyIGFjdHVhbGx5IG5lZWQgdG8gYmUgY2FsbGVkLCB0aGlzIGFsbG93cyB0aGUgcG9seWZpbGwgdG8gYmUgaW5jbHVkZWRcbiAgLy8gaW4gRmlyZWZveCBuZWFybHkgZm9yIGZyZWUuXG4gIGNvbnN0IHdyYXBBUElzID0gZXh0ZW5zaW9uQVBJcyA9PiB7XG4gICAgLy8gTk9URTogYXBpTWV0YWRhdGEgaXMgYXNzb2NpYXRlZCB0byB0aGUgY29udGVudCBvZiB0aGUgYXBpLW1ldGFkYXRhLmpzb24gZmlsZVxuICAgIC8vIGF0IGJ1aWxkIHRpbWUgYnkgcmVwbGFjaW5nIHRoZSBmb2xsb3dpbmcgXCJpbmNsdWRlXCIgd2l0aCB0aGUgY29udGVudCBvZiB0aGVcbiAgICAvLyBKU09OIGZpbGUuXG4gICAgY29uc3QgYXBpTWV0YWRhdGEgPSB7XG4gICAgICBcImFsYXJtc1wiOiB7XG4gICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xlYXJBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiYm9va21hcmtzXCI6IHtcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldENoaWxkcmVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFJlY2VudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRTdWJUcmVlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRyZWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlVHJlZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2VyQWN0aW9uXCI6IHtcbiAgICAgICAgXCJkaXNhYmxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJlbmFibGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlQmFja2dyb3VuZENvbG9yXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRUaXRsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuUG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3JcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0SWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VGl0bGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2luZ0RhdGFcIjoge1xuICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDYWNoZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDb29raWVzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZURvd25sb2Fkc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGb3JtRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVIaXN0b3J5XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUxvY2FsU3RvcmFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVQYXNzd29yZHNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlUGx1Z2luRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29tbWFuZHNcIjoge1xuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29udGV4dE1lbnVzXCI6IHtcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlQWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29va2llc1wiOiB7XG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxDb29raWVTdG9yZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiZGV2dG9vbHNcIjoge1xuICAgICAgICBcImluc3BlY3RlZFdpbmRvd1wiOiB7XG4gICAgICAgICAgXCJldmFsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDIsXG4gICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBhbmVsc1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDMsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMyxcbiAgICAgICAgICAgIFwic2luZ2xlQ2FsbGJhY2tBcmdcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbGVtZW50c1wiOiB7XG4gICAgICAgICAgICBcImNyZWF0ZVNpZGViYXJQYW5lXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJkb3dubG9hZHNcIjoge1xuICAgICAgICBcImNhbmNlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkb3dubG9hZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJlcmFzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGaWxlSWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXVzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGaWxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlc3VtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvd1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImV4dGVuc2lvblwiOiB7XG4gICAgICAgIFwiaXNBbGxvd2VkRmlsZVNjaGVtZUFjY2Vzc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJpc0FsbG93ZWRJbmNvZ25pdG9BY2Nlc3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImhpc3RvcnlcIjoge1xuICAgICAgICBcImFkZFVybFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlUmFuZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlVXJsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFZpc2l0c1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImkxOG5cIjoge1xuICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFjY2VwdExhbmd1YWdlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiaWRlbnRpdHlcIjoge1xuICAgICAgICBcImxhdW5jaFdlYkF1dGhGbG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJpZGxlXCI6IHtcbiAgICAgICAgXCJxdWVyeVN0YXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJtYW5hZ2VtZW50XCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFNlbGZcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0RW5hYmxlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1bmluc3RhbGxTZWxmXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJub3RpZmljYXRpb25zXCI6IHtcbiAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFBlcm1pc3Npb25MZXZlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInBhZ2VBY3Rpb25cIjoge1xuICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0UG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicGVybWlzc2lvbnNcIjoge1xuICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVxdWVzdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicnVudGltZVwiOiB7XG4gICAgICAgIFwiZ2V0QmFja2dyb3VuZFBhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0UGxhdGZvcm1JbmZvXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcIm9wZW5PcHRpb25zUGFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXF1ZXN0VXBkYXRlQ2hlY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE5hdGl2ZU1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VW5pbnN0YWxsVVJMXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzZXNzaW9uc1wiOiB7XG4gICAgICAgIFwiZ2V0RGV2aWNlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRSZWNlbnRseUNsb3NlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXN0b3JlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzdG9yYWdlXCI6IHtcbiAgICAgICAgXCJsb2NhbFwiOiB7XG4gICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYW5hZ2VkXCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzeW5jXCI6IHtcbiAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Qnl0ZXNJblVzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJ0YWJzXCI6IHtcbiAgICAgICAgXCJjYXB0dXJlVmlzaWJsZVRhYlwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGV0ZWN0TGFuZ3VhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGlzY2FyZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkdXBsaWNhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXhlY3V0ZVNjcmlwdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnb0JhY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ29Gb3J3YXJkXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZ2hsaWdodFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJpbnNlcnRDU1NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJxdWVyeVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZWxvYWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUNTU1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDNcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcInNldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInRvcFNpdGVzXCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIndlYk5hdmlnYXRpb25cIjoge1xuICAgICAgICBcImdldEFsbEZyYW1lc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGcmFtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2ViUmVxdWVzdFwiOiB7XG4gICAgICAgIFwiaGFuZGxlckJlaGF2aW9yQ2hhbmdlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2luZG93c1wiOiB7XG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRMYXN0Rm9jdXNlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChPYmplY3Qua2V5cyhhcGlNZXRhZGF0YSkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhcGktbWV0YWRhdGEuanNvbiBoYXMgbm90IGJlZW4gaW5jbHVkZWQgaW4gYnJvd3Nlci1wb2x5ZmlsbFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIFdlYWtNYXAgc3ViY2xhc3Mgd2hpY2ggY3JlYXRlcyBhbmQgc3RvcmVzIGEgdmFsdWUgZm9yIGFueSBrZXkgd2hpY2ggZG9lc1xuICAgICAqIG5vdCBleGlzdCB3aGVuIGFjY2Vzc2VkLCBidXQgYmVoYXZlcyBleGFjdGx5IGFzIGFuIG9yZGluYXJ5IFdlYWtNYXBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjcmVhdGVJdGVtXG4gICAgICogICAgICAgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSB2YWx1ZSBmb3IgYW55XG4gICAgICogICAgICAgIGtleSB3aGljaCBkb2VzIG5vdCBleGlzdCwgdGhlIGZpcnN0IHRpbWUgaXQgaXMgYWNjZXNzZWQuIFRoZVxuICAgICAqICAgICAgICBmdW5jdGlvbiByZWNlaXZlcywgYXMgaXRzIG9ubHkgYXJndW1lbnQsIHRoZSBrZXkgYmVpbmcgY3JlYXRlZC5cbiAgICAgKi9cbiAgICBjbGFzcyBEZWZhdWx0V2Vha01hcCBleHRlbmRzIFdlYWtNYXAge1xuICAgICAgY29uc3RydWN0b3IoY3JlYXRlSXRlbSwgaXRlbXMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VwZXIoaXRlbXMpO1xuICAgICAgICB0aGlzLmNyZWF0ZUl0ZW0gPSBjcmVhdGVJdGVtO1xuICAgICAgfVxuXG4gICAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgIHRoaXMuc2V0KGtleSwgdGhpcy5jcmVhdGVJdGVtKGtleSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGFuIG9iamVjdCB3aXRoIGEgYHRoZW5gIG1ldGhvZCwgYW5kIGNhblxuICAgICAqIHRoZXJlZm9yZSBiZSBhc3N1bWVkIHRvIGJlaGF2ZSBhcyBhIFByb21pc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBpcyB0aGVuYWJsZS5cbiAgICAgKi9cbiAgICBjb25zdCBpc1RoZW5hYmxlID0gdmFsdWUgPT4ge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0XG4gICAgICogdGhlIGdpdmVuIHByb21pc2UgYmFzZWQgb24gaG93IGl0IGlzIGNhbGxlZDpcbiAgICAgKlxuICAgICAqIC0gSWYsIHdoZW4gY2FsbGVkLCBgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yYCBjb250YWlucyBhIG5vbi1udWxsIG9iamVjdCxcbiAgICAgKiAgIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIHdpdGggdGhhdCB2YWx1ZS5cbiAgICAgKiAtIElmIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBleGFjdGx5IG9uZSBhcmd1bWVudCwgdGhlIHByb21pc2UgaXNcbiAgICAgKiAgIHJlc29sdmVkIHRvIHRoYXQgdmFsdWUuXG4gICAgICogLSBPdGhlcndpc2UsIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHRvIGFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIG9mIHRoZVxuICAgICAqICAgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvbWlzZVxuICAgICAqICAgICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgcmVzb2x1dGlvbiBhbmQgcmVqZWN0aW9uIGZ1bmN0aW9ucyBvZiBhXG4gICAgICogICAgICAgIHByb21pc2UuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvbWlzZS5yZXNvbHZlXG4gICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVzb2x1dGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlamVjdFxuICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlamVjdGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIHdyYXBwZWQgbWV0aG9kIHdoaWNoIGhhcyBjcmVhdGVkIHRoZSBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnXG4gICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgKiAgICAgICAgY2FsbGJhY2sgYXJndW1lbnRzIGlzIHJlc29sdmVkLiBCeSBkZWZhdWx0LCBpZiB0aGUgY2FsbGJhY2tcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICogICAgICAgIGFuIGFycmF5IGlmIG11bHRpcGxlIGFyZSBnaXZlbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cbiAgICAgKiAgICAgICAgVGhlIGdlbmVyYXRlZCBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBjb25zdCBtYWtlQ2FsbGJhY2sgPSAocHJvbWlzZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgIHJldHVybiAoLi4uY2FsbGJhY2tBcmdzKSA9PiB7XG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnIHx8XG4gICAgICAgICAgICAgICAgICAgKGNhbGxiYWNrQXJncy5sZW5ndGggPD0gMSAmJiBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyAhPT0gZmFsc2UpKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJnc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICAgIGNvbnN0IHBsdXJhbGl6ZUFyZ3VtZW50cyA9IChudW1BcmdzKSA9PiBudW1BcmdzID09IDEgPyBcImFyZ3VtZW50XCIgOiBcImFyZ3VtZW50c1wiO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gZm9yIGEgbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIG1ldGFkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiAgICAgICAgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aGljaCBpcyBiZWluZyB3cmFwcGVkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtZXRhZGF0YVxuICAgICAqICAgICAgICBNZXRhZGF0YSBhYm91dCB0aGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5taW5BcmdzXG4gICAgICogICAgICAgIFRoZSBtaW5pbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbXVzdCBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBmZXdlciB0aGFuIHRoaXMgbnVtYmVyIG9mIGFyZ3VtZW50cywgdGhlXG4gICAgICogICAgICAgIHdyYXBwZXIgd2lsbCByYWlzZSBhbiBleGNlcHRpb24uXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5tYXhBcmdzXG4gICAgICogICAgICAgIFRoZSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbWF5IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiAgICAgICAgZnVuY3Rpb24uIElmIGNhbGxlZCB3aXRoIG1vcmUgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgKiAgICAgICAgV2hldGhlciBvciBub3QgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCBvbmx5IHRoZSBmaXJzdFxuICAgICAqICAgICAgICBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2ssIGFsdGVybmF0aXZlbHkgYW4gYXJyYXkgb2YgYWxsIHRoZVxuICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAqICAgICAgICBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggb25seSBhIHNpbmdsZSBhcmd1bWVudCwgdGhhdCB3aWxsIGJlXG4gICAgICogICAgICAgIHJlc29sdmVkIHRvIHRoZSBwcm9taXNlLCB3aGlsZSBhbGwgYXJndW1lbnRzIHdpbGwgYmUgcmVzb2x2ZWQgYXNcbiAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9uKG9iamVjdCwgLi4uKil9XG4gICAgICogICAgICAgVGhlIGdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBBc3luY0Z1bmN0aW9uID0gKG5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gYXN5bmNGdW5jdGlvbldyYXBwZXIodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IGxlYXN0ICR7bWV0YWRhdGEubWluQXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWluQXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gbWV0YWRhdGEubWF4QXJncykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbW9zdCAke21ldGFkYXRhLm1heEFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1heEFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUaGlzIEFQSSBtZXRob2QgaGFzIGN1cnJlbnRseSBubyBjYWxsYmFjayBvbiBDaHJvbWUsIGJ1dCBpdCByZXR1cm4gYSBwcm9taXNlIG9uIEZpcmVmb3gsXG4gICAgICAgICAgICAvLyBhbmQgc28gdGhlIHBvbHlmaWxsIHdpbGwgdHJ5IHRvIGNhbGwgaXQgd2l0aCBhIGNhbGxiYWNrIGZpcnN0LCBhbmQgaXQgd2lsbCBmYWxsYmFja1xuICAgICAgICAgICAgLy8gdG8gbm90IHBhc3NpbmcgdGhlIGNhbGxiYWNrIGlmIHRoZSBmaXJzdCBjYWxsIGZhaWxzLlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNiRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAke25hbWV9IEFQSSBtZXRob2QgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciwgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhbGxpbmcgYmFjayB0byBjYWxsIGl0IHdpdGhvdXQgYSBjYWxsYmFjazogXCIsIGNiRXJyb3IpO1xuXG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcblxuICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIEFQSSBtZXRob2QgbWV0YWRhdGEsIHNvIHRoYXQgdGhlIG5leHQgQVBJIGNhbGxzIHdpbGwgbm90IHRyeSB0b1xuICAgICAgICAgICAgICAvLyB1c2UgdGhlIHVuc3VwcG9ydGVkIGNhbGxiYWNrIGFueW1vcmUuXG4gICAgICAgICAgICAgIG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgIG1ldGFkYXRhLm5vQ2FsbGJhY2sgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLm5vQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYW4gZXhpc3RpbmcgbWV0aG9kIG9mIHRoZSB0YXJnZXQgb2JqZWN0LCBzbyB0aGF0IGNhbGxzIHRvIGl0IGFyZVxuICAgICAqIGludGVyY2VwdGVkIGJ5IHRoZSBnaXZlbiB3cmFwcGVyIGZ1bmN0aW9uLiBUaGUgd3JhcHBlciBmdW5jdGlvbiByZWNlaXZlcyxcbiAgICAgKiBhcyBpdHMgZmlyc3QgYXJndW1lbnQsIHRoZSBvcmlnaW5hbCBgdGFyZ2V0YCBvYmplY3QsIGZvbGxvd2VkIGJ5IGVhY2ggb2ZcbiAgICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgb3JpZ2luYWwgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgb3JpZ2luYWwgdGFyZ2V0IG9iamVjdCB0aGF0IHRoZSB3cmFwcGVkIG1ldGhvZCBiZWxvbmdzIHRvLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZFxuICAgICAqICAgICAgICBUaGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuIFRoaXMgaXMgdXNlZCBhcyB0aGUgdGFyZ2V0IG9mIHRoZSBQcm94eVxuICAgICAqICAgICAgICBvYmplY3Qgd2hpY2ggaXMgY3JlYXRlZCB0byB3cmFwIHRoZSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gd3JhcHBlclxuICAgICAqICAgICAgICBUaGUgd3JhcHBlciBmdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgYSBkaXJlY3QgaW52b2NhdGlvblxuICAgICAqICAgICAgICBvZiB0aGUgd3JhcHBlZCBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8ZnVuY3Rpb24+fVxuICAgICAqICAgICAgICBBIFByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCwgd2hpY2ggaW52b2tlcyB0aGUgZ2l2ZW4gd3JhcHBlclxuICAgICAqICAgICAgICBtZXRob2QgaW4gaXRzIHBsYWNlLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBNZXRob2QgPSAodGFyZ2V0LCBtZXRob2QsIHdyYXBwZXIpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkobWV0aG9kLCB7XG4gICAgICAgIGFwcGx5KHRhcmdldE1ldGhvZCwgdGhpc09iaiwgYXJncykge1xuICAgICAgICAgIHJldHVybiB3cmFwcGVyLmNhbGwodGhpc09iaiwgdGFyZ2V0LCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgaGFzT3duUHJvcGVydHkgPSBGdW5jdGlvbi5jYWxsLmJpbmQoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBhbiBvYmplY3QgaW4gYSBQcm94eSB3aGljaCBpbnRlcmNlcHRzIGFuZCB3cmFwcyBjZXJ0YWluIG1ldGhvZHNcbiAgICAgKiBiYXNlZCBvbiB0aGUgZ2l2ZW4gYHdyYXBwZXJzYCBhbmQgYG1ldGFkYXRhYCBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgdGFyZ2V0IG9iamVjdCB0byB3cmFwLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFt3cmFwcGVycyA9IHt9XVxuICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBzcGVjaWFsIGNhc2VzLiBBbnlcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gcHJlc2VudCBpbiB0aGlzIG9iamVjdCB0cmVlIGlzIGNhbGxlZCBpbiBwbGFjZSBvZiB0aGVcbiAgICAgKiAgICAgICAgbWV0aG9kIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZS4gVGhlc2VcbiAgICAgKiAgICAgICAgd3JhcHBlciBtZXRob2RzIGFyZSBpbnZva2VkIGFzIGRlc2NyaWJlZCBpbiB7QHNlZSB3cmFwTWV0aG9kfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbbWV0YWRhdGEgPSB7fV1cbiAgICAgKiAgICAgICAgQW4gb2JqZWN0IHRyZWUgY29udGFpbmluZyBtZXRhZGF0YSB1c2VkIHRvIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVcbiAgICAgKiAgICAgICAgUHJvbWlzZS1iYXNlZCB3cmFwcGVyIGZ1bmN0aW9ucyBmb3IgYXN5bmNocm9ub3VzLiBBbnkgZnVuY3Rpb24gaW5cbiAgICAgKiAgICAgICAgdGhlIGB0YXJnZXRgIG9iamVjdCB0cmVlIHdoaWNoIGhhcyBhIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgb2JqZWN0XG4gICAgICogICAgICAgIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgbWV0YWRhdGFgIHRyZWUgaXMgcmVwbGFjZWQgd2l0aCBhblxuICAgICAqICAgICAgICBhdXRvbWF0aWNhbGx5LWdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLCBhcyBkZXNjcmliZWQgaW5cbiAgICAgKiAgICAgICAge0BzZWUgd3JhcEFzeW5jRnVuY3Rpb259XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8b2JqZWN0Pn1cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwT2JqZWN0ID0gKHRhcmdldCwgd3JhcHBlcnMgPSB7fSwgbWV0YWRhdGEgPSB7fSkgPT4ge1xuICAgICAgbGV0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIGxldCBoYW5kbGVycyA9IHtcbiAgICAgICAgaGFzKHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIHByb3AgaW4gdGFyZ2V0IHx8IHByb3AgaW4gY2FjaGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0KHByb3h5VGFyZ2V0LCBwcm9wLCByZWNlaXZlcikge1xuICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbcHJvcF07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCEocHJvcCBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB2YWx1ZSA9IHRhcmdldFtwcm9wXTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCBvbiB0aGUgdW5kZXJseWluZyBvYmplY3QuIENoZWNrIGlmIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFueSB3cmFwcGluZy5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3cmFwcGVyc1twcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBzcGVjaWFsLWNhc2Ugd3JhcHBlciBmb3IgdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcnNbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhc3luYyBtZXRob2QgdGhhdCB3ZSBoYXZlIG1ldGFkYXRhIGZvci4gQ3JlYXRlIGFcbiAgICAgICAgICAgICAgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBpdC5cbiAgICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSB3cmFwQXN5bmNGdW5jdGlvbihwcm9wLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWV0aG9kIHRoYXQgd2UgZG9uJ3Qga25vdyBvciBjYXJlIGFib3V0LiBSZXR1cm4gdGhlXG4gICAgICAgICAgICAgIC8vIG9yaWdpbmFsIG1ldGhvZCwgYm91bmQgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgKGhhc093blByb3BlcnR5KHdyYXBwZXJzLCBwcm9wKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBwcm9wKSkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gb2JqZWN0IHRoYXQgd2UgbmVlZCB0byBkbyBzb21lIHdyYXBwaW5nIGZvciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIC8vIG9mLiBDcmVhdGUgYSBzdWItb2JqZWN0IHdyYXBwZXIgZm9yIGl0IHdpdGggdGhlIGFwcHJvcHJpYXRlIGNoaWxkXG4gICAgICAgICAgICAvLyBtZXRhZGF0YS5cbiAgICAgICAgICAgIHZhbHVlID0gd3JhcE9iamVjdCh2YWx1ZSwgd3JhcHBlcnNbcHJvcF0sIG1ldGFkYXRhW3Byb3BdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIipcIikpIHtcbiAgICAgICAgICAgIC8vIFdyYXAgYWxsIHByb3BlcnRpZXMgaW4gKiBuYW1lc3BhY2UuXG4gICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtcIipcIl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGRvIGFueSB3cmFwcGluZyBmb3IgdGhpcyBwcm9wZXJ0eSxcbiAgICAgICAgICAgIC8vIHNvIGp1c3QgZm9yd2FyZCBhbGwgYWNjZXNzIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwge1xuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BdO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0KHByb3h5VGFyZ2V0LCBwcm9wLCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICBpZiAocHJvcCBpbiBjYWNoZSkge1xuICAgICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZmluZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wLCBkZXNjKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkoY2FjaGUsIHByb3AsIGRlc2MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2FjaGUsIHByb3ApO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgLy8gUGVyIGNvbnRyYWN0IG9mIHRoZSBQcm94eSBBUEksIHRoZSBcImdldFwiIHByb3h5IGhhbmRsZXIgbXVzdCByZXR1cm4gdGhlXG4gICAgICAvLyBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgdGFyZ2V0IGlmIHRoYXQgdmFsdWUgaXMgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZFxuICAgICAgLy8gbm9uLWNvbmZpZ3VyYWJsZS4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjcmVhdGUgYW4gb2JqZWN0IHdpdGggdGhlXG4gICAgICAvLyBwcm90b3R5cGUgc2V0IHRvIGB0YXJnZXRgIGluc3RlYWQgb2YgdXNpbmcgYHRhcmdldGAgZGlyZWN0bHkuXG4gICAgICAvLyBPdGhlcndpc2Ugd2UgY2Fubm90IHJldHVybiBhIGN1c3RvbSBvYmplY3QgZm9yIEFQSXMgdGhhdFxuICAgICAgLy8gYXJlIGRlY2xhcmVkIHJlYWQtb25seSBhbmQgbm9uLWNvbmZpZ3VyYWJsZSwgc3VjaCBhcyBgY2hyb21lLmRldnRvb2xzYC5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgcHJveHkgaGFuZGxlcnMgdGhlbXNlbHZlcyB3aWxsIHN0aWxsIHVzZSB0aGUgb3JpZ2luYWwgYHRhcmdldGBcbiAgICAgIC8vIGluc3RlYWQgb2YgdGhlIGBwcm94eVRhcmdldGAsIHNvIHRoYXQgdGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYXJlXG4gICAgICAvLyBkZXJlZmVyZW5jZWQgdmlhIHRoZSBvcmlnaW5hbCB0YXJnZXRzLlxuICAgICAgbGV0IHByb3h5VGFyZ2V0ID0gT2JqZWN0LmNyZWF0ZSh0YXJnZXQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm94eShwcm94eVRhcmdldCwgaGFuZGxlcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2V0IG9mIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBvYmplY3QsIHdoaWNoIGhhbmRsZXNcbiAgICAgKiB3cmFwcGluZyBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdGhhdCB0aG9zZSBtZXNzYWdlcyBhcmUgcGFzc2VkLlxuICAgICAqXG4gICAgICogQSBzaW5nbGUgd3JhcHBlciBpcyBjcmVhdGVkIGZvciBlYWNoIGxpc3RlbmVyIGZ1bmN0aW9uLCBhbmQgc3RvcmVkIGluIGFcbiAgICAgKiBtYXAuIFN1YnNlcXVlbnQgY2FsbHMgdG8gYGFkZExpc3RlbmVyYCwgYGhhc0xpc3RlbmVyYCwgb3IgYHJlbW92ZUxpc3RlbmVyYFxuICAgICAqIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB3cmFwcGVyLCBzbyB0aGF0ICBhdHRlbXB0cyB0byByZW1vdmUgYVxuICAgICAqIHByZXZpb3VzbHktYWRkZWQgbGlzdGVuZXIgd29yayBhcyBleHBlY3RlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RGVmYXVsdFdlYWtNYXA8ZnVuY3Rpb24sIGZ1bmN0aW9uPn0gd3JhcHBlck1hcFxuICAgICAqICAgICAgICBBIERlZmF1bHRXZWFrTWFwIG9iamVjdCB3aGljaCB3aWxsIGNyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgd3JhcHBlclxuICAgICAqICAgICAgICBmb3IgYSBnaXZlbiBsaXN0ZW5lciBmdW5jdGlvbiB3aGVuIG9uZSBkb2VzIG5vdCBleGlzdCwgYW5kIHJldHJpZXZlXG4gICAgICogICAgICAgIGFuIGV4aXN0aW5nIG9uZSB3aGVuIGl0IGRvZXMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBFdmVudCA9IHdyYXBwZXJNYXAgPT4gKHtcbiAgICAgIGFkZExpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIsIC4uLmFyZ3MpIHtcbiAgICAgICAgdGFyZ2V0LmFkZExpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSwgLi4uYXJncyk7XG4gICAgICB9LFxuXG4gICAgICBoYXNMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuaGFzTGlzdGVuZXIod3JhcHBlck1hcC5nZXQobGlzdGVuZXIpKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUxpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGFuIG9uUmVxdWVzdEZpbmlzaGVkIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgd2lsbCByZXR1cm4gYVxuICAgICAgICogYGdldENvbnRlbnQoKWAgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIGBQcm9taXNlYCByYXRoZXIgdGhhbiB1c2luZyBhXG4gICAgICAgKiBjYWxsYmFjayBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgICAgICogICAgICAgIFRoZSBIQVIgZW50cnkgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgbmV0d29yayByZXF1ZXN0LlxuICAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gb25SZXF1ZXN0RmluaXNoZWQocmVxKSB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWRSZXEgPSB3cmFwT2JqZWN0KHJlcSwge30gLyogd3JhcHBlcnMgKi8sIHtcbiAgICAgICAgICBnZXRDb250ZW50OiB7XG4gICAgICAgICAgICBtaW5BcmdzOiAwLFxuICAgICAgICAgICAgbWF4QXJnczogMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgbGlzdGVuZXIod3JhcHBlZFJlcSk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBpZiB0aGUgZGVwcmVjYXRpb24gd2FybmluZyBoYXMgYmVlbiBsb2dnZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBsZXQgbG9nZ2VkU2VuZFJlc3BvbnNlRGVwcmVjYXRpb25XYXJuaW5nID0gZmFsc2U7XG5cbiAgICBjb25zdCBvbk1lc3NhZ2VXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGEgbWVzc2FnZSBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IG1heSBzZW5kIHJlc3BvbnNlcyBiYXNlZCBvblxuICAgICAgICogaXRzIHJldHVybiB2YWx1ZSwgcmF0aGVyIHRoYW4gYnkgcmV0dXJuaW5nIGEgc2VudGluZWwgdmFsdWUgYW5kIGNhbGxpbmcgYVxuICAgICAgICogY2FsbGJhY2suIElmIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiByZXR1cm5zIGEgUHJvbWlzZSwgdGhlIHJlc3BvbnNlIGlzXG4gICAgICAgKiBzZW50IHdoZW4gdGhlIHByb21pc2UgZWl0aGVyIHJlc29sdmVzIG9yIHJlamVjdHMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHsqfSBtZXNzYWdlXG4gICAgICAgKiAgICAgICAgVGhlIG1lc3NhZ2Ugc2VudCBieSB0aGUgb3RoZXIgZW5kIG9mIHRoZSBjaGFubmVsLlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHNlbmRlclxuICAgICAgICogICAgICAgIERldGFpbHMgYWJvdXQgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZS5cbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oKil9IHNlbmRSZXNwb25zZVxuICAgICAgICogICAgICAgIEEgY2FsbGJhY2sgd2hpY2gsIHdoZW4gY2FsbGVkIHdpdGggYW4gYXJiaXRyYXJ5IGFyZ3VtZW50LCBzZW5kc1xuICAgICAgICogICAgICAgIHRoYXQgdmFsdWUgYXMgYSByZXNwb25zZS5cbiAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICogICAgICAgIFRydWUgaWYgdGhlIHdyYXBwZWQgbGlzdGVuZXIgcmV0dXJuZWQgYSBQcm9taXNlLCB3aGljaCB3aWxsIGxhdGVyXG4gICAgICAgKiAgICAgICAgeWllbGQgYSByZXNwb25zZS4gRmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gb25NZXNzYWdlKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSB7XG4gICAgICAgIGxldCBkaWRDYWxsU2VuZFJlc3BvbnNlID0gZmFsc2U7XG5cbiAgICAgICAgbGV0IHdyYXBwZWRTZW5kUmVzcG9uc2U7XG4gICAgICAgIGxldCBzZW5kUmVzcG9uc2VQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgd3JhcHBlZFNlbmRSZXNwb25zZSA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoIWxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oU0VORF9SRVNQT05TRV9ERVBSRUNBVElPTl9XQVJOSU5HLCBuZXcgRXJyb3IoKS5zdGFjayk7XG4gICAgICAgICAgICAgIGxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaWRDYWxsU2VuZFJlc3BvbnNlID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gbGlzdGVuZXIobWVzc2FnZSwgc2VuZGVyLCB3cmFwcGVkU2VuZFJlc3BvbnNlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzUmVzdWx0VGhlbmFibGUgPSByZXN1bHQgIT09IHRydWUgJiYgaXNUaGVuYWJsZShyZXN1bHQpO1xuXG4gICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciBkaWRuJ3QgcmV0dXJuZWQgdHJ1ZSBvciBhIFByb21pc2UsIG9yIGNhbGxlZFxuICAgICAgICAvLyB3cmFwcGVkU2VuZFJlc3BvbnNlIHN5bmNocm9ub3VzbHksIHdlIGNhbiBleGl0IGVhcmxpZXJcbiAgICAgICAgLy8gYmVjYXVzZSB0aGVyZSB3aWxsIGJlIG5vIHJlc3BvbnNlIHNlbnQgZnJvbSB0aGlzIGxpc3RlbmVyLlxuICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlICYmICFpc1Jlc3VsdFRoZW5hYmxlICYmICFkaWRDYWxsU2VuZFJlc3BvbnNlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQSBzbWFsbCBoZWxwZXIgdG8gc2VuZCB0aGUgbWVzc2FnZSBpZiB0aGUgcHJvbWlzZSByZXNvbHZlc1xuICAgICAgICAvLyBhbmQgYW4gZXJyb3IgaWYgdGhlIHByb21pc2UgcmVqZWN0cyAoYSB3cmFwcGVkIHNlbmRNZXNzYWdlIGhhc1xuICAgICAgICAvLyB0byB0cmFuc2xhdGUgdGhlIG1lc3NhZ2UgaW50byBhIHJlc29sdmVkIHByb21pc2Ugb3IgYSByZWplY3RlZFxuICAgICAgICAvLyBwcm9taXNlKS5cbiAgICAgICAgY29uc3Qgc2VuZFByb21pc2VkUmVzdWx0ID0gKHByb21pc2UpID0+IHtcbiAgICAgICAgICBwcm9taXNlLnRoZW4obXNnID0+IHtcbiAgICAgICAgICAgIC8vIHNlbmQgdGhlIG1lc3NhZ2UgdmFsdWUuXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UobXNnKTtcbiAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAvLyBTZW5kIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IgaWYgdGhlIHJlamVjdGVkIHZhbHVlXG4gICAgICAgICAgICAvLyBpcyBhbiBpbnN0YW5jZSBvZiBlcnJvciwgb3IgdGhlIG9iamVjdCBpdHNlbGYgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgICAgICBpZiAoZXJyb3IgJiYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICAgICAgICAgICAgICB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gXCJBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgIF9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXzogdHJ1ZSxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyBQcmludCBhbiBlcnJvciBvbiB0aGUgY29uc29sZSBpZiB1bmFibGUgdG8gc2VuZCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHNlbmQgb25NZXNzYWdlIHJlamVjdGVkIHJlcGx5XCIsIGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybmVkIGEgUHJvbWlzZSwgc2VuZCB0aGUgcmVzb2x2ZWQgdmFsdWUgYXMgYVxuICAgICAgICAvLyByZXN1bHQsIG90aGVyd2lzZSB3YWl0IHRoZSBwcm9taXNlIHJlbGF0ZWQgdG8gdGhlIHdyYXBwZWRTZW5kUmVzcG9uc2VcbiAgICAgICAgLy8gY2FsbGJhY2sgdG8gcmVzb2x2ZSBhbmQgc2VuZCBpdCBhcyBhIHJlc3BvbnNlLlxuICAgICAgICBpZiAoaXNSZXN1bHRUaGVuYWJsZSkge1xuICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChyZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChzZW5kUmVzcG9uc2VQcm9taXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExldCBDaHJvbWUga25vdyB0aGF0IHRoZSBsaXN0ZW5lciBpcyByZXBseWluZy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3Qgd3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2sgPSAoe3JlamVjdCwgcmVzb2x2ZX0sIHJlcGx5KSA9PiB7XG4gICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAvLyBEZXRlY3Qgd2hlbiBub25lIG9mIHRoZSBsaXN0ZW5lcnMgcmVwbGllZCB0byB0aGUgc2VuZE1lc3NhZ2UgY2FsbCBhbmQgcmVzb2x2ZVxuICAgICAgICAvLyB0aGUgcHJvbWlzZSB0byB1bmRlZmluZWQgYXMgaW4gRmlyZWZveC5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3dlYmV4dGVuc2lvbi1wb2x5ZmlsbC9pc3N1ZXMvMTMwXG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UgPT09IENIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHJlcGx5ICYmIHJlcGx5Ll9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXykge1xuICAgICAgICAvLyBDb252ZXJ0IGJhY2sgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIGVycm9yIGludG9cbiAgICAgICAgLy8gYW4gRXJyb3IgaW5zdGFuY2UuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVwbHkubWVzc2FnZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShyZXBseSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHdyYXBwZWRTZW5kTWVzc2FnZSA9IChuYW1lLCBtZXRhZGF0YSwgYXBpTmFtZXNwYWNlT2JqLCAuLi5hcmdzKSA9PiB7XG4gICAgICBpZiAoYXJncy5sZW5ndGggPCBtZXRhZGF0YS5taW5BcmdzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbGVhc3QgJHttZXRhZGF0YS5taW5BcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5taW5BcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBtb3N0ICR7bWV0YWRhdGEubWF4QXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWF4QXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB3cmFwcGVkQ2IgPSB3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjay5iaW5kKG51bGwsIHtyZXNvbHZlLCByZWplY3R9KTtcbiAgICAgICAgYXJncy5wdXNoKHdyYXBwZWRDYik7XG4gICAgICAgIGFwaU5hbWVzcGFjZU9iai5zZW5kTWVzc2FnZSguLi5hcmdzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGF0aWNXcmFwcGVycyA9IHtcbiAgICAgIGRldnRvb2xzOiB7XG4gICAgICAgIG5ldHdvcms6IHtcbiAgICAgICAgICBvblJlcXVlc3RGaW5pc2hlZDogd3JhcEV2ZW50KG9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJ1bnRpbWU6IHtcbiAgICAgICAgb25NZXNzYWdlOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICBvbk1lc3NhZ2VFeHRlcm5hbDogd3JhcEV2ZW50KG9uTWVzc2FnZVdyYXBwZXJzKSxcbiAgICAgICAgc2VuZE1lc3NhZ2U6IHdyYXBwZWRTZW5kTWVzc2FnZS5iaW5kKG51bGwsIFwic2VuZE1lc3NhZ2VcIiwge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDN9KSxcbiAgICAgIH0sXG4gICAgICB0YWJzOiB7XG4gICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHttaW5BcmdzOiAyLCBtYXhBcmdzOiAzfSksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3Qgc2V0dGluZ01ldGFkYXRhID0ge1xuICAgICAgY2xlYXI6IHttaW5BcmdzOiAxLCBtYXhBcmdzOiAxfSxcbiAgICAgIGdldDoge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDF9LFxuICAgICAgc2V0OiB7bWluQXJnczogMSwgbWF4QXJnczogMX0sXG4gICAgfTtcbiAgICBhcGlNZXRhZGF0YS5wcml2YWN5ID0ge1xuICAgICAgbmV0d29yazoge1wiKlwiOiBzZXR0aW5nTWV0YWRhdGF9LFxuICAgICAgc2VydmljZXM6IHtcIipcIjogc2V0dGluZ01ldGFkYXRhfSxcbiAgICAgIHdlYnNpdGVzOiB7XCIqXCI6IHNldHRpbmdNZXRhZGF0YX0sXG4gICAgfTtcblxuICAgIHJldHVybiB3cmFwT2JqZWN0KGV4dGVuc2lvbkFQSXMsIHN0YXRpY1dyYXBwZXJzLCBhcGlNZXRhZGF0YSk7XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBjaHJvbWUgIT0gXCJvYmplY3RcIiB8fCAhY2hyb21lIHx8ICFjaHJvbWUucnVudGltZSB8fCAhY2hyb21lLnJ1bnRpbWUuaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIHNjcmlwdCBzaG91bGQgb25seSBiZSBsb2FkZWQgaW4gYSBicm93c2VyIGV4dGVuc2lvbi5cIik7XG4gIH1cblxuICAvLyBUaGUgYnVpbGQgcHJvY2VzcyBhZGRzIGEgVU1EIHdyYXBwZXIgYXJvdW5kIHRoaXMgZmlsZSwgd2hpY2ggbWFrZXMgdGhlXG4gIC8vIGBtb2R1bGVgIHZhcmlhYmxlIGF2YWlsYWJsZS5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3cmFwQVBJcyhjaHJvbWUpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBicm93c2VyO1xufVxuIiwiLypcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGV5ZW8ncyBXZWIgRXh0ZW5zaW9uIEFkIEJsb2NraW5nIFRvb2xraXQgKEVXRSksXG4gKiBDb3B5cmlnaHQgKEMpIDIwMDYtcHJlc2VudCBleWVvIEdtYkhcbiAqXG4gKiBFV0UgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgYXNcbiAqIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLlxuICpcbiAqIEVXRSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggRVdFLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmltcG9ydCBicm93c2VyIGZyb20gXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIjtcbmltcG9ydCB7aWdub3JlTm9Db25uZWN0aW9uRXJyb3J9IGZyb20gXCIuLi9lcnJvcnMuanNcIjtcblxuY29uc3QgTUFYX0VSUk9SX1RIUkVTSE9MRCA9IDMwO1xuY29uc3QgTUFYX1FVRVVFRF9FVkVOVFMgPSAyMDtcbmNvbnN0IEVWRU5UX0lOVEVSVkFMX01TID0gMTAwO1xuXG5sZXQgZXJyb3JDb3VudCA9IDA7XG5sZXQgZXZlbnRQcm9jZXNzaW5nSW50ZXJ2YWwgPSBudWxsO1xubGV0IGV2ZW50UHJvY2Vzc2luZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbmxldCBldmVudFF1ZXVlID0gW107XG5cbmZ1bmN0aW9uIGlzRXZlbnRUcnVzdGVkKGV2ZW50KSB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZXZlbnQpID09PSBDdXN0b21FdmVudC5wcm90b3R5cGUgJiZcbiAgICAhT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoZXZlbnQsIFwiZGV0YWlsXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhbGxvd2xpc3REb21haW4oZXZlbnQpIHtcbiAgaWYgKCFpc0V2ZW50VHJ1c3RlZChldmVudCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gaWdub3JlTm9Db25uZWN0aW9uRXJyb3IoXG4gICAgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6IFwiZXdlOmFsbG93bGlzdC1wYWdlXCIsXG4gICAgICB0aW1lc3RhbXA6IGV2ZW50LmRldGFpbC50aW1lc3RhbXAsXG4gICAgICBzaWduYXR1cmU6IGV2ZW50LmRldGFpbC5zaWduYXR1cmVcbiAgICB9KVxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzTmV4dEV2ZW50KCkge1xuICBpZiAoZXZlbnRQcm9jZXNzaW5nSW5Qcm9ncmVzcykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZXZlbnRQcm9jZXNzaW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgbGV0IGV2ZW50ID0gZXZlbnRRdWV1ZS5zaGlmdCgpO1xuICAgIGlmIChldmVudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IGFsbG93bGlzdGluZ1Jlc3VsdCA9IGF3YWl0IGFsbG93bGlzdERvbWFpbihldmVudCk7XG4gICAgICAgIGlmIChhbGxvd2xpc3RpbmdSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImRvbWFpbl9hbGxvd2xpc3Rpbmdfc3VjY2Vzc1wiKSk7XG4gICAgICAgICAgc3RvcE9uZUNsaWNrQWxsb3dsaXN0aW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9tYWluIGFsbG93bGlzdGluZyByZWplY3RlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICBpZiAoZXJyb3JDb3VudCA+PSBNQVhfRVJST1JfVEhSRVNIT0xEKSB7XG4gICAgICAgICAgc3RvcE9uZUNsaWNrQWxsb3dsaXN0aW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICBzdG9wUHJvY2Vzc2luZ0ludGVydmFsKCk7XG4gICAgfVxuICB9XG4gIGZpbmFsbHkge1xuICAgIGV2ZW50UHJvY2Vzc2luZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvbkRvbWFpbkFsbG93bGlzdGluZ1JlcXVlc3QoZXZlbnQpIHtcbiAgaWYgKGV2ZW50UXVldWUubGVuZ3RoID49IE1BWF9RVUVVRURfRVZFTlRTKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZXZlbnRRdWV1ZS5wdXNoKGV2ZW50KTtcbiAgc3RhcnRQcm9jZXNzaW5nSW50ZXJ2YWwoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRQcm9jZXNzaW5nSW50ZXJ2YWwoKSB7XG4gIGlmICghZXZlbnRQcm9jZXNzaW5nSW50ZXJ2YWwpIHtcbiAgICBwcm9jZXNzTmV4dEV2ZW50KCk7XG4gICAgZXZlbnRQcm9jZXNzaW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChwcm9jZXNzTmV4dEV2ZW50LCBFVkVOVF9JTlRFUlZBTF9NUyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RvcFByb2Nlc3NpbmdJbnRlcnZhbCgpIHtcbiAgY2xlYXJJbnRlcnZhbChldmVudFByb2Nlc3NpbmdJbnRlcnZhbCk7XG4gIGV2ZW50UHJvY2Vzc2luZ0ludGVydmFsID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BPbmVDbGlja0FsbG93bGlzdGluZygpIHtcbiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRvbWFpbl9hbGxvd2xpc3RpbmdfcmVxdWVzdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRG9tYWluQWxsb3dsaXN0aW5nUmVxdWVzdCwgdHJ1ZSk7XG4gIGV2ZW50UXVldWUgPSBbXTtcbiAgc3RvcFByb2Nlc3NpbmdJbnRlcnZhbCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRPbmVDbGlja0FsbG93bGlzdGluZygpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRvbWFpbl9hbGxvd2xpc3RpbmdfcmVxdWVzdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRG9tYWluQWxsb3dsaXN0aW5nUmVxdWVzdCwgdHJ1ZSk7XG59XG4iLCIvKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZXllbydzIFdlYiBFeHRlbnNpb24gQWQgQmxvY2tpbmcgVG9vbGtpdCAoRVdFKSxcbiAqIENvcHlyaWdodCAoQykgMjAwNi1wcmVzZW50IGV5ZW8gR21iSFxuICpcbiAqIEVXRSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMyBhc1xuICogcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24uXG4gKlxuICogRVdFIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBFV0UuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuaW1wb3J0IGJyb3dzZXIgZnJvbSBcIndlYmV4dGVuc2lvbi1wb2x5ZmlsbFwiO1xuaW1wb3J0IHtpZ25vcmVOb0Nvbm5lY3Rpb25FcnJvcn0gZnJvbSBcIi4uL2Vycm9ycy5qc1wiO1xuXG5sZXQgY29sbGFwc2VkU2VsZWN0b3JzID0gbmV3IFNldCgpO1xubGV0IG9ic2VydmVycyA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGdldFVSTEZyb21FbGVtZW50KGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAoZWxlbWVudC5kYXRhKSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5kYXRhO1xuICAgIH1cblxuICAgIGZvciAobGV0IGNoaWxkIG9mIGVsZW1lbnQuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC5sb2NhbE5hbWUgPT0gXCJwYXJhbVwiICYmIGNoaWxkLm5hbWUgPT0gXCJtb3ZpZVwiICYmIGNoaWxkLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgVVJMKGNoaWxkLnZhbHVlLCBkb2N1bWVudC5iYXNlVVJJKS5ocmVmO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnQuY3VycmVudFNyYyB8fCBlbGVtZW50LnNyYztcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0b3JGb3JCbG9ja2VkRWxlbWVudChlbGVtZW50KSB7XG4gIC8vIFNldHRpbmcgdGhlIFwiZGlzcGxheVwiIENTUyBwcm9wZXJ0eSB0byBcIm5vbmVcIiBkb2Vzbid0IGhhdmUgYW55IGVmZmVjdCBvblxuICAvLyA8ZnJhbWU+IGVsZW1lbnRzIChpbiBmcmFtZXNldHMpLiBTbyB3ZSBoYXZlIHRvIGhpZGUgaXQgaW5saW5lIHRocm91Z2hcbiAgLy8gdGhlIFwidmlzaWJpbGl0eVwiIENTUyBwcm9wZXJ0eS5cbiAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09IFwiZnJhbWVcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gSWYgdGhlIDx2aWRlbz4gb3IgPGF1ZGlvPiBlbGVtZW50IGNvbnRhaW5zIGFueSA8c291cmNlPiBjaGlsZHJlbixcbiAgLy8gd2UgY2Fubm90IGFkZHJlc3MgaXQgaW4gQ1NTIGJ5IHRoZSBzb3VyY2UgVVJMOyBpbiB0aGF0IGNhc2Ugd2VcbiAgLy8gZG9uJ3QgXCJjb2xsYXBzZVwiIGl0IHVzaW5nIGEgQ1NTIHNlbGVjdG9yIGJ1dCByYXRoZXIgaGlkZSBpdCBkaXJlY3RseSBieVxuICAvLyBzZXR0aW5nIHRoZSBzdHlsZT1cIi4uLlwiIGF0dHJpYnV0ZS5cbiAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09IFwidmlkZW9cIiB8fCBlbGVtZW50LmxvY2FsTmFtZSA9PSBcImF1ZGlvXCIpIHtcbiAgICBmb3IgKGxldCBjaGlsZCBvZiBlbGVtZW50LmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQubG9jYWxOYW1lID09IFwic291cmNlXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IHNlbGVjdG9yID0gXCJcIjtcbiAgZm9yIChsZXQgYXR0ciBvZiBbXCJzcmNcIiwgXCJzcmNzZXRcIl0pIHtcbiAgICBsZXQgdmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyKTtcbiAgICBpZiAodmFsdWUgJiYgYXR0ciBpbiBlbGVtZW50KSB7XG4gICAgICBzZWxlY3RvciArPSBcIltcIiArIGF0dHIgKyBcIj1cIiArIENTUy5lc2NhcGUodmFsdWUpICsgXCJdXCI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yID8gZWxlbWVudC5sb2NhbE5hbWUgKyBzZWxlY3RvciA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBwcm9wZXJ0aWVzKSB7XG4gIGxldCB7c3R5bGV9ID0gZWxlbWVudDtcblxuICBpZiAoIXByb3BlcnRpZXMpIHtcbiAgICBpZiAoZWxlbWVudC5sb2NhbE5hbWUgPT0gXCJmcmFtZVwiKSB7XG4gICAgICBwcm9wZXJ0aWVzID0gW1tcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIl1dO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHByb3BlcnRpZXMgPSBbW1wiZGlzcGxheVwiLCBcIm5vbmVcIl1dO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgXCJpbXBvcnRhbnRcIik7XG4gIH1cblxuICBpZiAob2JzZXJ2ZXJzLmhhcyhlbGVtZW50KSkge1xuICAgIG9ic2VydmVycy5nZXQoZWxlbWVudCkuZGlzY29ubmVjdCgpO1xuICB9XG5cbiAgbGV0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgICBpZiAoc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShrZXkpICE9IHZhbHVlIHx8XG4gICAgICAgICAgc3R5bGUuZ2V0UHJvcGVydHlQcmlvcml0eShrZXkpICE9IFwiaW1wb3J0YW50XCIpIHtcbiAgICAgICAgc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgXCJpbXBvcnRhbnRcIik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShcbiAgICBlbGVtZW50LCB7XG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgYXR0cmlidXRlRmlsdGVyOiBbXCJzdHlsZVwiXVxuICAgIH1cbiAgKTtcbiAgb2JzZXJ2ZXJzLnNldChlbGVtZW50LCBvYnNlcnZlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmhpZGVFbGVtZW50KGVsZW1lbnQpIHtcbiAgbGV0IG9ic2VydmVyID0gb2JzZXJ2ZXJzLmdldChlbGVtZW50KTtcbiAgaWYgKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIG9ic2VydmVycy5kZWxldGUoZWxlbWVudCk7XG4gIH1cblxuICBsZXQgcHJvcGVydHkgPSBlbGVtZW50LmxvY2FsTmFtZSA9PSBcImZyYW1lXCIgPyBcInZpc2liaWxpdHlcIiA6IFwiZGlzcGxheVwiO1xuICBlbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3BlcnR5KTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VFbGVtZW50KGVsZW1lbnQpIHtcbiAgbGV0IHNlbGVjdG9yID0gZ2V0U2VsZWN0b3JGb3JCbG9ja2VkRWxlbWVudChlbGVtZW50KTtcbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIGhpZGVFbGVtZW50KGVsZW1lbnQpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghY29sbGFwc2VkU2VsZWN0b3JzLmhhcyhzZWxlY3RvcikpIHtcbiAgICBpZ25vcmVOb0Nvbm5lY3Rpb25FcnJvcihcbiAgICAgIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwiZXdlOmluamVjdC1jc3NcIixcbiAgICAgICAgc2VsZWN0b3JcbiAgICAgIH0pXG4gICAgKTtcbiAgICBjb2xsYXBzZWRTZWxlY3RvcnMuYWRkKHNlbGVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoaWRlSW5BYm91dEJsYW5rRnJhbWVzKHNlbGVjdG9yLCB1cmxzKSB7XG4gIC8vIFJlc291cmNlcyAoZS5nLiBpbWFnZXMpIGxvYWRlZCBpbnRvIGFib3V0OmJsYW5rIGZyYW1lc1xuICAvLyBhcmUgKHNvbWV0aW1lcykgbG9hZGVkIHdpdGggdGhlIGZyYW1lSWQgb2YgdGhlIG1haW5fZnJhbWUuXG4gIGZvciAobGV0IGZyYW1lIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJpZnJhbWVbc3JjPSdhYm91dDpibGFuayddXCIpKSB7XG4gICAgaWYgKCFmcmFtZS5jb250ZW50RG9jdW1lbnQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGVsZW1lbnQgb2YgZnJhbWUuY29udGVudERvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKSB7XG4gICAgICAvLyBVc2UgaGlkZUVsZW1lbnQsIGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSB0aGUgY29ycmVjdCBmcmFtZUlkXG4gICAgICAvLyBmb3IgdGhlIFwiZXdlOmluamVjdC1jc3NcIiBtZXNzYWdlLlxuICAgICAgaWYgKHVybHMuaGFzKGdldFVSTEZyb21FbGVtZW50KGVsZW1lbnQpKSkge1xuICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0RWxlbWVudENvbGxhcHNpbmcoKSB7XG4gIGxldCBkZWZlcnJlZCA9IG51bGw7XG5cbiAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyKSA9PiB7XG4gICAgaWYgKCFtZXNzYWdlIHx8IG1lc3NhZ2UudHlwZSAhPSBcImV3ZTpjb2xsYXBzZVwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgIGlmICghZGVmZXJyZWQpIHtcbiAgICAgICAgZGVmZXJyZWQgPSBuZXcgTWFwKCk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+IHtcbiAgICAgICAgICAvLyBVbmRlciBzb21lIGNvbmRpdGlvbnMgYSBob3N0aWxlIHNjcmlwdCBjb3VsZCB0cnkgdG8gdHJpZ2dlclxuICAgICAgICAgIC8vIHRoZSBldmVudCBhZ2Fpbi4gU2luY2Ugd2Ugc2V0IGRlZmVycmVkIHRvIGBudWxsYCwgdGhlblxuICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGF0IHdlIHNob3VsZCBqdXN0IHJldHVybiBpbnN0ZWFkIG9mIHRocm93aW5nXG4gICAgICAgICAgLy8gYSBUeXBlRXJyb3IuXG4gICAgICAgICAgaWYgKCFkZWZlcnJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAobGV0IFtzZWxlY3RvciwgdXJsc10gb2YgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgaWYgKHVybHMuaGFzKGdldFVSTEZyb21FbGVtZW50KGVsZW1lbnQpKSkge1xuICAgICAgICAgICAgICAgIGNvbGxhcHNlRWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoaWRlSW5BYm91dEJsYW5rRnJhbWVzKHNlbGVjdG9yLCB1cmxzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZWZlcnJlZCA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBsZXQgdXJscyA9IGRlZmVycmVkLmdldChtZXNzYWdlLnNlbGVjdG9yKSB8fCBuZXcgU2V0KCk7XG4gICAgICBkZWZlcnJlZC5zZXQobWVzc2FnZS5zZWxlY3RvciwgdXJscyk7XG4gICAgICB1cmxzLmFkZChtZXNzYWdlLnVybCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG1lc3NhZ2Uuc2VsZWN0b3IpKSB7XG4gICAgICAgIGlmIChnZXRVUkxGcm9tRWxlbWVudChlbGVtZW50KSA9PSBtZXNzYWdlLnVybCkge1xuICAgICAgICAgIGNvbGxhcHNlRWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBoaWRlSW5BYm91dEJsYW5rRnJhbWVzKG1lc3NhZ2Uuc2VsZWN0b3IsIG5ldyBTZXQoW21lc3NhZ2UudXJsXSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG4iLCIvKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZXllbydzIFdlYiBFeHRlbnNpb24gQWQgQmxvY2tpbmcgVG9vbGtpdCAoRVdFKSxcbiAqIENvcHlyaWdodCAoQykgMjAwNi1wcmVzZW50IGV5ZW8gR21iSFxuICpcbiAqIEVXRSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMyBhc1xuICogcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24uXG4gKlxuICogRVdFIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBFV0UuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuaW1wb3J0IGJyb3dzZXIgZnJvbSBcIndlYmV4dGVuc2lvbi1wb2x5ZmlsbFwiO1xuaW1wb3J0IHtpZ25vcmVOb0Nvbm5lY3Rpb25FcnJvcn0gZnJvbSBcIi4uL2Vycm9ycy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEhpZGluZ1RyYWNlciB7XG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9ycykge1xuICAgIHRoaXMuc2VsZWN0b3JzID0gbmV3IE1hcChzZWxlY3RvcnMpO1xuXG4gICAgdGhpcy5vYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgIHRoaXMub2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnRyYWNlKCksIDEwMDApO1xuICAgIH0pO1xuXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+IHRoaXMudHJhY2UoKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy50cmFjZSgpO1xuICAgIH1cbiAgfVxuXG4gIGxvZyhmaWx0ZXJzLCBzZWxlY3RvcnMgPSBbXSkge1xuICAgIGlnbm9yZU5vQ29ubmVjdGlvbkVycm9yKGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgIHt0eXBlOiBcImV3ZTp0cmFjZS1lbGVtLWhpZGVcIiwgZmlsdGVycywgc2VsZWN0b3JzfVxuICAgICkpO1xuICB9XG5cbiAgdHJhY2UoKSB7XG4gICAgbGV0IGZpbHRlcnMgPSBbXTtcbiAgICBsZXQgc2VsZWN0b3JzID0gW107XG5cbiAgICBmb3IgKGxldCBbc2VsZWN0b3IsIGZpbHRlcl0gb2YgdGhpcy5zZWxlY3RvcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgICAgICAgIHRoaXMuc2VsZWN0b3JzLmRlbGV0ZShzZWxlY3Rvcik7XG4gICAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goc2VsZWN0b3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnRvU3RyaW5nKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmaWx0ZXJzLmxlbmd0aCA+IDAgfHwgc2VsZWN0b3JzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMubG9nKGZpbHRlcnMsIHNlbGVjdG9ycyk7XG4gICAgfVxuXG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7Y2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZX0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpIHtcbiAgICB0aGlzLm9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgfVxufVxuIiwiLypcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGV5ZW8ncyBXZWIgRXh0ZW5zaW9uIEFkIEJsb2NraW5nIFRvb2xraXQgKEVXRSksXG4gKiBDb3B5cmlnaHQgKEMpIDIwMDYtcHJlc2VudCBleWVvIEdtYkhcbiAqXG4gKiBFV0UgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgYXNcbiAqIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLlxuICpcbiAqIEVXRSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggRVdFLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmltcG9ydCBicm93c2VyIGZyb20gXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIjtcbmltcG9ydCB7aWdub3JlTm9Db25uZWN0aW9uRXJyb3J9IGZyb20gXCIuLi9lcnJvcnMuanNcIjtcblxuY29uc3QgQUxMT1dFRF9ET01BSU5TID0gbmV3IFNldChbXG4gIFwiYWJwY2hpbmEub3JnXCIsXG4gIFwiYWJwaW5kby5ibG9nc3BvdC5jb21cIixcbiAgXCJhYnB2bi5jb21cIixcbiAgXCJhZGJsb2NrLmVlXCIsXG4gIFwiYWRibG9jay5nYXJkYXIubmV0XCIsXG4gIFwiYWRibG9ja3BsdXMubWVcIixcbiAgXCJhZGJsb2NrcGx1cy5vcmdcIixcbiAgXCJjb21tZW50Y2FtYXJjaGUubmV0XCIsXG4gIFwiZHJvaXQtZmluYW5jZXMuY29tbWVudGNhbWFyY2hlLmNvbVwiLFxuICBcImVhc3lsaXN0LnRvXCIsXG4gIFwiZXllby5jb21cIixcbiAgXCJmYW5ib3kuY28ubnpcIixcbiAgXCJmaWx0ZXJsaXN0cy5jb21cIixcbiAgXCJmb3J1bXMubGFuaWsudXNcIixcbiAgXCJnaXRlZS5jb21cIixcbiAgXCJnaXRlZS5pb1wiLFxuICBcImdpdGh1Yi5jb21cIixcbiAgXCJnaXRodWIuaW9cIixcbiAgXCJnaXRsYWIuY29tXCIsXG4gIFwiZ2l0bGFiLmlvXCIsXG4gIFwiZ3VydWQuZWVcIixcbiAgXCJodWdvbGVzY2FyZ290LmNvbVwiLFxuICBcImktZG9udC1jYXJlLWFib3V0LWNvb2tpZXMuZXVcIixcbiAgXCJqb3VybmFsZGVzZmVtbWVzLmZyXCIsXG4gIFwiam91cm5hbGR1bmV0LmNvbVwiLFxuICBcImxpbnRlcm5hdXRlLmNvbVwiLFxuICBcInNwYW00MDQuY29tXCIsXG4gIFwic3RhbmV2Lm9yZ1wiLFxuICBcInZvaWQuZ3JcIixcbiAgXCJ4ZmlsZXMubm9hZHMuaXRcIixcbiAgXCJ6b3NvLnJvXCJcbl0pO1xuXG5mdW5jdGlvbiBpc0RvbWFpbkFsbG93ZWQoZG9tYWluKSB7XG4gIGlmIChkb21haW4uZW5kc1dpdGgoXCIuXCIpKSB7XG4gICAgZG9tYWluID0gZG9tYWluLnN1YnN0cmluZygwLCBkb21haW4ubGVuZ3RoIC0gMSk7XG4gIH1cblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmIChBTExPV0VEX0RPTUFJTlMuaGFzKGRvbWFpbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBsZXQgaW5kZXggPSBkb21haW4uaW5kZXhPZihcIi5cIik7XG4gICAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRvbWFpbiA9IGRvbWFpbi5zdWJzdHIoaW5kZXggKyAxKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlTGlua3NFbmFibGVkKHVybCkge1xuICBsZXQge3Byb3RvY29sLCBob3N0bmFtZX0gPSBuZXcgVVJMKHVybCk7XG4gIHJldHVybiBob3N0bmFtZSA9PSBcImxvY2FsaG9zdFwiIHx8XG4gICAgcHJvdG9jb2wgPT0gXCJodHRwczpcIiAmJiBpc0RvbWFpbkFsbG93ZWQoaG9zdG5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlU3Vic2NyaWJlTGlua3MoKSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBldmVudCA9PiB7XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiA9PSAyIHx8ICFldmVudC5pc1RydXN0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbGluayA9IGV2ZW50LnRhcmdldDtcbiAgICB3aGlsZSAoIShsaW5rIGluc3RhbmNlb2YgSFRNTEFuY2hvckVsZW1lbnQpKSB7XG4gICAgICBsaW5rID0gbGluay5wYXJlbnROb2RlO1xuXG4gICAgICBpZiAoIWxpbmspIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBxdWVyeVN0cmluZyA9IG51bGw7XG4gICAgaWYgKGxpbmsucHJvdG9jb2wgPT0gXCJodHRwOlwiIHx8IGxpbmsucHJvdG9jb2wgPT0gXCJodHRwczpcIikge1xuICAgICAgaWYgKGxpbmsuaG9zdCA9PSBcInN1YnNjcmliZS5hZGJsb2NrcGx1cy5vcmdcIiAmJiBsaW5rLnBhdGhuYW1lID09IFwiL1wiKSB7XG4gICAgICAgIHF1ZXJ5U3RyaW5nID0gbGluay5zZWFyY2guc3Vic3RyKDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIEZpcmVmb3ggZG9lc24ndCBzZWVtIHRvIHBvcHVsYXRlIHRoZSBcInNlYXJjaFwiIHByb3BlcnR5IGZvclxuICAgICAgLy8gbGlua3Mgd2l0aCBub24tc3RhbmRhcmQgVVJMIHNjaGVtZXMgc28gd2UgbmVlZCB0byBleHRyYWN0IHRoZSBxdWVyeVxuICAgICAgLy8gc3RyaW5nIG1hbnVhbGx5LlxuICAgICAgbGV0IG1hdGNoID0gL15hYnA6XFwvKnN1YnNjcmliZVxcLypcXD8oLiopL2kuZXhlYyhsaW5rLmhyZWYpO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHF1ZXJ5U3RyaW5nID0gbWF0Y2hbMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFxdWVyeVN0cmluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aXRsZSA9IG51bGw7XG4gICAgbGV0IHVybCA9IG51bGw7XG4gICAgZm9yIChsZXQgcGFyYW0gb2YgcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpKSB7XG4gICAgICBsZXQgcGFydHMgPSBwYXJhbS5zcGxpdChcIj1cIiwgMik7XG4gICAgICBpZiAocGFydHMubGVuZ3RoICE9IDIgfHwgIS9cXFMvLnRlc3QocGFydHNbMV0pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChwYXJ0c1swXSkge1xuICAgICAgICBjYXNlIFwidGl0bGVcIjpcbiAgICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0c1sxXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsb2NhdGlvblwiOlxuICAgICAgICAgIHVybCA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0c1sxXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghdXJsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgdGl0bGUgPSB1cmw7XG4gICAgfVxuXG4gICAgdGl0bGUgPSB0aXRsZS50cmltKCk7XG4gICAgdXJsID0gdXJsLnRyaW0oKTtcbiAgICBpZiAoIS9eKGh0dHBzP3xmdHApOi8udGVzdCh1cmwpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWdub3JlTm9Db25uZWN0aW9uRXJyb3IoXG4gICAgICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe3R5cGU6IFwiZXdlOnN1YnNjcmliZS1saW5rLWNsaWNrZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUsIHVybH0pXG4gICAgKTtcblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0sIHRydWUpO1xufVxuIiwiLypcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGV5ZW8ncyBXZWIgRXh0ZW5zaW9uIEFkIEJsb2NraW5nIFRvb2xraXQgKEVXRSksXG4gKiBDb3B5cmlnaHQgKEMpIDIwMDYtcHJlc2VudCBleWVvIEdtYkhcbiAqXG4gKiBFV0UgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgYXNcbiAqIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLlxuICpcbiAqIEVXRSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggRVdFLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmNvbnN0IEVSUk9SX05PX0NPTk5FQ1RJT04gPSBcIkNvdWxkIG5vdCBlc3RhYmxpc2ggY29ubmVjdGlvbi4gXCIgK1xuICAgICAgXCJSZWNlaXZpbmcgZW5kIGRvZXMgbm90IGV4aXN0LlwiO1xuY29uc3QgRVJST1JfQ0xPU0VEX0NPTk5FQ1RJT04gPSBcIkEgbGlzdGVuZXIgaW5kaWNhdGVkIGFuIGFzeW5jaHJvbm91cyBcIiArXG4gICAgICBcInJlc3BvbnNlIGJ5IHJldHVybmluZyB0cnVlLCBidXQgdGhlIG1lc3NhZ2UgY2hhbm5lbCBjbG9zZWQgYmVmb3JlIGEgXCIgK1xuICAgICAgXCJyZXNwb25zZSB3YXMgcmVjZWl2ZWRcIjtcbi8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTE1Nzg2OTdcbmNvbnN0IEVSUk9SX01BTkFHRVJfRElTQ09OTkVDVEVEID0gXCJNZXNzYWdlIG1hbmFnZXIgZGlzY29ubmVjdGVkXCI7XG5cbmV4cG9ydCBjb25zdCBFUlJPUl9EVVBMSUNBVEVfRklMVEVSUyA9IFwic3RvcmFnZV9kdXBsaWNhdGVfZmlsdGVyc1wiO1xuZXhwb3J0IGNvbnN0IEVSUk9SX0ZJTFRFUl9OT1RfRk9VTkQgPSBcImZpbHRlcl9ub3RfZm91bmRcIjtcbmV4cG9ydCBjb25zdCBFUlJPUl9UT09fTUFOWV9GSUxURVJTID0gXCJ0b29fbWFueV9maWx0ZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBpZ25vcmVOb0Nvbm5lY3Rpb25FcnJvcihwcm9taXNlKSB7XG4gIHJldHVybiBwcm9taXNlLmNhdGNoKGVycm9yID0+IHtcbiAgICBpZiAodHlwZW9mIGVycm9yID09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgKGVycm9yLm1lc3NhZ2UgPT0gRVJST1JfTk9fQ09OTkVDVElPTiB8fFxuICAgICAgICAgZXJyb3IubWVzc2FnZSA9PSBFUlJPUl9DTE9TRURfQ09OTkVDVElPTiB8fFxuICAgICAgICAgZXJyb3IubWVzc2FnZSA9PSBFUlJPUl9NQU5BR0VSX0RJU0NPTk5FQ1RFRCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfSk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8qXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBleWVvJ3MgV2ViIEV4dGVuc2lvbiBBZCBCbG9ja2luZyBUb29sa2l0IChFV0UpLFxuICogQ29weXJpZ2h0IChDKSAyMDA2LXByZXNlbnQgZXllbyBHbWJIXG4gKlxuICogRVdFIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzIGFzXG4gKiBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbi5cbiAqXG4gKiBFV0UgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIEVXRS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5pbXBvcnQgYnJvd3NlciBmcm9tIFwid2ViZXh0ZW5zaW9uLXBvbHlmaWxsXCI7XG5cbmltcG9ydCB7RWxlbUhpZGVFbXVsYXRpb259XG4gIGZyb20gXCJhZGJsb2NrcGx1c2NvcmUvbGliL2NvbnRlbnQvZWxlbUhpZGVFbXVsYXRpb24uanNcIjtcblxuaW1wb3J0IHtpZ25vcmVOb0Nvbm5lY3Rpb25FcnJvcn0gZnJvbSBcIi4uL2Vycm9ycy5qc1wiO1xuaW1wb3J0IHtzdGFydEVsZW1lbnRDb2xsYXBzaW5nLCBoaWRlRWxlbWVudCwgdW5oaWRlRWxlbWVudH1cbiAgZnJvbSBcIi4vZWxlbWVudC1jb2xsYXBzaW5nLmpzXCI7XG5pbXBvcnQge3N0YXJ0T25lQ2xpY2tBbGxvd2xpc3Rpbmd9IGZyb20gXCIuL2FsbG93bGlzdGluZy5qc1wiO1xuaW1wb3J0IHtFbGVtZW50SGlkaW5nVHJhY2VyfSBmcm9tIFwiLi9lbGVtZW50LWhpZGluZy10cmFjZXIuanNcIjtcbmltcG9ydCB7c3Vic2NyaWJlTGlua3NFbmFibGVkLCBoYW5kbGVTdWJzY3JpYmVMaW5rc30gZnJvbSBcIi4vc3Vic2NyaWJlLWxpbmtzLmpzXCI7XG5cbmxldCB0cmFjZXI7XG5sZXQgZWxlbUhpZGVFbXVsYXRpb247XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRDb250ZW50RmVhdHVyZXMoKSB7XG4gIGlmIChzdWJzY3JpYmVMaW5rc0VuYWJsZWQod2luZG93LmxvY2F0aW9uLmhyZWYpKSB7XG4gICAgaGFuZGxlU3Vic2NyaWJlTGlua3MoKTtcbiAgfVxuXG4gIGxldCByZXNwb25zZSA9IGF3YWl0IGlnbm9yZU5vQ29ubmVjdGlvbkVycm9yKFxuICAgIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7dHlwZTogXCJld2U6Y29udGVudC1oZWxsb1wifSlcbiAgKTtcblxuICBpZiAocmVzcG9uc2UpIHtcbiAgICBhd2FpdCBhcHBseUNvbnRlbnRGZWF0dXJlcyhyZXNwb25zZSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlQ29udGVudEZlYXR1cmVzKCkge1xuICBpZiAodHJhY2VyKSB7XG4gICAgdHJhY2VyLmRpc2Nvbm5lY3QoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBhcHBseUNvbnRlbnRGZWF0dXJlcyhyZXNwb25zZSkge1xuICBpZiAocmVzcG9uc2UudHJhY2VkU2VsZWN0b3JzKSB7XG4gICAgdHJhY2VyID0gbmV3IEVsZW1lbnRIaWRpbmdUcmFjZXIocmVzcG9uc2UudHJhY2VkU2VsZWN0b3JzKTtcbiAgfVxuXG4gIGlmIChyZXNwb25zZS5lbXVsYXRlZFBhdHRlcm5zLmxlbmd0aCA+IDApIHtcbiAgICBpZiAoIWVsZW1IaWRlRW11bGF0aW9uKSB7XG4gICAgICBlbGVtSGlkZUVtdWxhdGlvbiA9IG5ldyBFbGVtSGlkZUVtdWxhdGlvbigoZWxlbWVudHMsIGZpbHRlcnMpID0+IHtcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIHJlc3BvbnNlLmNzc1Byb3BlcnRpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRyYWNlcikge1xuICAgICAgICAgIHRyYWNlci5sb2coZmlsdGVycyk7XG4gICAgICAgIH1cbiAgICAgIH0sIGVsZW1lbnRzID0+IHtcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICAgIHVuaGlkZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbGVtSGlkZUVtdWxhdGlvbi5hcHBseShyZXNwb25zZS5lbXVsYXRlZFBhdHRlcm5zKTtcbiAgfVxuICBlbHNlIGlmIChlbGVtSGlkZUVtdWxhdGlvbikge1xuICAgIGVsZW1IaWRlRW11bGF0aW9uLmFwcGx5KHJlc3BvbnNlLmVtdWxhdGVkUGF0dGVybnMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uTWVzc2FnZShtZXNzYWdlKSB7XG4gIGlmICh0eXBlb2YgbWVzc2FnZSA9PSBcIm9iamVjdFwiICYmIG1lc3NhZ2UgIT0gbnVsbCAmJlxuICAgIG1lc3NhZ2UudHlwZSAmJiBtZXNzYWdlLnR5cGUgPT0gXCJld2U6YXBwbHktY29udGVudC1mZWF0dXJlc1wiKSB7XG4gICAgcmVtb3ZlQ29udGVudEZlYXR1cmVzKCk7XG4gICAgYXBwbHlDb250ZW50RmVhdHVyZXMobWVzc2FnZSk7XG4gIH1cbn1cbmJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIob25NZXNzYWdlKTtcblxuc3RhcnRFbGVtZW50Q29sbGFwc2luZygpO1xuc3RhcnRPbmVDbGlja0FsbG93bGlzdGluZygpO1xuaW5pdENvbnRlbnRGZWF0dXJlcygpO1xuIl0sIm5hbWVzIjpbImJyb3dzZXIiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInByb3RvdHlwZSIsIkNIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSIsIlNFTkRfUkVTUE9OU0VfREVQUkVDQVRJT05fV0FSTklORyIsIndyYXBBUElzIiwiZXh0ZW5zaW9uQVBJcyIsImFwaU1ldGFkYXRhIiwia2V5cyIsImxlbmd0aCIsIkVycm9yIiwiRGVmYXVsdFdlYWtNYXAiLCJXZWFrTWFwIiwiY29uc3RydWN0b3IiLCJjcmVhdGVJdGVtIiwiaXRlbXMiLCJ1bmRlZmluZWQiLCJnZXQiLCJrZXkiLCJoYXMiLCJzZXQiLCJpc1RoZW5hYmxlIiwidmFsdWUiLCJ0aGVuIiwibWFrZUNhbGxiYWNrIiwicHJvbWlzZSIsIm1ldGFkYXRhIiwiY2FsbGJhY2tBcmdzIiwicnVudGltZSIsImxhc3RFcnJvciIsInJlamVjdCIsIm1lc3NhZ2UiLCJzaW5nbGVDYWxsYmFja0FyZyIsInJlc29sdmUiLCJwbHVyYWxpemVBcmd1bWVudHMiLCJudW1BcmdzIiwid3JhcEFzeW5jRnVuY3Rpb24iLCJuYW1lIiwiYXN5bmNGdW5jdGlvbldyYXBwZXIiLCJ0YXJnZXQiLCJhcmdzIiwibWluQXJncyIsIm1heEFyZ3MiLCJQcm9taXNlIiwiZmFsbGJhY2tUb05vQ2FsbGJhY2siLCJjYkVycm9yIiwiY29uc29sZSIsIndhcm4iLCJub0NhbGxiYWNrIiwid3JhcE1ldGhvZCIsIm1ldGhvZCIsIndyYXBwZXIiLCJQcm94eSIsImFwcGx5IiwidGFyZ2V0TWV0aG9kIiwidGhpc09iaiIsImNhbGwiLCJoYXNPd25Qcm9wZXJ0eSIsIkZ1bmN0aW9uIiwiYmluZCIsIndyYXBPYmplY3QiLCJ3cmFwcGVycyIsImNhY2hlIiwiY3JlYXRlIiwiaGFuZGxlcnMiLCJwcm94eVRhcmdldCIsInByb3AiLCJyZWNlaXZlciIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiZW51bWVyYWJsZSIsImRlc2MiLCJSZWZsZWN0IiwiZGVsZXRlUHJvcGVydHkiLCJ3cmFwRXZlbnQiLCJ3cmFwcGVyTWFwIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsImhhc0xpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJvblJlcXVlc3RGaW5pc2hlZFdyYXBwZXJzIiwib25SZXF1ZXN0RmluaXNoZWQiLCJyZXEiLCJ3cmFwcGVkUmVxIiwiZ2V0Q29udGVudCIsImxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZyIsIm9uTWVzc2FnZVdyYXBwZXJzIiwib25NZXNzYWdlIiwic2VuZGVyIiwic2VuZFJlc3BvbnNlIiwiZGlkQ2FsbFNlbmRSZXNwb25zZSIsIndyYXBwZWRTZW5kUmVzcG9uc2UiLCJzZW5kUmVzcG9uc2VQcm9taXNlIiwicmVzcG9uc2UiLCJzdGFjayIsInJlc3VsdCIsImVyciIsImlzUmVzdWx0VGhlbmFibGUiLCJzZW5kUHJvbWlzZWRSZXN1bHQiLCJtc2ciLCJlcnJvciIsIl9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXyIsImNhdGNoIiwid3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2siLCJyZXBseSIsIndyYXBwZWRTZW5kTWVzc2FnZSIsImFwaU5hbWVzcGFjZU9iaiIsIndyYXBwZWRDYiIsInB1c2giLCJzZW5kTWVzc2FnZSIsInN0YXRpY1dyYXBwZXJzIiwiZGV2dG9vbHMiLCJuZXR3b3JrIiwib25NZXNzYWdlRXh0ZXJuYWwiLCJ0YWJzIiwic2V0dGluZ01ldGFkYXRhIiwiY2xlYXIiLCJwcml2YWN5Iiwic2VydmljZXMiLCJ3ZWJzaXRlcyIsImNocm9tZSIsImlkIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VSb290IjoiIn0=