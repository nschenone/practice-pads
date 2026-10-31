// Isolated browser profile; no listening or acoustic safety claim.
async page => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await page.reload();
  const sound = page.getByLabel('Sound');
  assert(await sound.inputValue() === 'Lush pad', 'Lush pad is the default sound');
  assert(JSON.stringify((await sound.locator('option').allTextContents()).slice(0, 2)) === JSON.stringify(['Lush pad', 'Electric keys']), 'preferred preset order');
  const octave = page.getByRole('group', { name: 'Chord octave' });
  const up = octave.getByRole('button', { name: 'Up one octave' });
  const down = octave.getByRole('button', { name: 'Down one octave' });
  const status = page.locator('.pp-player [role=status]');
  assert((await octave.textContent()).includes('F4'), 'selected chord starts at root octave four');
  await down.click(); assert((await octave.textContent()).includes('F3') && await down.isDisabled(), 'lower register bound');
  await up.click(); await up.click();
  assert((await octave.textContent()).includes('F5') && await up.isDisabled(), 'upper register bound');
  await down.click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await status.getByText('Playing', { exact: true }).waitFor({ timeout: 15000 });
  for (const sound of ['Lush pad', 'Electric keys']) {
    await page.getByLabel('Sound').selectOption(sound);
    await up.click(); await down.click();
    await page.getByLabel('Reverb', { exact: true }).fill('0.25');
    await page.getByRole('group', { name: 'Chord voicing' }).getByRole('button', { name: 'Spread' }).click();
    await status.getByText('Playing', { exact: true }).waitFor();
    assert(await page.getByRole('alert').count() === 0, `${sound} has no reported errors`);
  }
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  assert(await status.textContent() === 'Stopped', 'Stop works');
  await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption('natural-minor');
  assert((await octave.textContent()).includes('F4'), 'mode tonic uses the same octave register');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone has no page overflow');
  await page.reload();
  assert((await octave.textContent()).includes('F4'), 'new session defaults to octave four');
  return { presets: ['Lush pad', 'Electric keys'], rootOctaves: [3, 4, 5], defaultOctave: 4, reverbSelectable: true, playbackControls: true };
}
