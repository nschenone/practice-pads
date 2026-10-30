async page => {
  const exercise = page.locator('#mutable-exercise');
  const tab = exercise.locator('svg .vf-tabnote');
  const read = async () => ({ text: await tab.textContent(), svg: await tab.innerHTML(), description: await exercise.locator('.pp-visually-hidden').textContent() });
  const before = await read();
  await page.getByRole('button', {name:'Move E4 on same fingering'}).click();
  const after = await read();
  if (!before.text.includes('0') || !after.text.includes('5') || !after.description.includes('string 2 fret 5') || before.svg === after.svg) throw new Error(JSON.stringify({before,after}));
  await page.getByRole('button', {name:'Switch derivative mode'}).click();
  const descriptions = await page.locator('.pp-visually-hidden').allTextContents();
  if (!descriptions.some(text => text.includes('f/4 · g/4 · a/4 · b/4 · c#/5 · d/5 · e/5')) || !descriptions.some(text => text.includes('string 2, fret 2: C#'))) throw new Error('derivative regression');
  if (await page.getByText('Note positions and roles').count()) throw new Error('visible positions block remains');
  if (await page.locator('[aria-hidden="true"] svg').count() < 5) throw new Error('real SVGs missing');
  const board = page.locator('.pp-fretboard-scroll').first();
  const firstWidth = await board.locator('svg').getAttribute('viewBox');
  await page.setViewportSize({width: 600, height: 900});
  await page.waitForTimeout(200);
  const nextWidth = await board.locator('svg').getAttribute('viewBox');
  if (firstWidth === nextWidth) throw new Error(`board did not resize: ${firstWidth}`);
  return {before, after, firstWidth, nextWidth, derivative: 'F derivative spelling and positions present'};
}
