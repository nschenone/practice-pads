async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const board = page.locator('.pp-visual');
  await board.getByText(/Scale-note map, not a CAGED fingering/).waitFor();
  const fallback = (await board.locator('svg text').allTextContents()).map(text => text.replace(/\*$/, ''));
  assert(fallback.includes('F'), 'Melodic-minor map must contain F');
  await page.getByText('Edit local mapping', { exact: true }).click();
  await page.getByLabel('Source', { exact: true }).fill('browser smoke');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  await page.getByLabel('String (1 high E–6 low E)', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  await page.getByRole('button', { name: 'Save this position', exact: true }).click();
  await page.getByText('Saved in this browser.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Exercise notation and tab', exact: true }).click();
  await board.getByText('e/5 · b/4', { exact: true }).waitFor();
  const exerciseSVG = await board.locator('svg').count();
  assert(exerciseSVG === 1, 'One actual VexFlow staff/tab SVG expected');
  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  await page.locator('.pp-modes button').nth(3).click();
  assert(await board.getByText(/Source: browser smoke/).count() === 1, 'Mode switch must retain mapping');
  await page.getByRole('button', { name: 'A shape (unreviewed)', exact: true }).click();
  await board.getByText(/Scale-note map, not a CAGED fingering/).waitFor();
  await page.getByRole('button', { name: 'C shape (unreviewed)', exact: true }).click();
  await board.getByText(/Source: browser smoke/).waitFor();
  await page.reload();
  await board.getByText(/Source: browser smoke/).waitFor();
  await page.getByText('Import / export saved mappings', { exact: true }).click();
  await page.getByRole('button', { name: 'Export saved mappings', exact: true }).click();
  const json = page.getByRole('textbox', { name: 'Mapping JSON', exact: true });
  const backup = await json.inputValue();
  const before = await page.evaluate(() => localStorage.getItem('practice-pads-fingerings-v1'));
  await json.fill('{broken');
  await page.getByRole('button', { name: 'Import mappings', exact: true }).click();
  assert(before === await page.evaluate(() => localStorage.getItem('practice-pads-fingerings-v1')), 'Invalid import must preserve saved data');
  assert((await page.getByRole('alert').allTextContents()).some(text => text.trim()), 'Invalid import must show an error');
  await json.fill(backup);
  await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption('harmonic-minor');
  await board.getByText(/Scale-note map, not a CAGED fingering/).waitFor();
  const harmonic = (await board.locator('svg text').allTextContents()).map(text => text.replace(/\*$/, ''));
  assert(harmonic.includes('F') && harmonic.includes('Bb'), 'Harmonic-minor map must contain F and Bb');
  await page.getByRole('combobox', { name: 'Family', exact: true }).selectOption('jazz-melodic-minor');
  await board.getByText(/Source: browser smoke/).waitFor();
  return { melodicContainsF: true, exactExerciseOrder: true, modeAndPositionIsolation: true, persistedReload: true, invalidImportPreservedData: true, harmonicContainsFAndBb: true, backupReadyForResetAndImport: true };
  // Test native reset confirmation separately with playwright-cli dialog-accept,
  // then import the backup retained in the Mapping JSON textarea.
}
