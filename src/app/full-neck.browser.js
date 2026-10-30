// Disposable browser profile only: clears this app's test mappings and preference.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.evaluate(() => { localStorage.removeItem('practice-pads-fingerings-v1'); localStorage.removeItem('practice-pads-neck-view'); });
  await page.reload();
  const frame = () => page.locator('.pp-guitar svg').evaluate(svg => JSON.stringify({
    viewBox: svg.getAttribute('viewBox'),
    frets: [...svg.querySelectorAll('.fret-numbers text')].map(node => node.textContent),
    dots: [...svg.querySelectorAll('.dot')].map(dot => [dot.getAttribute('class').match(/dot-id-s\d+:f\d+/)?.[0], dot.querySelector('circle').getAttribute('cx'), dot.querySelector('circle').getAttribute('cy')]),
  }));
  const family = page.getByRole('combobox', { name: 'Family', exact: true });
  await page.getByRole('button', { name: 'Full neck', exact: true }).click();
  const results = [];
  for (const scale of ['jazz-melodic-minor','natural-minor','harmonic-minor','major']) {
    await family.selectOption(scale);
    const baseline = await frame();
    const highlights = [];
    for (const shape of ['C','A','G','E','D']) {
      await page.getByRole('button', { name: `${shape} shape (unreviewed)`, exact: true }).click();
      const current = await frame();
      assert(current === baseline, `${scale} neck moved or cropped when selecting ${shape}`);
      const active = page.locator('.pp-guitar .dot:has([data-position=true])');
      highlights.push(await active.evaluateAll(dots => dots.map(dot => dot.getAttribute('class').match(/dot-id-s\d+:f\d+/)?.[0]).sort().join('|')));
      assert(await page.locator('.pp-guitar .dot').evaluateAll(dots => dots.every(dot => Number(dot.getAttribute('opacity')) === (dot.querySelector('[data-position=true]') ? 1 : 0.3))), 'focus opacity');
      await page.locator('.pp-modes button').first().click();
      assert(await frame() === baseline, `${scale} mode changed neck geometry`);
      await page.locator('.pp-modes button').nth(2).click();
      assert(await frame() === baseline, `${scale} derivative mode changed neck geometry`);
    }
    assert(new Set(highlights).size === 5, 'highlight changes for all five shapes');
    results.push(scale);
  }
  await family.selectOption('jazz-melodic-minor');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const host = page.locator('.pp-fretboard-scroll');
  await host.evaluate(el => { el.scrollLeft = el.scrollWidth; });
  const pan = await host.evaluate(el => el.scrollLeft);
  assert(pan > 0, 'mobile overview can pan');
  for (const shape of ['C','A','G','E','D']) {
    await page.getByRole('button', { name: `${shape} shape (unreviewed)`, exact: true }).click();
    await page.locator('.pp-modes button').first().click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await host.evaluate(el => el.scrollLeft) === pan, 'mobile pan must survive shape and mode changes');
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'D shape (unreviewed)', exact: true }).click();
  await page.getByText('Edit position', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Keyboard note' }).selectOption('1:24');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  const extended = await frame();
  for (const shape of ['C','A','G','E','D']) {
    await page.getByRole('button', { name: `${shape} shape (unreviewed)`, exact: true }).click();
    assert(await frame() === extended, 'higher custom position must not zoom other positions');
  }
  await page.reload();
  await page.locator('.pp-guitar .fret-numbers text').last().filter({ hasText: '24' }).waitFor();
  assert(await frame() === extended, 'unvisited saved D mapping fixes the initial overview extent');
  await page.getByRole('button', { name: 'A shape (unreviewed)', exact: true }).click();
  assert(await frame() === extended, 'saved extent stable after reload and shape change');
  return { savedMappingExtentStable: true, mobilePanStable: true, stableFamilies: results, shapesPerFamily: 5, coordinatesAndScaleUnchanged: true, opacityPreserved: true };
}
