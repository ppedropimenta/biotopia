// Starts the real backend for the end-to-end tests, on a throwaway PostgreSQL from Testcontainers, and keeps its
// log in e2e/.output/backend.log. The log matters: with no mail server configured the backend writes each email
// there, which is how a test reads the confirmation link.
//
// BACKEND_JVM_ARGS passes JVM options to the backend, for machines short on memory.
import { spawn } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const backendDir = fileURLToPath(new URL('../../backend/', import.meta.url))
const outputDir = fileURLToPath(new URL('./.output/', import.meta.url))
mkdirSync(outputDir, { recursive: true })
const log = createWriteStream(outputDir + 'backend.log')

const windows = process.platform === 'win32'
const mavenArgs = ['spring-boot:test-run']
if (process.env.BACKEND_JVM_ARGS) mavenArgs.push(`-Dspring-boot.run.jvmArguments=${process.env.BACKEND_JVM_ARGS}`)

// On Windows the Maven wrapper is a .cmd file, which only cmd.exe can run.
const [command, args] = windows ? ['cmd.exe', ['/c', '.\\mvnw.cmd', ...mavenArgs]] : ['./mvnw', mavenArgs]

// Every journey reaches the backend from this one machine, so the per-address limits (5 sign-ups an hour, 30 requests
// a minute on the open routes) would stop the run. They are raised here; the limits per account stay as they are.
const env = { ...process.env, APP_RATE_LIMITS_SIGN_UPS_PER_HOUR: '10000', APP_RATE_LIMITS_OPEN_ROUTE_REQUESTS_PER_MINUTE: '10000' }
const backend = spawn(command, args, { cwd: backendDir, env, stdio: ['ignore', 'pipe', 'pipe'] })
backend.stdout.pipe(log)
backend.stderr.pipe(log)
backend.on('exit', (code) => process.exit(code ?? 1))

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => backend.kill(signal))
