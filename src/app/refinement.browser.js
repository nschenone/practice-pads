// Run with playwright-cli run-code --filename against a disposable production preview.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const key = 'practice-pads-fingerings-v1';
  await page.evaluate(key => localStorage.removeItem(key), key);
  await page.reload();
  assert(await page.getByRole('button', { name: 'Self-guided', exact: true }).count() === 0, 'removed workflow');
  assert(await page.getByText('Note positions and roles', { exact: true }).count() === 0, 'removed visible positions block');
  assert(await page.locator('.pp-notes li').count() === 7, 'seven note cells');
  const coordinates = () => page.locator('.pp-guitar .dot').evaluateAll(dots => dots.map(dot => dot.getAttribute('class').match(/dot-id-s\d+:f\d+/)?.[0]).sort().join('|'));
  const collections = {};
  for (const family of ['jazz-melodic-minor', 'harmonic-minor']) {
    await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption(family);
    const shapes = [];
    for (const shape of ['C', 'A', 'G', 'E', 'D']) {
      await page.getByRole('button', { name: `${shape} shape (unreviewed)`, exact: true }).click();
      const original = await coordinates();
      assert(original && original.split('|').length >= 16, `${family} ${shape} populated`);
      shapes.push(original);
      await page.locator('.pp-modes button').nth(0).click();
      assert(await coordinates() === original, `${family} ${shape} physical invariance`);
      await page.locator('.pp-modes button').nth(2).click();
      assert(await coordinates() === original, `${family} ${shape} derivative retention`);
    }
    assert(new Set(shapes).size === 5, `${family} has five distinct shapes`);
    collections[family] = shapes;
  }
  assert(JSON.stringify(collections['jazz-melodic-minor']) !== JSON.stringify(collections['harmonic-minor']), 'minor families differ');
  await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption('jazz-melodic-minor');
  await page.getByRole('button', { name: 'C shape (unreviewed)', exact: true }).click();
  await page.getByText('Edit position', { exact: true }).click();
  const tap = async fret => {
    const dot = page.locator(`.pp-editor-neck .dot-string-1.dot-fret-${fret}`);
    await dot.scrollIntoViewIfNeeded();
    const box = await dot.boundingBox();
    const expected = await page.locator('.pp-editor-sequence li').count() + 1;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForFunction(count => document.querySelectorAll('.pp-editor-sequence li').length === count, expected);
  };
  await tap(1); await tap(1); await tap(3);
  const items = page.locator('.pp-editor-sequence li');
  assert(await items.count() === 3, 'repeated click events');
  await page.getByRole('button', { name: 'Move note 3 up', exact: true }).click();
  assert((await items.nth(1).innerText()).includes('fret 3'), 'reorder');
  await page.getByRole('button', { name: 'Remove note 3', exact: true }).click();
  await page.getByRole('combobox', { name: 'Keyboard note' }).selectOption('2:0');
  await page.getByRole('button', { name: 'Add note', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  const saved = await page.evaluate(key => localStorage.getItem(key), key);
  assert(JSON.parse(saved).mappings[0].fingering.events.map(event => event.fret).join() === '1,3,0', 'saved exact order');
  await page.getByRole('button', { name: 'Exercise notation and tab', exact: true }).click();
  assert((await page.locator('.pp-visual .pp-visually-hidden').innerText()).includes('string 1 fret 1 · string 1 fret 3 · string 2 fret 0'), 'exercise exact tab order');
  assert(await page.locator('.pp-visual svg .vf-tabnote').count() === 3, 'actual VexFlow tab');
  await page.getByText('Edit position', { exact: true }).click();
  await page.getByText('Import / export saved mappings', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Mapping JSON', exact: true }).fill('{bad');
  await page.getByRole('button', { name: 'Import mappings', exact: true }).click();
  assert(await page.getByRole('alert').isVisible(), 'invalid import visible with editor closed');
  assert(await page.evaluate(key => localStorage.getItem(key), key) === saved, 'bad import preserves data');
  await page.getByRole('textbox', { name: 'Mapping JSON', exact: true }).fill(saved);
  await page.getByRole('button', { name: 'Import mappings', exact: true }).click();
  assert((await page.locator('.pp-mapping [role=status]').innerText()).includes('Imported valid'), 'valid import');
  await page.getByText('Edit position', { exact: true }).click();
  await page.getByRole('button', { name: 'Undo last note', exact: true }).click();
  await page.getByRole('button', { name: 'Import mappings', exact: true }).click();
  assert((await page.getByRole('alert').innerText()).includes('Save or discard matching drafts'), 'dirty import protection');
  assert(await page.evaluate(key => localStorage.getItem(key), key) === saved, 'conflict preserves storage');
  await page.getByRole('button', { name: 'A shape (unreviewed)', exact: true }).click();
  assert(await items.count() === 0, 'isolated shape');
  await page.getByRole('button', { name: 'C shape (unreviewed)', exact: true }).click();
  assert(await items.count() === 2, 'draft retained');
  await page.getByRole('button', { name: 'Discard draft / reload saved', exact: true }).click();
  assert(await items.count() === 3, 'saved restoration');
  await page.reload();
  await page.getByText('Edit position', { exact: true }).click();
  assert(await items.count() === 3, 'reload persistence');
  await page.getByRole('slider', { name: 'Volume', exact: true }).focus();
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('.pp-player [role=status]').getByText('Playing', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.locator('.pp-player [role=status]').getByText('Stopped', { exact: true }).waitFor();
  const layouts = [];
  for (const width of [1280, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const size = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
    assert(size[0] === size[1], `document overflow ${size}`);
    layouts.push(size);
  }
  return { realMinorShapes: 10, modeInvariant: true, touchEditorMouseKeyboard: true, orderedTab: true, importAndDraftProtection: true, savedReload: true, mutedPlayback: true, layouts };
}
