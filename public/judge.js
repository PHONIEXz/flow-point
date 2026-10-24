const copyUpdate = document.getElementById('copy-update');
copyUpdate.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('judge-update').textContent.trim());
    document.getElementById('copy-status').textContent = 'Update copied. Paste it into Confirmations or changes in your pack.';
    copyUpdate.textContent = 'Copied ✓';
  } catch {
    document.getElementById('copy-status').textContent = 'Copy is unavailable in this browser. Select and copy the update text below the button.';
  }
});
