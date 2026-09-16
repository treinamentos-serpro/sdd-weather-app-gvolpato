import { expect, type Page, test } from '@playwright/test';

test('busca uma cidade, exibe a previsão e converte a temperatura', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 1,
            name: 'Sao Paulo',
            country: 'Brasil',
            admin1: 'Sao Paulo',
            latitude: -23.55,
            longitude: -46.63,
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    });
  });

  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          time: '2026-09-16T14:00',
          temperature_2m: 24,
          apparent_temperature: 25,
          weather_code: 0,
          is_day: 1,
        },
        timezone: 'America/Sao_Paulo',
        daily: {
          time: ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_max: [26, 27, 25, 24, 22],
          temperature_2m_min: [17, 18, 16, 15, 14],
          precipitation_probability: [0, 10, 20, 30, 80],
        },
      }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('Sao Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('option', { name: /Sao Paulo, Brasil/ }).click();

  await expect(page.getByRole('heading', { name: 'Sao Paulo' })).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();

  await page.getByRole('button', { name: 'Fahrenheit' }).click();

  await expect(page.getByText('75°F', { exact: true })).toBeVisible();
});

test('exibe estado vazio quando o geocoding não retorna cidades', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText('Nenhuma cidade encontrada', { exact: true })).toBeVisible();
});

test('mantém a busca desabilitada para termo vazio ou só com espaços', async ({ page }) => {
  await page.goto('/');
  const searchInput = page.getByLabel('Nome da cidade');
  const searchButton = page.getByRole('button', { name: 'Buscar' });

  await expect(searchButton).toBeDisabled();
  await searchInput.fill('   ');
  await expect(searchButton).toBeDisabled();
});

test('aceita caracteres especiais no termo enviado ao geocoding', async ({ page }) => {
  let requestedName: string | null = null;
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', async (route) => {
    requestedName = new URL(route.request().url()).searchParams.get('name');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill(' São-Paulo, SP 😀 ');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText('Nenhuma cidade encontrada', { exact: true })).toBeVisible();
  expect(requestedName).toBe('São-Paulo, SP 😀');
});

test('exibe erro quando o forecast está incompleto', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 1,
            name: 'Sao Paulo',
            country: 'Brasil',
            latitude: -23.55,
            longitude: -46.63,
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    });
  });

  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          time: '2026-09-16T14:00',
          temperature_2m: 24,
          weather_code: 0,
        },
        timezone: 'America/Sao_Paulo',
        daily: {
          time: ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19'],
          weather_code: [0, 1, 2, 3],
          temperature_2m_max: [26, 27, 25, 24],
          temperature_2m_min: [17, 18, 16, 15],
        },
      }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('Sao Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('option', { name: /Sao Paulo, Brasil/ }).click();

  await expect(page.getByRole('alert')).toContainText('Nao foi possivel carregar os dados.');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

async function mockSuccessfulWeatherApi(page: Page) {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 1,
            name: 'Sao Paulo',
            country: 'Brasil',
            admin1: 'Sao Paulo',
            latitude: -23.55,
            longitude: -46.63,
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    });
  });

  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          time: '2026-09-16T14:00',
          temperature_2m: 24,
          apparent_temperature: 25,
          weather_code: 0,
          is_day: 1,
        },
        timezone: 'America/Sao_Paulo',
        daily: {
          time: ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_max: [26, 27, 25, 24, 22],
          temperature_2m_min: [17, 18, 16, 15, 14],
          precipitation_probability: [0, 10, 20, 30, 80],
        },
      }),
    });
  });
}

test('renderiza o clima corretamente em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockSuccessfulWeatherApi(page);

  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('Sao Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('option', { name: /Sao Paulo, Brasil/ }).click();

  await expect(page.getByRole('heading', { name: 'Sao Paulo' })).toBeVisible();
  await expect(page.getByText('24°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
});
