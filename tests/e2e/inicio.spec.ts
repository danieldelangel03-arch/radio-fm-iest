import { expect, test } from "@playwright/test";

test("presenta las tres superficies principales", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Radio Campus" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pantalla pública/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Votación/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Administración/ })).toBeVisible();
});

test("pantalla y votación conservan un estado útil sin base configurada", async ({ page }) => {
  await page.route("**/api/state", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
  });
  await page.goto("/pantalla");
  await expect(page.getByText("Preparando la señal")).toBeVisible();
  await expect(page.getByText("Esperando una canción")).toBeVisible();

  await page.goto("/votar");
  await expect(page.getByRole("heading", { name: "Elige lo que sigue" })).toBeVisible();
  await expect(page.getByText("Esperando la próxima ronda")).toBeVisible();
});

test("el panel presenta acceso protegido", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
});

test("la pantalla inicia el video silenciado sin interacción", async ({ page }) => {
  await page.route("**/api/state", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        version: 1,
        status: "playing",
        currentSong: {
          id: "song-1",
          title: "Canción de prueba",
          artist: "Artista",
          youtubeId: "dQw4w9WgXcQ",
        },
        currentAnnouncement: null,
        round: null,
      }),
    });
  });

  await page.goto("/pantalla");
  const player = page.getByTitle("Reproductor de Canción de prueba");
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute("src", /autoplay=1/);
  await expect(player).toHaveAttribute("src", /mute=1/);
  await expect(page.getByRole("button", { name: "Activar sonido" })).toBeVisible();
});
