import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
const logs = []
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`))

await page.goto('http://localhost:5173/login')
await page.waitForSelector('text=Ana Aluna')
await page.click('text=Ana Aluna')
await page.click('button:has-text("Entrar")')
await page.waitForURL('**/dashboard**')

await page.goto('http://localhost:5173/dashboard/questions')
await page.waitForSelector('text=Confirmar Resposta', { timeout: 15000 })

// pick the first alternative (likely wrong) and confirm
const options = page.locator('button:has(span.w-10.h-10)')
await options.first().click()
await page.click('button:has-text("Confirmar Resposta")')
await page.screenshot({ path: 'C:/Users/GUSTAV~1/AppData/Local/Temp/claude/c--Users-Gustavo-Galeno-Desktop-Orbit-Edu--rbida-Edu/f7552740-455f-4eec-aba1-7cf149c67f33/scratchpad/right-after-click.png', fullPage: true })
await page.waitForSelector('text=/Resolvi (certo|errado)/', { timeout: 15000 })

const badge = await page.locator('text=/Resolvi (certo|errado)/').first().textContent()
console.log('BADGE_AFTER_ANSWER:', badge)

await page.screenshot({ path: 'C:/Users/GUSTAV~1/AppData/Local/Temp/claude/c--Users-Gustavo-Galeno-Desktop-Orbit-Edu--rbida-Edu/f7552740-455f-4eec-aba1-7cf149c67f33/scratchpad/after-answer.png', fullPage: true })

// reload to see persisted state
await page.reload()
await page.waitForSelector('text=/Resolvi (certo|errado)/', { timeout: 15000 })
const badgeAfterReload = await page.locator('text=/Resolvi (certo|errado)/').first().textContent()
console.log('BADGE_AFTER_RELOAD:', badgeAfterReload)

await page.screenshot({ path: 'C:/Users/GUSTAV~1/AppData/Local/Temp/claude/c--Users-Gustavo-Galeno-Desktop-Orbit-Edu--rbida-Edu/f7552740-455f-4eec-aba1-7cf149c67f33/scratchpad/after-reload.png', fullPage: true })

console.log('CONSOLE_LOGS:')
console.log(logs.join('\n'))

await browser.close()
