import { changeNodePosition, element, insertNode, text } from '../src/index';

const input = element<HTMLInputElement>('input');
const img = element('img', { height: 50, width: 50 });
const p = element('p', {}, [text('hello')]);

const div = element('div', {}, [input, img, p]);

insertNode(div, document.body);

input.focus();

setTimeout(() => {
  changeNodePosition(input, 0);
}, 2000);
