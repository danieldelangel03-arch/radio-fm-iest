import { expect, test } from "@playwright/test";

test("presenta las tres superficies principales", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Radio Campus" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pantalla pública/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Votación/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Administración/ })).toBeVisible();
});

test("pantalla y votación conservan un estado útil sin base configurada", async ({ page }) => {
  await page.goto("/pantalla");
  await expect(page.getByText("Preparando la señal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar audio" })).toBeVisible();

  await page.goto("/votar");
  await expect(page.getByRole("heading", { name: "Elige lo que sigue" })).toBeVisible();
  await expect(page.getByText("Esperando la próxima ronda")).toBeVisible();
});

test("el panel presenta acceso protegido", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
});
