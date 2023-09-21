import { decorateIcons } from '../../scripts/lib-franklin.js';
import {
  div, span,
} from '../../scripts/dom-helpers.js';

const openAttribute = 'aria-expanded';

function isFaq(block) {
  return block.classList.contains('faq');
}

function applyColumnLayout(contentNodes) {
  let applyLayout = false;
  contentNodes.forEach((elem) => {
    if (applyLayout) return;
    if (elem.querySelector('picture')) {
      applyLayout = true;
    }
  });
  return applyLayout;
}

function renderColumnLayout(row) {
  const picture = row[0];
  const text = row[1];
  const link = row[2];
  if (link) link.querySelector('a').append(span({ class: 'icon icon-fa-arrow-circle-right' }));

  const leftCol = div({ class: 'accordion-content-col-left' }, picture);
  const rightCol = div({ class: 'accordion-content-col-right' }, text, link);
  const rowContent = div({ class: 'accordion-content-row' }, leftCol, rightCol);
  return rowContent;
}

async function renderContent(container, content, isBlockFaq) {
  // prepare content
  const rows = [];
  content.forEach((elem) => {
    if (elem.querySelector('picture')) {
      rows.push([]);
    }
    if (rows.length - 1 < 0) rows.push([]);
    rows[rows.length - 1].push(elem);
  });

  // render content
  const contentDiv = div({ class: 'accordion-content' });
  rows.forEach((row) => {
    const hasColumnLayout = applyColumnLayout(row);
    if (hasColumnLayout) {
      const rowContent = renderColumnLayout(row);
      contentDiv.appendChild(rowContent);
    } else {
      row.forEach((elem) => {
        contentDiv.append(elem);
      });
    }
  });
  if (isBlockFaq) {
    contentDiv.setAttribute('itemprop', 'acceptedAnswer');
    contentDiv.setAttribute('itemtype', 'https://schema.org/Answer');
    contentDiv.setAttribute('itemscope', '');
    const accordionChild = contentDiv.firstChild;
    accordionChild.setAttribute('itemprop', 'text');
  }
  container.append(contentDiv);
}

export default async function decorate(block) {
  const isBlockFaq = isFaq(block);
  const isTypeNumbers = block.classList.contains('numbers');
  if (isBlockFaq) {
    block.setAttribute('itemtype', 'https://schema.org/FAQPage');
    block.setAttribute('itemscope', '');
  }
  const accordionItems = block.querySelectorAll(':scope > div > div');
  accordionItems.forEach((accordionItem, idx) => {
    const nodes = accordionItem.children;
    const titleText = nodes[0];
    const rest = Array.prototype.slice.call(nodes, 1);

    const header = div({ class: 'accordion-trigger' },
      (isTypeNumbers) ? span({ class: 'number' }, (idx + 1)) : '',
      titleText,
      span({ class: 'icon icon-fa-chevron-right' }),
    );

    const item = div({ class: 'accordion-item' });
    if (isBlockFaq) {
      item.setAttribute('itemtype', 'https://schema.org/Question');
      item.setAttribute('itemscope', '');
      header.setAttribute('itemProp', 'name');
    }

    item.appendChild(header);
    renderContent(item, rest, isBlockFaq);

    if (idx === 0) item.setAttribute(openAttribute, '');

    decorateIcons(item);

    accordionItem.replaceWith(item);
  });

  const triggers = block.querySelectorAll('.accordion-trigger');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const wasOpen = trigger.parentElement.hasAttribute(openAttribute);

      triggers.forEach((_trigger) => {
        _trigger.parentElement.removeAttribute(openAttribute);
      });

      if (!wasOpen) {
        trigger.parentElement.setAttribute(openAttribute, '');
      }
    });
  });
}
