/* Progressive enhancement only.
   Every page is complete and fully navigable without this file; all it adds is
   highlighting the reader's position in the contents list. No content is
   hidden, collapsed, filtered, or loaded at runtime. */

(function () {
  "use strict";

  var nav = document.querySelector(".doc-nav");
  if (!nav || !("IntersectionObserver" in window)) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
  if (!links.length) return;

  var byId = Object.create(null);
  var targets = [];

  links.forEach(function (link) {
    var id = decodeURIComponent(link.hash.slice(1));
    var el = id && document.getElementById(id);
    if (!el) return;
    byId[id] = link;
    targets.push(el);
  });
  if (!targets.length) return;

  var visible = new Set();
  var current = null;

  function paint() {
    var best = null;
    var bestTop = Infinity;
    visible.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < bestTop) {
        bestTop = top;
        best = el;
      }
    });
    if (!best || best === current) return;
    if (current && byId[current.id]) byId[current.id].removeAttribute("aria-current");
    current = best;
    var link = byId[best.id];
    if (!link) return;
    link.setAttribute("aria-current", "true");
    // Keep the active entry in view without yanking the page around.
    var navBox = nav.getBoundingClientRect();
    var linkBox = link.getBoundingClientRect();
    if (linkBox.top < navBox.top || linkBox.bottom > navBox.bottom) {
      nav.scrollTop += linkBox.top - navBox.top - navBox.height / 3;
    }
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      paint();
    },
    { rootMargin: "-72px 0px -65% 0px", threshold: 0 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();
