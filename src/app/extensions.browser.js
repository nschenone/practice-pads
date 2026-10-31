async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.reload();
  const selected = page.locator('.pp-now strong');
  const family = page.getByRole('combobox', { name: 'Family', exact: true });
  const chooseCLydian = async () => {
    await family.selectOption('major');
    await page.getByRole('button', { name: /^Parent tonic / }).click();
    await page.getByRole('button', { name: 'C major', exact: true }).click();
    await page.locator('.pp-modes button').nth(3).click();
  };
  await chooseCLydian();
  assert(await selected.textContent() === 'Fmaj7 (9, #11, 13)', 'requested F Lydian label');
  assert(await page.getByText('Mode extensions · not played', { exact: true }).isVisible(), 'visible playback distinction');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('.pp-player [role=status]').getByText('Playing', { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Spread', exact: true }).click();
  assert(await selected.textContent() === 'Fmaj7 (9, #11, 13)', 'spread does not change descriptive labels');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  for (const value of ['major', 'natural-minor', 'jazz-melodic-minor', 'harmonic-minor']) {
    await family.selectOption(value);
    for (let degree = 0; degree < 7; degree++) {
      const card = page.locator('.pp-modes button').nth(degree);
      await card.click();
      const chord = await card.locator('strong').textContent();
      const intervals = await page.locator('.pp-notes li > span:first-of-type').allTextContents();
      const extensions = [1, 3, 5].map(i => intervals[i].replace(/\d+$/, n => String(Number(n) + 7)));
      assert(await selected.textContent() === `${chord} (${extensions.join(', ')})`, `${value} mode ${degree + 1} label matches its notes`);
      assert(await page.getByRole('alert').count() === 0, 'no app errors');
    }
  }
  await chooseCLydian();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no document overflow at ${width}px`);
  }
  return { selected: await selected.textContent(), modesChecked: 28, displayOnly: true, responsiveWidths: [1280, 390, 320] };
}
