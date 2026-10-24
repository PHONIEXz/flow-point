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

async function downloadSample(format, button) {
  button.disabled = true;
  const status = document.getElementById('download-status');
  status.textContent = `Preparing the sample ${format.toUpperCase()} download.`;
  try {
    const response = await fetch(`/sample-pack.${format}`);
    if (!response.ok) throw new Error('Download unavailable');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:.]/g, '');
    link.href = url; link.download = `SAMPLE - School Family Day - ${stamp}-${crypto.randomUUID().slice(0, 8)}.${format}`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = `The sample ${format.toUpperCase()} download has started. This is hand-authored sample data.`;
  } catch {
    status.classList.remove('sr-only');
    status.textContent = 'The download could not start. Please try again.';
  } finally { button.disabled = false; }
}
const pdfButton = document.getElementById('download-example');
const markdownButton = document.getElementById('download-example-md');
pdfButton.addEventListener('click', () => downloadSample('pdf', pdfButton));
markdownButton.addEventListener('click', () => downloadSample('md', markdownButton));
