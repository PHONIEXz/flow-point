const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
function activate(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (next) { event.preventDefault(); activate(next); next.focus(); }
  });
});

const downloadButton = document.getElementById('download-example');
downloadButton.addEventListener('click', async () => {
  downloadButton.disabled = true;
  const status = document.getElementById('download-status');
  status.textContent = 'Preparing the sample download.';
  try {
    const response = await fetch('/sample-pack.md');
    if (!response.ok) throw new Error('Download unavailable');
    const url = URL.createObjectURL(new Blob([await response.text()], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'flow-point-sample-pack.md';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'The sample download has started.';
  } catch {
    status.classList.remove('sr-only');
    status.textContent = 'The download could not start. Please try again.';
  } finally { downloadButton.disabled = false; }
});
