/* Nav mega-menu open/close.
 *
 * The CSS opens the panels on :hover / :focus-within on its own — that is the
 * no-JS fallback and the keyboard path. This adds the two things :hover cannot
 * do: a close delay, so the cursor can travel from the trigger to the panel
 * without the panel vanishing mid-move, and Escape-to-close with focus kept on
 * the trigger.
 *
 * Escape needs an explicit `.is-dismissed` class rather than just dropping
 * `.is-open`: the right place for focus after Escape is the trigger the user
 * pressed it on, so the CSS `:focus-within` rule is STILL matching and would
 * hold the panel open. See the matching !important rule in css/style.css.
 *
 * The Support panel's rail holds a video with no `autoplay`: it starts here
 * when the panel opens and pauses when it closes, so a page nobody hovers
 * never fetches it, and the five panels on every page never hold five
 * decoding videos. Honours prefers-reduced-motion by leaving the poster up.
 *
 * Panels live inside `li.dropdown.has-mega`; both classes go on that <li>.
 * See the NAV MEGA MENU section in css/style.css.
 */
(function () {
  'use strict';

  var CLOSE_DELAY = 180;
  var items = document.querySelectorAll('li.dropdown.has-mega');
  if (!items.length) return;

  var stillPreferred = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function triggerOf(li) {
    return li.querySelector(':scope > a');
  }

  function playMedia(li) {
    var video = li.querySelector('video.mega-feature-video');
    if (!video || (stillPreferred && stillPreferred.matches)) return;
    // Never awaited: on WebKit a play() promise can stay pending forever, and
    // a muted autoplay that the browser declines is not an error worth seeing.
    var started = video.play();
    if (started && started.catch) started.catch(function () {});
  }

  function pauseMedia(li) {
    var video = li.querySelector('video.mega-feature-video');
    if (video) video.pause();
  }

  function close(li) {
    pauseMedia(li);
    li.classList.remove('is-open');
    var a = triggerOf(li);
    if (a) a.setAttribute('aria-expanded', 'false');
  }

  Array.prototype.forEach.call(items, function (li) {
    var trigger = triggerOf(li);
    var timer = null;

    function open() {
      window.clearTimeout(timer);
      li.classList.remove('is-dismissed');
      // Only one panel at a time — hovering a sibling should swap, not stack.
      Array.prototype.forEach.call(items, function (other) {
        if (other !== li) close(other);
      });
      li.classList.add('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      playMedia(li);
    }

    function scheduleClose() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        li.classList.remove('is-dismissed');
        close(li);
      }, CLOSE_DELAY);
    }

    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', scheduleClose);
    li.addEventListener('focusin', open);
    li.addEventListener('focusout', function (e) {
      if (li.contains(e.relatedTarget)) return;
      window.clearTimeout(timer);
      li.classList.remove('is-dismissed');
      close(li);
    });
    li.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      window.clearTimeout(timer);
      close(li);
      li.classList.add('is-dismissed');
      if (trigger) trigger.focus();
    });
  });
})();
