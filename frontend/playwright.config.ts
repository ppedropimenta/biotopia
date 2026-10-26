import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // All journeys share one backend and one database, so they run one after another.
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // The first start pulls the PostgreSQL image and compiles the backend, hence the long wait.
      command: 'node e2e/start-backend.mjs',
      url: 'http://localhost:8080/actuator/health',
      timeout: 300_000,
      // Journeys read emails from the log this script writes, so they need the backend it started.
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
