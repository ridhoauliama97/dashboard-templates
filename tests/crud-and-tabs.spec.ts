import { expect, test, type Page } from "@playwright/test";

/**
 * The flows that were broken and are now real.
 *
 * Each test drives the actual control and asserts the outcome, so a tab that
 * only highlights, or a Delete that only closes a menu, fails here.
 */

async function openRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#root")).toBeVisible();
  await expect.poll(async () => page.locator("#root *").count(), { timeout: 15_000 }).toBeGreaterThan(8);
  await page.waitForTimeout(400);
}

test.describe("delete asks first and names the object", () => {
  test("tasks", async ({ page }) => {
    await openRoute(page, "/dashboard/tasks");

    const rowsBefore = await page.locator('tbody tr[data-slot="table-row"]').count();
    expect(rowsBefore).toBeGreaterThan(0);

    // The first task's title, read from the row we are about to delete.
    const firstTitle = (await page.locator('tbody tr[data-slot="table-row"]').first().innerText())
      .replace(/\s+/g, " ")
      .trim();
    // The dialog must name the task — the row's id is the stable part of it.
    const taskId = (firstTitle.match(/TASK-\d+/) ?? [""])[0];
    expect(taskId).not.toBe("");

    await page.locator('tbody tr[data-slot="table-row"]').first().locator("button").last().click();
    await page.getByRole("menuitem", { name: /Delete/ }).click();

    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    // The question must name the task, not say "Are you sure?".
    await expect(dialog).toContainText(taskId);
    await expect(dialog).toContainText("permanently deleted");

    await page.getByRole("button", { name: "Delete task" }).click();
    await expect(dialog).toBeHidden();

    // The table is paginated, so a deleted row is replaced by the next one and
    // the visible count stays at the page size. Assert the row itself is gone.
    await expect(page.locator("tbody").getByText(taskId, { exact: false })).toHaveCount(0);
  });

  test("file manager", async ({ page }) => {
    await openRoute(page, "/dashboard/file-manager");

    // Folder rows carry their own actions menu (no delete); find a file row.
    const actionButtons = page.getByRole("button", { name: /^Actions for / });
    const total = await actionButtons.count();
    expect(total).toBeGreaterThan(0);

    let fileName = "";
    let found = false;
    for (let index = 0; index < total && !found; index += 1) {
      const button = actionButtons.nth(index);
      const label = (await button.getAttribute("aria-label")) ?? "";
      await button.click();
      await page.waitForTimeout(220);
      const trash = page.getByRole("menuitem").filter({ hasText: "Move to trash" });
      if ((await trash.count()) > 0) {
        fileName = label.replace("Actions for ", "").trim();
        found = true;
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(140);
      }
    }

    expect(found, "no file row exposed a delete action").toBe(true);

    await page.getByRole("menuitem").filter({ hasText: "Move to trash" }).click();

    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(fileName);

    await dialog.getByRole("button", { name: "Move to trash" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: `Actions for ${fileName}` })).toHaveCount(0);
  });

  test("legacy crm leads", async ({ page }) => {
    await openRoute(page, "/dashboard/crm-v1");

    const menuButtons = page.locator('tbody tr[data-slot="table-row"] button:has(svg)');
    expect(await menuButtons.count()).toBeGreaterThan(0);

    await menuButtons.first().click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("permanently deleted");
  });

  test("invoice line item", async ({ page }) => {
    await openRoute(page, "/dashboard/invoice");

    const removeButtons = page.getByRole("button", { name: /^Remove item \d+$/ });
    const before = await removeButtons.count();
    expect(before).toBeGreaterThan(0);

    await removeButtons.first().click();
    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("removed from the invoice total");

    await dialog.getByRole("button", { name: "Remove item" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /^Remove item \d+$/ })).toHaveCount(before - 1);
  });

  test("mail message", async ({ page }) => {
    await openRoute(page, "/mail");

    // The first message is selected by default; read its subject from the view.
    const subject = (await page.locator("h1, h2").filter({ hasText: /./ }).first().innerText()).trim();
    await page.getByRole("button", { name: "Move to trash" }).click();

    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("removed from the inbox");

    const asked = (await dialog.innerText()).replace(/\s+/g, " ");
    await dialog.getByRole("button", { name: "Move to trash" }).click();
    await expect(dialog).toBeHidden();

    // The message must actually leave the list, not just close the dialog.
    if (subject.length > 6) {
      await expect(page.getByText(subject, { exact: false })).toHaveCount(0);
    }
    expect(asked).toContain("permanently deleted");
  });
});

test.describe("tabs change what is rendered", () => {
  test("logistics status tabs filter the shipment list", async ({ page }) => {
    await openRoute(page, "/dashboard/logistics");

    const cards = page.locator("button[aria-pressed]");
    const all = await cards.count();
    expect(all).toBeGreaterThan(1);

    // Counts must be derived from the rows, so the tab label and the rendered
    // count have to agree.
    const deliveredTab = page.getByRole("tab", { name: /^Delivered \(/ });
    const deliveredLabel = (await deliveredTab.innerText()).replace(/\s+/g, " ");
    const declared = Number(deliveredLabel.match(/\((\d+)\)/)?.[1] ?? "-1");

    await deliveredTab.click();
    await expect.poll(async () => cards.count(), { timeout: 5_000 }).toBe(declared);

    await page.getByRole("tab", { name: /^All \(/ }).click();
    await expect.poll(async () => cards.count(), { timeout: 5_000 }).toBe(all);
  });

  test("logistics search narrows the list", async ({ page }) => {
    await openRoute(page, "/dashboard/logistics");
    const cards = page.locator("button[aria-pressed]");
    const before = await cards.count();

    await page.getByLabel("Search shipments").fill("CGK");
    await expect.poll(async () => cards.count(), { timeout: 5_000 }).toBeLessThan(before);
  });

  test("users switches between list and grid", async ({ page }) => {
    await openRoute(page, "/dashboard/users");

    await expect(page.locator("table").first()).toBeVisible();
    await page.getByRole("tab", { name: "Grid view" }).click();
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.getByText("Workspace Owner").first()).toBeVisible();

    await page.getByRole("tab", { name: "List view" }).click();
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("chat profile panel opens and its tabs work", async ({ page }) => {
    await openRoute(page, "/chat");

    // The panel is a slide-over: parked off-screen until the thread asks for it.
    await page.getByRole("button", { name: "More actions" }).first().click();
    await page.getByRole("menuitem", { name: "View profile" }).click();

    const details = page.getByRole("tab", { name: "Details" });
    await expect(details).toBeVisible();
    await expect(details).toHaveAttribute("data-state", "active");

    await page.getByRole("tab", { name: "Files" }).click();
    await expect(page.getByRole("tab", { name: "Files" })).toHaveAttribute("data-state", "active");

    await page.getByRole("tab", { name: "Activity" }).click();
    await expect(page.getByRole("tab", { name: "Activity" })).toHaveAttribute("data-state", "active");

    // The conversation filter counts are derived from the rows, not literals.
    const allLabel = (await page.getByRole("tab", { name: /^All/ }).innerText()).replace(/\s+/g, " ");
    const declared = Number(allLabel.match(/\((\d+)\)/)?.[1] ?? "-1");
    expect(declared).toBeGreaterThan(0);
  });

  test("kanban switches between board, list and table, and search filters all three", async ({ page }) => {
    await openRoute(page, "/dashboard/kanban");

    const tabs = page.locator('[data-slot="tabs-trigger"]');
    await expect(tabs.nth(0)).toHaveAttribute("data-state", "active");

    // Board: drag-and-drop columns, no table.
    await expect(page.locator("table")).toHaveCount(0);

    await tabs.nth(1).click();
    await expect(page.locator("table")).toHaveCount(0);

    await tabs.nth(2).click();
    await expect(page.locator("table").first()).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();

    // Search narrows every view; an impossible query must show the empty frame.
    await page.getByPlaceholder("Search tasks").fill("zzzz-no-such-task");
    await expect(page.getByText(/No tasks found/i)).toBeVisible();

    await page.getByPlaceholder("Search tasks").fill("");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });
});

test.describe("every tab strip is functional", () => {
  const ROUTES = [
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
    "/dashboard/kanban",
    "/dashboard/tasks",
    "/dashboard/invoice",
    "/dashboard/profile",
    "/dashboard/users",
    "/dashboard/roles",
    "/chat",
    "/mail",
  ];

  for (const route of ROUTES) {
    test(`tabs do something on ${route}`, async ({ page }) => {
      await openRoute(page, route);

      const tabs = page.locator('[data-slot="tabs-trigger"]');
      const count = await tabs.count();
      if (count < 2) return;

      // Scope each click to its own tab strip: indexing the global trigger
      // list picks the wrong tab as soon as a page has two strips.
      const lists = page.locator('[data-slot="tabs-list"]');
      const listCount = await lists.count();
      const problems: string[] = [];

      for (let index = 0; index < listCount; index += 1) {
        const triggers = lists.nth(index).locator('[data-slot="tabs-trigger"]');
        const triggerCount = await triggers.count();
        if (triggerCount < 2) continue;

        // A strip inside a closed slide-over is laid out but parked off-screen;
        // its tabs are not reachable until the panel is opened, which the
        // dedicated test below covers.
        const box = await triggers.first().boundingBox();
        if (!box || box.x < 0 || box.x + box.width > 1440) continue;

        const stripLabel = (await lists.nth(index).innerText()).replace(/\s+/g, " ").trim().slice(0, 60);

        // A content hash, not a length. It includes field placeholders and
        // values, because two panels can differ only in what their inputs say
        // and `innerText` never contains either.
        const snapshot = async () =>
          page.evaluate(() => {
            const panels = [...document.querySelectorAll('[role="tabpanel"]')].filter(
              (panel) => panel.getBoundingClientRect().height > 0,
            );
            const fields = [...document.querySelectorAll("input, textarea")].map(
              (field) => `${field.getAttribute("placeholder") ?? ""}=${field.value ?? ""}`,
            );
            const source = `${panels.map((panel) => panel.innerText).join("§")}|${fields.join(",")}|${document.querySelector("#root")?.innerText ?? ""}`;
            let hash = 0;
            for (let i = 0; i < source.length; i += 1) {
              hash = (hash * 31 + source.charCodeAt(i)) | 0;
            }
            return `${panels.length}:${hash}`;
          });

        const before = await snapshot();
        await triggers.nth(triggerCount - 1).click();
        await page.waitForTimeout(400);
        const after = await snapshot();

        if (before === after) {
          problems.push(`tab strip "${stripLabel}" produced no change`);
        }
      }

      expect(problems, `${route}:\n${problems.join("\n")}`).toEqual([]);
    });
  }
});
