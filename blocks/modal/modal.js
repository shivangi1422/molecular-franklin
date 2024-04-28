/* eslint-disable import/no-cycle */
import {
  button, div, span,
} from '../../scripts/dom-helpers.js';
import { createOptimizedPicture, loadCSS, loadScript } from '../../scripts/lib-franklin.js';
import { newsletterModal } from '../../templates/blog/blog.js';

let timer;
const modalParentClass = 'modal-overlay';

export function iframeResizeHandler(iframeURL, iframeID, root) {
  loadScript('/scripts/iframeResizer.min.js');
  root.querySelector('iframe').addEventListener('load', async () => {
    if (iframeURL) {
      /* global iFrameResize */
      iFrameResize({ log: false }, `#${iframeID}`);
    }
  });
}

export function hideModal() {
  const modal = document.querySelector(`.${modalParentClass}`);
  modal.setAttribute('aria-hidden', true);
  document.body.classList.remove('no-scroll');
  clearTimeout(timer);
}

export function showModal() {
  const modal = document.querySelector(`.${modalParentClass}`);
  modal.removeAttribute('aria-hidden');
  document.body.classList.add('no-scroll');
}

export function triggerModalWithUrl(url) {
  const modal = document.querySelector(`.${modalParentClass}`);
  const iframeElement = modal.querySelector('iframe');
  setTimeout(() => {
    iframeElement.src = url;
  }, 200);
  timer = setTimeout(showModal, 500);
}

export function stopProp(event) {
  event.stopPropagation();
}

function triggerModalBtn(scrollThreshold) {
  const modalBtn = document.getElementById('show-modal');
  const scrollFromTop = window.scrollY;
  const midHeightOfViewport = Math.floor(
    document.body.getBoundingClientRect().height / scrollThreshold);
  if (scrollFromTop > midHeightOfViewport && modalBtn) {
    modalBtn.click();
    modalBtn.remove();
  }
}

export async function decorateModal(formURL, iframeID, modalBody, modalClass, isFormModal) {
  loadCSS('/blocks/modal/modal.css');
  const modal = document.querySelector(`.${modalParentClass}`);

  if (!modal) {
    const formOverlay = div({ 'aria-hidden': true, class: modalParentClass, style: 'display:none;' });
    const closeBtn = span({ class: 'icon icon-close' }, createOptimizedPicture('/icons/close-video.svg', 'Close Video'));
    const innerWrapper = div({ class: ['modal-inner-wrapper', modalClass] }, modalBody, closeBtn);

    iframeResizeHandler(formURL, iframeID, modalBody);

    if (isFormModal) {
      const modalBtn = button({ id: 'show-modal', style: 'display: none;' }, 'Show Modal');
      modalBtn.addEventListener('click', showModal);
      document.body.append(modalBtn);
      window.addEventListener('scroll', () => triggerModalBtn(2.25, modalBtn));
    }

    formOverlay.addEventListener('click', hideModal);
    closeBtn.addEventListener('click', hideModal);
    innerWrapper.addEventListener('click', stopProp);

    formOverlay.append(innerWrapper);
    document.body.append(formOverlay);

    timer = setTimeout(() => {
      formOverlay.removeAttribute('style');
    }, 500);
  }
}

export default async function decorate(block) {
  const isBlogModal = block.classList.contains('blog-popup');

  if (isBlogModal) {
    const modalContent = block.querySelector(':scope > div > div');
    const link = modalContent.querySelector('p > a:only-child, a:only-child');
    const formURL = link.href;
    await newsletterModal(formURL, 'form-modal');
    const modalBtn = document.getElementById('show-modal');
    window.addEventListener('scroll', () => triggerModalBtn(3.75, modalBtn));
  }

  block.closest('.section').remove();
}
