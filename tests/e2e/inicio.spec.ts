import { expect, test } from "@playwright/test";

test("presenta las tres superficies principales", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Radio Campus" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pantalla pública/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Votación/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Administración/ })).toBeVisible();
});
