// Use only with a disposable browser profile; clears this app's test mappings/preferences.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.evaluate(() => { localStorage.removeItem('practice-pads-fingerings-v1'); localStorage.removeItem('practice-pads-neck-view'); });
  await page.reload();
  const family = page.getByRole('combobox', { name: 'Family', exact: true });
  await family.selectOption('natural-minor');
  const openCircle = async () => page.getByRole('button', { name: /^Parent tonic / }).click();
  await openCircle();
  assert(await page.locator('.pp-key-wedge').count() === 24, '24 major/minor wedge buttons');
  assert(await page.locator('.pp-key-wedge[aria-pressed=true]').count() === 1, 'single selected key');
  await page.getByRole('button', { name: 'A minor', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert(await family.inputValue() === 'natural-minor', 'minor family retained');
  assert(await page.getByRole('button', { name: 'Parent tonic A', exact: true }).count() === 1, 'own A minor parent');
  await page.locator('.pp-modes button').first().click();
  assert((await page.locator('.pp-notes strong').allTextContents()).join() === 'A,B,C,D,E,F,G', 'A natural-minor notes');
  assert(await page.locator('.pp-now strong').innerText() === 'Am7 (9, 11, b13)', 'natural-minor tonic chord and mode extensions');
  assert((await page.locator('.pp-modes button').nth(4).innerText()).includes('Em7'), 'minor V, not E7');
  await openCircle();
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Parent tonic A', exact: true }).getAttribute('aria-expanded') === 'false', 'Escape closes');
  assert(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) === 'Parent tonic A', 'Escape restores focus');
  await openCircle();
  await page.getByRole('button', { name: 'C major', exact: true }).focus();
  await page.keyboard.press('Space');
  assert(await family.inputValue() === 'major', 'outer wedge chooses major');
  await openCircle();
  await page.getByRole('button', { name: 'A minor', exact: true }).click();
  assert(await family.inputValue() === 'natural-minor', 'remembered natural-minor family');
  const coordinates = () => page.locator('.pp-guitar .dot').evaluateAll(dots => dots.map(dot => dot.getAttribute('class').match(/dot-id-s\d+:f\d+/)?.[0]).sort().join('|'));
  const shapes = [];
  for (const shape of ['C','A','G','E','D']) {
    await page.getByRole('button', { name: `${shape} shape (unreviewed)`, exact: true }).click();
    const original = await coordinates(); shapes.push(original);
    for (let degree = 0; degree < 7; degree++) {
      await page.locator('.pp-modes button').nth(degree).click();
      assert(await coordinates() === original, `${shape} retains physical coordinates in mode ${degree + 1}`);
      await page.waitForFunction(() => {
        const tonic = document.querySelector('.pp-notes strong')?.textContent;
        const dots = [...document.querySelectorAll('.pp-guitar .dot:has(.dot-circle[data-tonic=true]) .dot-text')];
        return dots.length > 0 && dots.every(dot => dot.textContent === tonic);
      });
    }
  }
  assert(new Set(shapes).size === 5, 'five actual natural-minor shapes');
  const selectedCount = await page.locator('.pp-guitar .dot').count();
  const highest = async () => Math.max(...Array.from((await coordinates()).matchAll(/:f(\d+)/g), match => Number(match[1])));
  const lastFret = Math.max(...Array.from(shapes.join('|').matchAll(/:f([0-9]+)/g), match => Number(match[1])));
  await page.getByRole('button', { name: 'Full neck', exact: true }).click();
  assert(await highest() === lastFret, 'full context covers all five positions');
  assert(await page.locator('.pp-guitar .dot').count() > selectedCount, 'background scale context retained');
  assert(await page.locator('.pp-guitar .dot-circle[data-position=true]').count() === selectedCount, 'selected shape highlighted in full context');
  assert(await page.locator('.pp-guitar .dot').evaluateAll(dots => dots.every(dot => Number(dot.getAttribute('opacity')) === (dot.querySelector('[data-position=true]') ? 1 : 0.3))), 'whole context dots and labels faded, selected notes opaque');
  assert(await page.locator('.pp-guitar .dot[opacity="0.3"]').count() > 0, 'non-focused notes present');
  await page.getByRole('button', { name: 'A shape (unreviewed)', exact: true }).click();
  const selectedHighest = await page.locator('.pp-guitar .dot:has([data-position=true])').evaluateAll(dots => Math.max(...dots.map(dot => Number(dot.getAttribute('class').match(/dot-fret-(\d+)/)[1]))));
  assert(await highest() === lastFret && selectedHighest <= lastFret, 'shape changes only the highlight, not the endpoint');
  await page.reload();
  assert(await page.getByRole('button', { name: 'Full neck', exact: true }).getAttribute('aria-pressed') === 'true', 'full-neck preference survives reload');
  await page.getByRole('button', { name: 'Exercise notation and tab', exact: true }).click();
  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Full neck', exact: true }).getAttribute('aria-pressed') === 'true', 'view retained across exercise');
  await page.getByRole('button', { name: 'Position', exact: true }).click();
  await page.reload();
  assert(await page.getByRole('button', { name: 'Position', exact: true }).getAttribute('aria-pressed') === 'true', 'position preference survives reload');
  await family.selectOption('natural-minor');
  assert(await page.getByText('Diagram info', { exact: true }).count() === 0, 'diagram info removed');
  const tonics = page.locator('.pp-guitar .dot-circle[data-tonic=true]');
  assert(await tonics.count() > 0, 'colored modal tonic');
  assert(await tonics.first().getAttribute('fill') === '#8dc6c0', 'teal tonic fill');
  assert(!(await page.locator('.pp-guitar .dot-text').allTextContents()).some(text => text.includes('*')), 'no tonic asterisks');
  await page.getByText('Edit position', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Keyboard note' }).selectOption('1:1');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('practice-pads-fingerings-v1')));
  assert(saved.mappings[0].context.family === 'natural-minor', 'own natural-minor storage context');
  await page.getByRole('button', { name: 'Full neck', exact: true }).click();
  assert(await page.locator('.pp-guitar .dot-circle[data-position=true]').count() === 1, 'local mapping highlighted');
  const naturalFullEnd = await highest();
  await family.selectOption('jazz-melodic-minor');
  assert(await page.locator('.pp-guitar .dot-circle[data-position=true]').count() > 10, 'natural mapping does not leak to melodic minor');
  await family.selectOption('natural-minor');
  assert(await page.locator('.pp-guitar .dot-circle[data-position=true]').count() === 1, 'natural mapping restored');
  assert(await highest() === naturalFullEnd, 'short custom mapping keeps the whole overview');
  await page.getByRole('button', { name: 'Undo last note', exact: true }).click();
  await page.getByRole('combobox', { name: 'Keyboard note' }).selectOption('1:0');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  assert(await highest() === naturalFullEnd, 'open-only mapping does not shrink the overview');
  assert(await page.locator('.pp-guitar svg').evaluate(svg => !/NaN|Infinity/.test(svg.outerHTML)), 'open-only frame has finite coordinates');
  await page.getByRole('combobox', { name: 'Keyboard note' }).selectOption('1:24');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  assert(await highest() === 24, 'fret 24 appears only when the mapping uses it');
  const sizes = [];
  for (const width of [1280,1024,390]) {
    await page.setViewportSize({width,height:900});
    await openCircle();
    const size = await page.evaluate(() => [innerWidth,document.documentElement.scrollWidth]);
    assert(size[0] === size[1], `circle/full-neck document overflow ${size}`); sizes.push(size);
    await page.keyboard.press('Escape');
  }
  assert((await page.locator('.pp-player [role=status]').innerText()) === 'Stopped', 'no accidental playback on selection');
  return {naturalMinorModes:7,minorShapes:5,coloredTonic:true,keyboardWedges:24,ownParentAndStorage:true,fullNeckAndHighlight:true,fadedContext:true,stableOverview:true,openOnly:true,rememberedView:true,sizes};
}
