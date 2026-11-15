import { expect, test } from '@playwright/test';

const LAB = '10-local-model';
const FLEET = 'https://fleet.flisk.si';

test.describe('header', () => {
  test('Learn and Exam go to learn.flisk.si; Practice is this site', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header');
    await expect(nav.getByRole('link', { name: 'Learn', exact: true })).toHaveAttribute('href', 'https://learn.flisk.si/learn');
    await expect(nav.getByRole('link', { name: 'Practice', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Exam', exact: true })).toHaveAttribute('href', 'https://learn.flisk.si/exam');
  });
});

test.describe('lab pages', () => {
  test('every lab card opens a lab page with steps', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = [...new Set(await page.locator('a.lab-card').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))];
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(await res.text(), href).toContain('data-pod-run=');
    }
  });

  test('a lab page loads with no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/labs/${LAB}/`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run in a pod' }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// Fleet is mocked: these check what the page does with its answers, not Fleet itself.
test.describe('Run in a pod', () => {
  test('without a fleet key it opens the panel and says to get one', async ({ page }) => {
    await page.goto(`/labs/${LAB}/`);
    await page.getByRole('button', { name: 'Run in a pod' }).first().click();
    await expect(page.locator('[data-pod-panel]')).toHaveAttribute('open', '');
    await expect(page.locator('.guide-step').first().locator('[data-pod-out]')).toContainText('Get a fleet key');
  });

  test('a fleet key in the link fills the field and leaves the URL', async ({ page }) => {
    await page.goto(`/labs/${LAB}/#fleet-key=fleet_test`);
    await expect(page.locator('[data-pod-fleet-key]')).toHaveValue('fleet_test');
    await expect(page).toHaveURL(new RegExp(`/labs/${LAB}/$`));
  });

  test('a step that exits 0 passes, counts, and stop deletes the pod', async ({ page }) => {
    const calls = [];
    await page.route(`${FLEET}/v1/pods**`, async (route) => {
      const req = route.request();
      calls.push(`${req.method()} ${new URL(req.url()).pathname}`);
      expect(req.headers().authorization).toBe('Bearer fleet_test');
      if (req.method() === 'POST' && req.url().endsWith('/v1/pods')) return route.fulfill({ json: { id: 'pod_test' } });
      if (req.method() === 'POST') return route.fulfill({ json: { exitCode: 0, stdout: 'llama3.2 ok', stderr: '' } });
      return route.fulfill({ json: { ok: true } });
    });
    await page.goto(`/labs/${LAB}/#fleet-key=fleet_test`);
    const step = page.locator('.guide-step').first();
    await step.getByRole('button', { name: 'Run in a pod' }).click();
    await expect(step.locator('[data-pod-out]')).toContainText('exit 0 · step passed');
    await expect(step).toHaveAttribute('data-passed', '1');
    await expect(page.locator('[data-pod-progress]')).toContainText(/^1 of \d+ steps passed/);
    await page.getByRole('button', { name: 'Stop pod' }).click();
    await expect(page.locator('[data-pod-status]')).toHaveText('Pod stopped.');
    expect(calls[0]).toBe('POST /v1/pods');
    expect(calls.at(-1)).toBe('DELETE /v1/pods/pod_test');
  });

  test('a step that fails shows the exit code and the expected result', async ({ page }) => {
    await page.route(`${FLEET}/v1/pods**`, (route) => route.fulfill({ json: route.request().url().endsWith('/v1/pods') ? { id: 'pod_test' } : { exitCode: 127, stdout: '', stderr: 'ollama: not found' } }));
    await page.goto(`/labs/${LAB}/#fleet-key=fleet_test`);
    const step = page.locator('.guide-step').first();
    await step.getByRole('button', { name: 'Run in a pod' }).click();
    await expect(step.locator('[data-pod-out]')).toContainText('exit 127 · step failed');
    await expect(step).not.toHaveAttribute('data-passed', '1');
  });
});
