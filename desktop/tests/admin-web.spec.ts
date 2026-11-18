import { expect, test, type Page } from '@playwright/test'

async function enterStudent(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByLabel('Correo', { exact: true }).fill('ada.lopez@clase.test')
  await page.getByLabel('Contraseña', { exact: true }).fill('clase-2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/student\/dashboard/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ada')
}

async function enterAdmin(page: Page): Promise<void> {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Abrir demo de administración' }).click()
  await expect(page.getByRole('navigation', { name: 'Administración', exact: true })).toBeVisible()
}

async function adminNav(page: Page, name: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Administración', exact: true })
    .getByRole('link', { name, exact: true })
    .click()
}

async function invite(
  page: Page,
  name: string,
  email: string,
  role: 'teacher' | 'student'
): Promise<void> {
  await adminNav(page, 'Personas')
  await page.getByRole('button', { name: 'Invitar persona', exact: true }).click()
  await page.getByLabel('Nombre completo', { exact: true }).fill(name)
  await page.getByLabel('Correo', { exact: true }).fill(email)
  await page.getByLabel('Rol', { exact: true }).selectOption(role)
  await page.getByRole('button', { name: 'Preparar invitación', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(`Invitación preparada para ${name}`)
  await expect(page.getByRole('row').filter({ hasText: email })).toContainText(
    'Invitación pendiente'
  )
}

async function createCourse(
  page: Page,
  name: string,
  teacher: string,
  student: string
): Promise<void> {
  await adminNav(page, 'Cursos')
  await page.getByRole('button', { name: 'Crear curso', exact: true }).click()
  await page.getByLabel('Nombre del curso', { exact: true }).fill(name)
  const option = page
    .getByLabel('Profesor', { exact: true })
    .locator('option')
    .filter({ hasText: teacher })
  await page
    .getByLabel('Profesor', { exact: true })
    .selectOption((await option.getAttribute('value'))!)
  await page.getByRole('checkbox', { name: student }).check()
  await page.getByRole('button', { name: 'Guardar curso', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
}

test('invitation to course to session produces the exact pending roster without network writes', async ({
  page
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method()))
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`)
  })
  await enterAdmin(page)
  await invite(page, 'Elena Docente', 'elena@clase.test', 'teacher')
  await invite(page, 'Bruno Alumno', 'bruno@clase.test', 'student')
  await createCourse(page, 'Curso de prueba', 'Elena Docente', 'Bruno Alumno')
  await expect(
    page.getByText('Profesor: Elena Docente · Invitación pendiente', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Alumnos matriculados · 1', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Programar sesión', exact: true }).click()
  await page.getByLabel('Fecha', { exact: true }).fill('2026-11-21')
  await page.getByLabel('Hora de inicio', { exact: true }).fill('09:00')
  await page.getByLabel('Hora de fin', { exact: true }).fill('09:00')
  await page.getByLabel('Aula', { exact: true }).fill('Aula nueva')
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('posterior')
  await page.getByLabel('Hora de fin', { exact: true }).fill('11:00')
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sessions\/session-/)
  await expect(
    page.getByRole('heading', { name: 'Listado de alumnos · 1', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2)
  const row = page.getByRole('row').filter({ hasText: 'Bruno Alumno' })
  await expect(row).toContainText('Invitación pendiente')
  await expect(row.getByRole('cell', { name: 'Pendiente', exact: true })).toBeVisible()
  await expect(page.getByText('Aula nueva', { exact: true })).toBeVisible()
  await expect(page.locator('dd').filter({ hasText: 'Elena Docente' })).toHaveText(
    'Elena Docente · Invitación pendiente'
  )
  await page.screenshot({
    path: test.info().outputPath('admin-session-roster.png'),
    fullPage: true
  })
  await page.getByRole('link', { name: 'Volver al curso', exact: true }).click()
  await expect(
    page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('row')
  ).toHaveCount(2)
  await expect(page.getByRole('row').filter({ hasText: 'Aula nueva' })).toContainText('Programada')
  expect(writes).toEqual([])
})

test('validates and cancels course and session forms', async ({ page }) => {
  await enterAdmin(page)
  await adminNav(page, 'Cursos')
  await page.getByRole('button', { name: 'Crear curso', exact: true }).click()
  await page.getByRole('button', { name: 'Guardar curso', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('nombre del curso')
  await page.getByLabel('Nombre del curso', { exact: true }).fill('Sin profesor')
  await page.getByRole('button', { name: 'Guardar curso', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('profesor')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('row')).toHaveCount(3)
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
  await page.getByRole('button', { name: 'Programar sesión', exact: true }).click()
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('fecha')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(
    page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('row')
  ).toHaveCount(2)
})

test('dual-role admin sees only assigned classes in the reused read-only view', async ({
  page
}) => {
  await enterAdmin(page)
  await createCourse(page, 'Mi curso nuevo', 'Miguel Rodríguez', 'Ana López')
  await adminNav(page, 'Mis clases')
  await expect(page.getByRole('link', { name: 'Desarrollo web', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mi curso nuevo', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Diseño UX/UI', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Crear curso', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Programar sesión', exact: true })).toHaveCount(0)
  await page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('link').click()
  await expect(
    page.getByRole('heading', { name: 'Listado de alumnos · 2', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Guardar|Programar/ })).toHaveCount(0)
  await adminNav(page, 'Mis clases')
  await page.getByRole('link', { name: 'Volver a administración', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola, Miguel')
})

test('deep links require demo entry and reject another teacher course/session in Mis clases', async ({
  page
}) => {
  for (const [path, heading] of [
    ['/admin/my-classes/course-design', 'Curso no disponible'],
    ['/admin/my-classes/course-web/session-design', 'Sesión no disponible'],
    ['/admin/my-classes/course-design/session-design', 'Sesión no disponible']
  ]) {
    await page.goto(path)
    await expect(page.getByRole('button', { name: 'Abrir demo de administración' })).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
    await page.getByRole('button', { name: 'Abrir demo de administración' }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Abrir demo de administración' })).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
})

for (const width of [390, 1280]) {
  for (const theme of ['atempo-oscuro', 'atempo-claro']) {
    test(`admin forms and tables fit ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(
        (name) => sessionStorage.setItem('atempo-student-theme', name),
        theme
      )
      await enterAdmin(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.screenshot({
        path: test.info().outputPath(`admin-home-${theme}-${width}.png`),
        fullPage: true
      })
      for (const name of ['Inicio', 'Personas', 'Cursos', 'Mis clases']) {
        await adminNav(page, name)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        ).toBe(true)
      }
      await adminNav(page, 'Personas')
      await page.getByRole('button', { name: 'Invitar persona', exact: true }).click()
      await page.getByLabel('Nombre completo', { exact: true }).fill('Nombre de teclado')
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Correo', { exact: true })).toBeFocused()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: test.info().outputPath(`admin-people-${theme}-${width}.png`),
        fullPage: true
      })
      await adminNav(page, 'Cursos')
      await page.getByRole('button', { name: 'Crear curso', exact: true }).click()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: test.info().outputPath(`admin-course-${theme}-${width}.png`),
        fullPage: true
      })
    })
  }
}

test('validates and cancels invitations without adding people', async ({ page }) => {
  await enterAdmin(page)
  await adminNav(page, 'Personas')
  await expect(page.getByRole('row')).toHaveCount(5)
  await page.getByRole('button', { name: 'Invitar persona', exact: true }).click()
  await expect(page.getByLabel('Nombre completo', { exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Preparar invitación', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('nombre')
  await page.getByLabel('Nombre completo', { exact: true }).fill('Nombre nuevo')
  await page.getByLabel('Correo', { exact: true }).fill(' ANA@NEOLAND.EXAMPLE ')
  await page.getByRole('button', { name: 'Preparar invitación', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Ya existe una persona')
  await expect(page.getByRole('row')).toHaveCount(5)
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Invitar persona' })).toHaveCount(0)
  await expect(page.getByRole('row')).toHaveCount(5)
})

test('admin entry and logout leave the student session and accounts alone', async ({ page }) => {
  await enterStudent(page)
  const before = await page.evaluate(() => ({
    session: sessionStorage.getItem('atempo-student-session'),
    accounts: sessionStorage.getItem('atempo-student-accounts')
  }))
  await enterAdmin(page)
  await invite(page, 'Nueva alumna', 'nueva@clase.test', 'student')
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Abrir demo de administración' })).toBeVisible()
  expect(
    await page.evaluate(() => ({
      session: sessionStorage.getItem('atempo-student-session'),
      accounts: sessionStorage.getItem('atempo-student-accounts')
    }))
  ).toEqual(before)
  await page.goto('/student/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ada')
})

test('reload restores the admin seed and requires reopening the demo', async ({ page }) => {
  await enterAdmin(page)
  await invite(page, 'Temporal', 'temporal@clase.test', 'student')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Abrir demo de administración' })).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir demo de administración' }).click()
  await adminNav(page, 'Personas')
  await expect(page.getByRole('row')).toHaveCount(5)
  await expect(page.getByText('temporal@clase.test', { exact: true })).toHaveCount(0)
})

test('preserves student login, shared theme switch and logout', async ({ page }) => {
  await enterStudent(page)
  const theme = page.getByRole('switch', { name: 'Tema oscuro' })
  await expect(theme).toHaveAttribute('aria-checked', 'true')
  await theme.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'atempo-claro')
  await theme.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/student/history')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
})
