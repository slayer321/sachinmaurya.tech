(function() {
  var emoji = document.querySelector('.theme-toggle-emoji');
  if (!emoji) return;

  function updateEmoji() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      emoji.textContent = '☀️';
    } else if (theme === 'light') {
      emoji.textContent = '🌙';
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      emoji.textContent = prefersDark ? '☀️' : '🌙';
    }
  }

  updateEmoji();

  var observer = new MutationObserver(function() { updateEmoji(); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateEmoji);
})();
