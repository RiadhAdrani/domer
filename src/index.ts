import camelcase from 'camelcase';
import {
  CreateElementProps,
  EventModifier,
  LibraryConfig,
  EventHandler,
  ElementWithEvents,
} from './types.js';
import { hasProperty, isArray } from '@riadh-adrani/obj-utils';

export enum Namespace {
  SVG = 'http://www.w3.org/2000/svg',
  HTML = 'http://www.w3.org/1999/xhtml',
  MATH = 'http://www.w3.org/1998/Math/MathML',
}

export const EventModifiersList = [
  'stop',
  'prevent',
  'self',
  'capture',
  'once',
  'passive',
] as const;

let $config: LibraryConfig = {};

const ignoredProps = ['ns'];

const classPrefix = 'class:';

export const setConfig = (config: LibraryConfig = {}) => {
  $config = config;
};

export const element = <E = Element>(
  tag: string,
  props: CreateElementProps = {},
  children: Array<unknown> = [],
): E => {
  const ns = props.ns ?? Namespace.HTML;

  const el = document.createElementNS(ns, tag);

  // add event object
  (el as ElementWithEvents).__events__ = {};

  const classProps: Array<{ key: string; value: unknown }> = [];

  for (const prop of Object.keys(props)) {
    if (ignoredProps.includes(prop)) continue;

    const value = props[prop];

    // class and co
    if (isClassProp(prop)) {
      classProps.push({ key: prop, value });
      continue;
    }

    // check if it is an event
    const evProp = extractEventDetails(prop);
    if (evProp) {
      const { event, modifiers } = evProp;
      // add event listener
      setEventListener(prop, event, value, el, modifiers);

      continue;
    }

    // we consider it an attribute
    setAttribute(prop, value, el);
  }

  // make sure to add class Props
  if (classProps.length > 0) {
    const classes = resolveClassProps(classProps);

    setAttribute('class', classes, el);
  }

  // push children
  children.forEach(child => {
    const node = child instanceof Node ? child : text(child);

    el.appendChild(node);
  });

  return el as E;
};

export const text = (data: unknown = ''): Text => {
  return document.createTextNode(`${data}`);
};

export const resolveClassProps = (props: Array<{ value: unknown; key: string }>): string => {
  // sort and filter
  const sorted = [
    ...props.filter(it => it.key === 'class'),
    ...props.filter(it => it.key === 'className'),
    ...props.filter(it => it.key.startsWith(classPrefix)),
  ];

  return sorted
    .reduce((acc, it) => {
      if (it.key.startsWith(classPrefix) && it.value) {
        acc.push(it.key.substring(classPrefix.length));
      } else if (isArray(it.value)) {
        acc.push((it.value as Array<unknown>).filter(it => Boolean(it)).join(' '));
      } else if (typeof it.value === 'string') {
        acc.push(it.value);
      }

      return acc;
    }, [] as Array<string>)
    .join(' ');
};

export const isClassProp = (prop: string): boolean => {
  if (prop === 'class') return true;

  if (prop === 'className' && !$config.attributes?.class?.className) {
    return true;
  }

  if (prop.startsWith(classPrefix) && $config.attributes?.class?.directive !== false) {
    return true;
  }

  return false;
};

const atVueEventRegex = /@[a-zA-Z][a-zA-Z0-9\-:]*/;
const onReactEventRegex = /on[a-zA-Z][a-zA-Z0-9\-:]*/;
const onSvelteEventRegex = /on:[a-zA-Z][a-zA-Z0-9\-:]*/;

export const extractEventDetails = (
  prop: string,
): { event: string; modifiers: Array<EventModifier> } | false => {
  let withModifiers: string;

  if (atVueEventRegex.test(prop) && $config.events?.syntax?.vue !== false) {
    withModifiers = prop.substring(1);
  } else if (onReactEventRegex.test(prop) && $config.events?.syntax?.react !== false) {
    withModifiers = prop.substring(2);
  } else if (onSvelteEventRegex.test(prop) && $config.events?.syntax?.svelte !== false) {
    withModifiers = prop.substring(3);
  } else {
    return false;
  }

  const modifierStart = withModifiers.indexOf(':');

  if (modifierStart === -1) {
    return { event: withModifiers.toLowerCase(), modifiers: [] };
  }

  const event = withModifiers.substring(0, modifierStart).toLowerCase();

  // process modifiers
  const modifiers = withModifiers
    .substring(modifierStart + 1)
    .split('-')
    .reduce((acc, modifier) => {
      if (EventModifiersList.includes(modifier as EventModifier)) {
        acc.push(modifier as EventModifier);
      }

      return acc;
    }, [] as Array<EventModifier>);

  return { event, modifiers };
};

export const setEventListener = (
  fullEvent: string,
  event: string,
  value: unknown,
  element: Element,
  modifiers: Array<EventModifier> = [],
) => {
  let raw: EventHandler;

  if (typeof value === 'function') {
    raw = value as EventHandler;
  } else {
    raw = () => 0;
  }

  const modified: EventHandler =
    modifiers.length === 0
      ? raw
      : e => {
          // self modifier
          if (modifiers.includes('self') && e.target !== element) {
            return;
          }

          for (const modifier of modifiers) {
            if (modifier === 'stop') {
              e.stopPropagation();
            } else if (modifier === 'prevent') {
              e.preventDefault();
            }
          }

          raw(e);
        };

  const callback = $config.events?.wrapper
    ? (e: Event) => $config.events?.wrapper?.(e, modified)
    : modified;

  const options: AddEventListenerOptions = {};

  if (modifiers.includes('once')) {
    options.once = true;
  }

  if (modifiers.includes('capture')) {
    options.capture = true;
  }

  if (modifiers.includes('passive')) {
    options.passive = true;
  }

  // the listener should be inserted in the element
  (element as ElementWithEvents).__events__[fullEvent] = callback;

  element.addEventListener(event, callback, options);
};

export const removeEventListener = (fullEvent: string, event: string, element: Element) => {
  const events = (element as ElementWithEvents)?.__events__;

  const callback = events?.[fullEvent];

  if (callback) {
    element.removeEventListener(event, callback);
  }
};

export const setAttribute = (attr: string, value: unknown, el: Element) => {
  let v = `${value}`;

  let set = true;

  if (toggleableAttributes.includes(attr)) {
    // toggle attribute
    el.toggleAttribute(attr, Boolean(value));
  } else {
    if (attr === 'style' && (el as HTMLElement).style) {
      const html = el as HTMLElement;

      // string
      if (typeof value === 'string') {
        v = value;
      }
      // object
      else if (value && typeof value === 'object') {
        // do not set attribute
        set = false;

        Object.keys(value).forEach(key => {
          try {
            (html.style as unknown as Record<string, string>)[key] = `${
              (value as Record<string, unknown>)[key]
            }`;
          } catch (err) {
            console.error(err);
          }
        });
      }
    }

    if (set) {
      el.setAttribute(attr, v);
    }
  }

  const prop = attrToProp(attr);

  if (set && hasProperty(el, prop)) {
    (el as unknown as Record<string, unknown>)[prop] = v;
  }
};

export const removeAttribute = (attr: string, el: Element) => {
  if (toggleableAttributes.includes(attr)) {
    el.toggleAttribute(attr, false);
  }

  el.removeAttribute(attr);

  const prop = attrToProp(attr);

  if (hasProperty(el, prop)) {
    delete (el as unknown as Record<string, unknown>)[prop];
  }
};

export const attrToProp = (attr: string): string => {
  // we check if key exist in the htmlToDom map
  let pair: { key: string; value: string } | undefined;

  for (const key of Object.keys(htmlToDom)) {
    const value = htmlToDom[key as keyof typeof htmlToDom];

    if (key === attr || value === attr) {
      pair = { key, value };
    }
  }

  if (pair) {
    return pair.value;
  }

  return camelcase(attr.replaceAll(':', ' '));
};

export const insertNode = (node: Node, parent: Node, position = -1) => {
  const child = parent.childNodes.item(position);

  parent.insertBefore(node, child);
};

export const changeNodePosition = (node: Node, position: number) => {
  if (!node.parentNode) return;

  insertNode(node, node.parentNode, position);
};

export const removeNode = (node: ChildNode) => {
  node.remove();
};

export const setText = (data: unknown, node: Text) => {
  node.data = `${data}`;
};

export const htmlToDom = {
  class: 'className',
  accesskey: 'accessKey',
  autocapitalize: 'autoCapitalize',
  contenteditable: 'contentEditable',
  contextmenu: 'contextMenu',
  playsinline: 'playsInline',
  spellcheck: 'spellCheck',
  tabindex: 'tabIndex',
  noshade: 'noShade',
  hreflang: 'hrefLang',
  referrerpolicy: 'referrerPolicy',
  datetime: 'dateTime',
  autoplay: 'autoPlay',
  crossorigin: 'crossOrigin',
  ismap: 'isMap',
  usemap: 'useMap',
  srclang: 'srcLang',
  allowfullscreen: 'allowFullScreen',
  allowpaymentrequest: 'allowPaymentRequest',
  srcdoc: 'srcDoc',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  autofocus: 'autoFocus',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  acceptcharset: 'acceptCharset',
  autocomplete: 'autoComplete',
  novalidate: 'noValidate',
  dirname: 'dirName',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  minlength: 'minLength',
};

export const toggleableAttributes = [
  'contenteditable',
  'autofocus',
  'autoplay',
  'allowfullscreen',
  'allowpaymentreques',
  'checked',
  'controls',
  'compact',
  'disabled',
  'hidden',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'open',
  'playsinline',
  'readonly',
  'required',
  'selected',
  'async',
  'defer',
];

export const noSetter = ['viewBox'];
