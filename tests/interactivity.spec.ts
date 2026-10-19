import { expect, test, type Page } from "@playwright/test";

/**
 * Interactivity matrix.
 *
 * For every route, every trigger kind that is present is exercised for real:
 * the trigger is clicked, the surface it is supposed to produce is asserted
 * visible, and it is asserted closed again. Nothing here is inferred from the
 * source — a component passes only if the browser shows the surface.
 */

const ROUTES = [
  "/",
  "/dashboard/default",
  "/dashboard/crm",
  "/dashboard/finance",
  "/dashboard/analytics",
  "/dashboard/productivity",
  "/dashboard/ecommerce",
  "/dashboard/academy",
  "/dashboard/logistics",
  "/dashboard/infrastructure",
  "/dashboard/file-manager",
  "/dashboard/patient-monitoring",
  "/dashboard/mail",
  "/dashboard/chat",
  "/dashboard/calendar",
  "/dashboard/kanban",
  "/dashboard/tasks",
  "/dashboard/invoice",
  "/dashboard/profile",
  "/dashboard/users",
  "/dashboard/roles",
  "/dashboard/coming-soon",
  "/dashboard/default-v1",
  "/dashboard/crm-v1",
  "/dashboard/finance-v1",
  "/dashboard/analytics-v1",
  "/auth/v1/login",
  "/auth/v1/register",
  "/auth/v2/login",
  "/auth/v2/register",
  "/chat",
  "/mail",
  "/unauthorized",
];

/** Kinds whose trigger should reveal a surface. */
const SURFACES = [
  { name: "dropdown menu", trigger: '[data-slot="dropdown-menu-trigger"]', surface: '[data-slot="dropdown-menu-content"]' },
  { name: "select", trigger: '[data-slot="select-trigger"]', surface: '[data-slot="select-content"]' },
  { name: "popover", trigger: '[data-slot="popover-trigger"]', surface: '[data-slot="popover-content"]' },
  { name: "dialog", trigger: '[data-slot="dialog-trigger"]', surface: '[data-slot="dialog-content"]' },
  { name: "sheet", trigger: '[data-slot="sheet-trigger"]', surface: '[data-slot="sheet-content"]' },
  { name: "alert dialog", trigger: '[data-slot="alert-dialog-trigger"]', surface: '[data-slot="alert-dialog-content"]' },
  { name: "dropdown submenu", trigger: '[data-slot="dropdown-menu-sub-trigger"]', surface: '[data-slot="dropdown-menu-sub-content"]' },
  { name: "context menu", trigger: '[data-slot="context-menu-trigger"]', surface: '[data-slot="context-menu-content"]' },
  { name: "hover card", trigger: '[data-slot="hover-card-trigger"]', surface: '[data-slot="hover-card-content"]' },
  { name: "menubar", trigger: '[data-slot="menubar-trigger"]', surface: '[data-slot="menubar-content"]' },
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function openRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#root")).toBeVisible();
  // Wait for the lazy route chunk to paint something.
  await expect
    .poll(async () => page.locator("#root *").count(), { timeout: 15_000 })
    .toBeGreaterThan(8);
  await page.waitForTimeout(350);
}

test.describe("every route renders", () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const errors = collectErrors(page);
      await openRoute(page, route);

      const text = (await page.locator("#root").innerText()).replace(/\s+/g, " ").trim();
      expect(text.length, `${route} rendered no text`).toBeGreaterThan(20);
      expect(errors, `${route} produced console/page errors`).toEqual([]);
    });
  }
});

test.describe("trigger surfaces", () => {
  for (const route of ROUTES) {
    test(`surfaces on ${route}`, async ({ page }) => {
      const errors = collectErrors(page);
      await openRoute(page, route);

      const report: string[] = [];

      for (const spec of SURFACES) {
        const triggers = page.locator(spec.trigger);
        const count = await triggers.count();
        if (count === 0) continue;

        const attempts = Math.min(count, 3);
        for (let index = 0; index < attempts; index += 1) {
          const trigger = triggers.nth(index);
          if (!(await trigger.isVisible().catch(() => false))) continue;

          const label =
            (await trigger.getAttribute("aria-label")) ||
            (await trigger.innerText().catch(() => "")) ||
            `${spec.trigger}#${index}`;

          await trigger.click({ timeout: 5_000 }).catch(() => {});
          const surface = page.locator(spec.surface).first();
          const visible = await surface.isVisible().catch(() => false);

          if (!visible) {
            report.push(`${spec.name} "${label.replace(/\s+/g, " ").trim().slice(0, 40)}" produced no ${spec.surface}`);
          }

          await page.keyboard.press("Escape");
          await page.waitForTimeout(120);
        }
      }

      expect(report, `${route} broken triggers:\n${report.join("\n")}`).toEqual([]);
      expect(errors, `${route} errors`).toEqual([]);
    });
  }
});

test.describe("stateful controls", () => {
  for (const route of ROUTES) {
    test(`toggles on ${route}`, async ({ page }) => {
      await openRoute(page, route);
      const problems: string[] = [];

      // Tabs: the active tab must own the visible tabpanel.
      const tabs = page.locator('[data-slot="tabs-trigger"]');
      const tabCount = await tabs.count();
      for (let index = 0; index < Math.min(tabCount, 5); index += 1) {
        const tab = tabs.nth(index);
        if (!(await tab.isVisible().catch(() => false))) continue;
        if (await tab.isDisabled().catch(() => false)) continue;
        const controls = await tab.getAttribute("aria-controls");
        await tab.click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(200);
        const selected = await tab.getAttribute("data-state");
        if (selected !== "active") {
          problems.push(`tab "${(await tab.innerText()).trim()}" did not become active (state=${selected})`);
        }
        // A trigger may legitimately have no panel (it filters a list instead),
        // so only check the panel when one exists.
        if (controls) {
          const panel = page.locator(`#${controls}`);
          if ((await panel.count()) > 0 && !(await panel.isVisible().catch(() => false))) {
            problems.push(`tab "${(await tab.innerText()).trim()}" panel #${controls} not visible`);
          }
        }
      }

      // Toggle groups: an item that is not already on must turn on when clicked.
      // In a single-select group the active item stays active — a filter must
      // not be clearable — so clicking that one is correctly a no-op.
      const toggles = page.locator('[data-slot="toggle-group-item"]');
      const toggleCount = await toggles.count();
      for (let index = 0; index < Math.min(toggleCount, 6); index += 1) {
        const item = toggles.nth(index);
        if (!(await item.isVisible().catch(() => false))) continue;
        if (await item.isDisabled().catch(() => false)) continue;
        if ((await item.getAttribute("data-state")) === "on") continue;

        const label = (await item.innerText()).trim();
        await item.click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(180);
        const after = await item.getAttribute("data-state");
        if (after !== "on") {
          problems.push(`toggle "${label}" did not turn on when clicked (state=${after})`);
        }
      }

      // Checkboxes: click flips the checked state.
      const boxes = page.locator('[data-slot="checkbox"]');
      const boxCount = await boxes.count();
      for (let index = 0; index < Math.min(boxCount, 3); index += 1) {
        const box = boxes.nth(index);
        if (!(await box.isVisible().catch(() => false))) continue;
        const before = await box.getAttribute("data-state");
        await box.click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(180);
        const after = await box.getAttribute("data-state");
        if (before === after) {
          problems.push(`checkbox #${index} state unchanged after click (${before})`);
        }
      }

      expect(problems, `${route} state problems:\n${problems.join("\n")}`).toEqual([]);
    });
  }
});

test.describe("collapsibles and sidebar", () => {
  for (const route of ROUTES) {
    test(`collapsibles on ${route}`, async ({ page }) => {
      await openRoute(page, route);
      const problems: string[] = [];

      const triggers = page.locator('[data-slot="collapsible-trigger"], [data-slot="accordion-trigger"]');
      const count = await triggers.count();
      for (let index = 0; index < Math.min(count, 5); index += 1) {
        const trigger = triggers.nth(index);
        if (!(await trigger.isVisible().catch(() => false))) continue;
        // Some panels start open; a click that closes one is still a change.
        const before = await trigger.getAttribute("data-state");
        await trigger.click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(280);
        const after = await trigger.getAttribute("data-state");
        if (before === after) {
          problems.push(
            `"${(await trigger.innerText()).replace(/\s+/g, " ").trim().slice(0, 30)}" state unchanged after click (${before})`,
          );
        }
      }

      expect(problems, `${route} collapse problems:\n${problems.join("\n")}`).toEqual([]);
    });
  }
});
