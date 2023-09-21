// eslint-disable-next-line object-curly-newline
import { div, h1, p } from '../../scripts/dom-helpers.js';
import { getMetadata, createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getCookie, isAuthorizedUser, loadScript } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

async function iframeResizeHandler() {
  await new Promise((resolve) => {
    loadScript('/scripts/iframeResizer.min.js', () => { resolve(); });
  });

  /* global iFrameResize */
  iFrameResize({ log: false });
}

function handleEmbed() {
  try {
    const cmpCookieValue = getCookie('cmp');
    if (cmpCookieValue) {
      document.querySelectorAll('.embed a').forEach((link) => {
        const href = link.getAttribute('href');
        const url = new URL(href);
        if (url.searchParams.get('cmp')) {
          url.searchParams.set('cmp', cmpCookieValue);
          link.setAttribute('href', url.toString());
        }
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to change the campaing ID: ${err.message}`);
  }

  const observer = new MutationObserver((mutations) => {
    const embed = document.querySelector('main .embed.block.embed-is-loaded');
    if (embed) {
      iframeResizeHandler(embed);

      // adjust parent div's height dynamically
      mutations.forEach((record) => {
        const grandGrandParent = record.target.parentElement.parentElement.parentElement;
        if (record.target.tagName === 'IFRAME'
            && grandGrandParent.classList.contains('embed')
        ) {
          const { height } = record.target.style;
          if (height) {
            const parent = record.target.parentElement;
            parent.style.height = height;
          }
        }
      });
    }
  });
  observer.observe(document.querySelector('main'), {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
  });
}

export default async function buildAutoBlocks() {
  if (isAuthorizedUser()) {
    const path = window.location.pathname;
    const pageIndex = await ffetch('/query-index.json').sheet('gated-resources').all();
    const foundPage = pageIndex.find((page) => page.gatedURL === path || page.gatedURL.endsWith(`moleculardevices.com${path}`));
    if (foundPage) {
      window.location.replace(foundPage.path);
    }
  }

  const pageParam = (new URLSearchParams(window.location.search)).get('page');
  if (pageParam && pageParam === 'thankyou') {
    document.body.classList.add('thankyou');
    document.querySelector('.hero > div:nth-of-type(2)').replaceWith(div(
      div(h1('Thank you.'), p(`Your ${getMetadata('download-title') || 'document'} is on its way.`)),
      div(createOptimizedPicture('/images/thank-you-spectra.png', 'Thank you Spectra', false, [{ width: '750' }])),
    ));
  }
  handleEmbed();
}
