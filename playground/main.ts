import { element, insertNode, setAttribute } from '../src/index';

const input = element<HTMLInputElement>('input');
const btn = element(
  'button',
  {
    onClick: () => {
      setAttribute('hidden', !input.hidden, input);
    },
  },
  ['Toggle input'],
);

const div = element('div', {}, [btn, input]);

insertNode(div, document.body);
