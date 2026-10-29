async page => {
  const tab = page.locator('#mutable-exercise svg .vf-tabnote');
  const read = async () => ({ text: await tab.textContent(), svg: await tab.innerHTML(), description: await page.locator('#mutable-exercise').innerText() });
  const before = await read();
  await page.getByRole('button', {name:'Move E4 on same fingering'}).click();
  const after = await read();
  if (!before.text.includes('0') || !after.text.includes('5') || !after.description.includes('string 2 fret 5') || before.svg === after.svg) throw new Error(JSON.stringify({before,after}));
  await page.getByRole('button', {name:'Switch derivative mode'}).click();
  const text = await page.locator('main').innerText();
  if (!text.includes('f/4 · g/4 · a/4 · b/4 · c#/5 · d/5 · e/5') || !text.includes('string 2, fret 2: C#')) throw new Error('derivative regression');
  return {before, after, derivative: 'F derivative spelling and positions present'};
}
