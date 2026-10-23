(() => {
  const key = 'flow-point-theme';
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Browser storage may be unavailable. */ }
  const preferred = saved === 'light' || saved === 'dark'
    ? saved
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = preferred;

  function updateControls() {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const action = dark ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${action} mode`);
      button.title = `Switch to ${action} mode`;
      button.setAttribute('aria-pressed', String(dark));
      button.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
      button.querySelector('.theme-label').textContent = dark ? 'Light' : 'Dark';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateControls();
    document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(key, next); } catch { /* The switch still works this visit. */ }
      updateControls();
    }));
  });
})();
