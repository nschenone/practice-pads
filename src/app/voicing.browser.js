async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.reload();
  const group = page.getByRole('group', { name: 'Chord voicing' });
  const close = group.getByRole('button', { name: 'Close' });
  const spread = group.getByRole('button', { name: 'Spread' });
  assert(await close.getAttribute('aria-pressed') === 'true', 'close default');
  await spread.click();
  assert(await spread.getAttribute('aria-pressed') === 'true', 'spread selected');
  await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption('major');
  assert(await spread.getAttribute('aria-pressed') === 'true', 'selection retained across family');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  assert(await close.getAttribute('aria-pressed') === 'true', 'close available again');
  await page.reload();
  assert(await close.getAttribute('aria-pressed') === 'true', 'close default on new session');
  return { closeSpreadSelectable: true, defaultClose: true };
}
