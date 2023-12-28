import { ElementWithEvents, EventHandler } from '../types.js';
import {
  changeNodePosition,
  element,
  insertNode,
  removeNode,
  setText,
  text,
  attrToProp,
  setAttribute,
  setEventListener,
  setConfig,
  removeEventListener,
  extractEventDetails,
  isClassProp,
  resolveClassProps,
} from '../index.js';
import { it, describe, expect, beforeEach, vitest } from 'vitest';

describe('text', () => {
  it('should create a text node', () => {
    const node = text(null);

    expect(node instanceof Text).toBe(true);
  });

  it('should insert content correctly', () => {
    const node = text('test');

    expect(node.data).toBe('test');
  });

  it('should stringify non-string input', () => {
    const node = text(1);

    expect(node.data).toBe('1');
  });
});

describe('setText', () => {
  it('should update text content', () => {
    const node = text('test');

    setText('hello', node);

    expect(node.data).toBe('hello');
  });

  it('should stringify new text', () => {
    const node = text('test');

    setText(undefined, node);

    expect(node.data).toBe('undefined');
  });
});

describe('removeNode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should remove text', () => {
    const node = text('hello');

    document.body.append(node);

    removeNode(node);

    expect(document.body.innerHTML).toBe('');
  });

  it('should remove element', () => {
    const node = element('div', {}, []);

    document.body.append(node);

    removeNode(node);

    expect(document.body.innerHTML).toBe('');
  });
});

describe('insertNode', () => {
  let n1 = text(1);
  let n2 = text(2);
  let n3 = text(3);
  let n4 = text(4);
  let n5 = text(5);

  beforeEach(() => {
    n1 = text(1);
    n2 = text(2);
    n3 = text(3);
    n4 = text(4);
    n5 = text(5);

    document.body.innerHTML = '';

    [n1, n2, n3, n4, n5].forEach(it => document.body.append(it));
  });

  it('should insert element', () => {
    const el = element('div', {}, []);

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('12345<div></div>');
  });

  it('should insert element at a given position', () => {
    const el = element('div', {}, []);

    insertNode(el, document.body, 1);

    expect(document.body.innerHTML).toBe('1<div></div>2345');
  });

  it('should insert element at end (++)', () => {
    const el = element('div', {}, []);

    insertNode(el, document.body, 10);

    expect(document.body.innerHTML).toBe('12345<div></div>');
  });

  it('should insert element at end (-1)', () => {
    const el = element('div', {}, []);

    insertNode(el, document.body, -1);

    expect(document.body.innerHTML).toBe('12345<div></div>');
  });
});

describe('changeNodePosition', () => {
  let n1 = text(1);
  let n2 = text(2);
  let n3 = text(3);
  let n4 = text(4);
  let n5 = text(5);
  let input = element<HTMLInputElement>('input');

  beforeEach(() => {
    n1 = text(1);
    n2 = text(2);
    n3 = text(3);
    n4 = text(4);
    n5 = text(5);
    input = element('input');

    document.body.innerHTML = '';

    [n1, n2, n3, n4, n5, input].forEach(it => document.body.append(it));
  });

  it('should change node position', () => {
    changeNodePosition(n1, 3);

    expect(document.body.innerHTML).toBe('23145<input>');
  });

  it('should not make input element loose focus when reinserting the node in the same position', () => {
    input.focus();

    changeNodePosition(input, 5);

    expect(document.activeElement).toStrictEqual(input);
  });

  it('should not make input element loose focus when reinserting the node in the same position (+1)', () => {
    input.focus();

    changeNodePosition(input, 6);

    expect(document.activeElement).toStrictEqual(input);
  });
});

describe('attrToProp', () => {
  it('should convert attr to prop from record', () => {
    expect(attrToProp('class')).toBe('className');
  });

  it('should camelcase attr if not found in record', () => {
    expect(attrToProp('a-test')).toBe('aTest');
  });

  it('should remove ":" when camelcasing', () => {
    expect(attrToProp('the:test')).toBe('theTest');
  });
});

describe('setAttribute', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = element('div');
  });

  it('should set element attribute', () => {
    setAttribute('class', 'hello', el);

    expect(el.getAttribute('class')).toBe('hello');
  });

  it('should set element prop', () => {
    setAttribute('class', 'hello', el);

    expect(el.className).toBe('hello');
  });

  it('should set element style (object)', () => {
    setAttribute('style', { color: 'red' }, el);

    expect(el.style.color).toBe('red');
  });

  it('should set element style (string)', () => {
    setAttribute('style', 'color:red', el);

    expect(el.style.color).toBe('red');
  });

  it('should toggle attribute on', () => {
    setAttribute('hidden', true, el);

    expect(el.hidden).toBe(true);
  });

  it('should toggle attribute off', () => {
    setAttribute('hidden', true, el);
    setAttribute('hidden', false, el);

    expect(el.hidden).toBe(false);
  });
});

describe('extractEventDetails', () => {
  beforeEach(() => setConfig());

  it('should extract react style event', () => {
    expect(extractEventDetails('onClick')).toStrictEqual({ event: 'click', modifiers: [] });
  });

  it('should return false (click)', () => {
    expect(extractEventDetails('click')).toStrictEqual(false);
  });

  it('should ignore react (config)', () => {
    setConfig({
      events: {
        syntax: {
          react: false,
        },
      },
    });

    expect(extractEventDetails('onClick')).toStrictEqual(false);
  });

  it('should extract vue style event', () => {
    expect(extractEventDetails('@click')).toStrictEqual({ event: 'click', modifiers: [] });
  });

  it('should ignore vue (config)', () => {
    setConfig({
      events: {
        syntax: {
          vue: false,
        },
      },
    });

    expect(extractEventDetails('@click')).toStrictEqual(false);
  });

  it('should extract svelte style event', () => {
    expect(extractEventDetails('on:click')).toStrictEqual({ event: 'click', modifiers: [] });
  });

  it('should ignore svelte (config)', () => {
    setConfig({
      events: {
        syntax: {
          svelte: false,
        },
      },
    });

    expect(extractEventDetails('on:click')).toStrictEqual(false);
  });

  it('should extract modifiers', () => {
    expect(extractEventDetails('onClick:prevent')).toStrictEqual({
      event: 'click',
      modifiers: ['prevent'],
    });
  });

  it('should extract filter modifiers ', () => {
    expect(extractEventDetails('onClick:prevent-yeet')).toStrictEqual({
      event: 'click',
      modifiers: ['prevent'],
    });
  });
});

describe('setEventListener', () => {
  let el: HTMLElement;
  let cb: () => void;

  beforeEach(() => {
    setConfig();

    document.body.innerHTML = '';

    el = element('div');
    cb = vitest.fn();

    insertNode(el, document.body);
  });

  it('should add event listener', () => {
    setEventListener('click', 'click', cb, el);

    el.click();

    expect(cb).toHaveBeenCalledOnce();
  });

  it('should remove old event listener before adding a new one', () => {
    const old = vitest.fn();

    setEventListener('click', 'click', old, el);

    setEventListener('click', 'click', cb, el);

    el.click();

    expect(old).toHaveBeenCalledTimes(0);
  });

  it('should add callback to event store', () => {
    setEventListener('clicker', 'click', cb, el);

    expect((el as unknown as ElementWithEvents).__events__['clicker']).toStrictEqual(cb);
  });

  it('should add empty callback when value is not a function', () => {
    setEventListener('clicker', 'click', true, el);

    expect(typeof (el as unknown as ElementWithEvents).__events__['clicker']).toBe('function');
  });

  it('should add self modifier', () => {
    const child = element<HTMLButtonElement>('button');

    setEventListener('click', 'click', true, child, []);

    insertNode(child, el);

    setEventListener('click', 'click', cb, el, ['self']);

    child.click();

    expect(cb).toHaveBeenCalledTimes(0);
  });

  it('should add once modifier', () => {
    setEventListener('click', 'click', cb, el, ['once']);

    el.click();
    el.click();

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should add prevent modifier', () => {
    const cb = vitest.fn((e: Event) => {
      expect(e.defaultPrevented).toBe(true);
    });

    setEventListener('click', 'click', cb, el, ['prevent']);

    el.click();
  });

  it('should add stop modifier', () => {
    document.body.addEventListener('click', cb);

    setEventListener('click', 'click', cb, el, ['stop']);

    el.click();

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should add wrapper', () => {
    const wrapper = vitest.fn((e: Event, cb: EventHandler) => {
      cb(e);
    });

    setConfig({
      events: {
        wrapper,
      },
    });

    setEventListener('click', 'click', cb, el);

    el.click();

    expect(wrapper).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('removeEventListener', () => {
  let el: HTMLElement;
  let cb: () => void;

  beforeEach(() => {
    setConfig();

    document.body.innerHTML = '';

    el = element('div');
    cb = vitest.fn();

    setEventListener('click', 'click', cb, el);

    insertNode(el, document.body);
  });

  it('should remove event listener', () => {
    removeEventListener('click', 'click', el);

    el.click();

    expect(cb).toHaveBeenCalledTimes(0);
  });
});

describe('isClassProp', () => {
  beforeEach(() => setConfig());

  it('should accept (class)', () => {
    expect(isClassProp('class')).toBe(true);
  });

  it('should accept (className)', () => {
    expect(isClassProp('className')).toBe(true);
  });

  it('should accept class with prefix', () => {
    expect(isClassProp('class:test')).toBe(true);
  });

  it('should refuse class with prefix (config)', () => {
    setConfig({
      attributes: {
        class: {
          directive: false,
        },
      },
    });

    expect(isClassProp('class:test')).toBe(false);
  });

  it('should refuse other', () => {
    expect(isClassProp('cls')).toBe(false);
  });
});

describe('resolveClassProps', () => {
  beforeEach(() => setConfig());

  it('should create class', () => {
    const props = [{ value: '1', key: 'class' }];

    expect(resolveClassProps(props)).toBe('1');
  });

  it('should sort', () => {
    const props = [
      { value: true, key: 'class:2' },
      { value: '3', key: 'className' },
      { value: '1', key: 'class' },
    ];

    expect(resolveClassProps(props)).toBe('1 3 2');
  });
});

describe('element', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create an element', () => {
    const el = element('div');

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('<div></div>');
  });

  it('should add class attributes automatically', () => {
    const el = element('div', { class: '1', className: '2', 'class:3': true });

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('<div class="1 2 3"></div>');
  });

  it('should add event', () => {
    const fn = vitest.fn();

    const el = element<HTMLElement>('div', { onClick: fn });

    el.click();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should append children : string as Text', () => {
    const el = element('div', {}, ['hello']);

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('<div>hello</div>');
  });

  it('should append children : element', () => {
    const el = element('div', {}, [element('img')]);

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('<div><img></div>');
  });

  it('should append children : Text', () => {
    const el = element('div', {}, [text('1')]);

    insertNode(el, document.body);

    expect(document.body.innerHTML).toBe('<div>1</div>');
  });
});
