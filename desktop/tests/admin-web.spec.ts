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
  await expect(page.getByRole('button', { name: /Editar|Eliminar/ })).toHaveCount(0)
  await page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('link').click()
  await expect(
    page.getByRole('heading', { name: 'Listado de alumnos · 2', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Guardar|Programar/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Editar|Eliminar/ })).toHaveCount(0)
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
      await page.addInitScript((name) => localStorage.setItem('atempo-student-theme', name), theme)
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
    session: localStorage.getItem('atempo-student-session'),
    accounts: localStorage.getItem('atempo-student-accounts')
  }))
  expect(before.session).toContain('ada.lopez@clase.test')
  await enterAdmin(page)
  await invite(page, 'Nueva alumna', 'nueva@clase.test', 'student')
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Abrir demo de administración' })).toBeVisible()
  expect(
    await page.evaluate(() => ({
      session: localStorage.getItem('atempo-student-session'),
      accounts: localStorage.getItem('atempo-student-accounts')
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

test('edits a person with prefilled fields, cancels changes and confirms deletion', async ({
  page
}) => {
  await enterAdmin(page)
  await invite(page, 'Persona temporal', 'persona@clase.test', 'student')
  await page.getByRole('button', { name: 'Editar Persona temporal', exact: true }).click()
  await expect(page.getByLabel('Nombre completo', { exact: true })).toHaveValue('Persona temporal')
  await expect(page.getByLabel('Correo', { exact: true })).toHaveValue('persona@clase.test')
  await expect(page.getByLabel('Rol', { exact: true })).toHaveValue('student')
  await page.getByLabel('Nombre completo', { exact: true }).fill('Sin guardar')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'persona@clase.test' })).toContainText(
    'Persona temporal'
  )
  await page.getByRole('button', { name: 'Editar Persona temporal', exact: true }).click()
  await page.getByLabel('Nombre completo', { exact: true }).fill('Persona editada')
  await page.getByLabel('Correo', { exact: true }).fill(' ANA@NEOLAND.EXAMPLE ')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Ya existe')
  await page.getByLabel('Correo', { exact: true }).fill('editada@clase.test')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'editada@clase.test' })).toContainText(
    'Persona editada'
  )
  await page.getByRole('button', { name: 'Eliminar Persona editada', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar persona', exact: true })
  await expect(dialog).toContainText('Persona editada')
  await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'editada@clase.test' })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar Persona editada', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'editada@clase.test' })).toHaveCount(0)
})

test('promotes and demotes teachers without granting admin to students', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterAdmin(page)
  await adminNav(page, 'Personas')
  const current = page.getByRole('row').filter({ hasText: 'miguel@neoland.example' })
  const warning = current.getByText('No puedes eliminar tu propia cuenta.')
  await expect(warning).toBeVisible()
  await expect(warning).toHaveCSS('white-space', 'normal')
  await expect(current.getByRole('button', { name: /Eliminar/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Invitar persona' }).click()
  await page.getByLabel('Nombre completo').fill('Profesora invitada')
  await page.getByLabel('Correo', { exact: true }).fill('invitada@clase.test')
  const admin = page.getByRole('switch', { name: 'También es administrador' })
  const role = page.getByLabel('Rol', { exact: true })
  await expect(admin).toHaveCount(0)
  await role.selectOption('teacher')
  await admin.check()
  await role.selectOption('student')
  await role.selectOption('teacher')
  await expect(admin).not.toBeChecked()
  await admin.check()
  await page.getByRole('button', { name: 'Preparar invitación' }).click()
  const row = page.getByRole('row').filter({ hasText: 'invitada@clase.test' })
  await expect(row).toContainText('Administrador y profesor')
  await expect(row).toContainText('Invitación pendiente')
  await row.getByRole('button', { name: 'Editar Profesora invitada' }).click()
  await expect(admin).toBeChecked()
  await admin.uncheck()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(row).toContainText('Profesor')
  await expect(row).not.toContainText('Administrador')
  await expect(row).toContainText('Invitación pendiente')
})

test('admin details can be edited while their actual roles remain read-only', async ({ page }) => {
  await enterAdmin(page)
  await adminNav(page, 'Personas')
  await page.getByRole('button', { name: 'Editar Miguel Rodríguez', exact: true }).click()
  await expect(page.getByLabel('Rol', { exact: true })).toHaveValue('Administrador y profesor')
  await expect(page.getByLabel('Rol', { exact: true })).toHaveAttribute('readonly', '')
  await page.getByLabel('Nombre completo', { exact: true }).fill('Miguel Docente')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'miguel@neoland.example' })).toContainText(
    'Administrador y profesor'
  )
  await expect(
    page.getByRole('button', { name: 'Eliminar Miguel Docente', exact: true })
  ).toHaveCount(0)
  await adminNav(page, 'Mis clases')
  await expect(page.getByRole('link', { name: 'Desarrollo web', exact: true })).toBeVisible()
})

test('student deletion cleans enrolments and an assigned teacher requires course reassignment', async ({
  page
}) => {
  await enterAdmin(page)
  await adminNav(page, 'Personas')
  await expect(
    page.getByRole('button', { name: 'Eliminar Miguel Rodríguez', exact: true })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Eliminar Ana López', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar persona', exact: true })
  await expect(dialog).toContainText('2 cursos')
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'ana@neoland.example' })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar Ana López', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await adminNav(page, 'Cursos')
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Alumnos matriculados · 1', exact: true })
  ).toBeVisible()
  await page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('link').click()
  await expect(page.getByRole('row').filter({ hasText: 'Ana López' })).toHaveCount(0)
  await adminNav(page, 'Personas')
  await page.getByRole('button', { name: 'Eliminar Lucía García', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Reasigna')
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await adminNav(page, 'Cursos')
  await page.getByRole('link', { name: 'Diseño UX/UI', exact: true }).click()
  await page.getByRole('button', { name: 'Editar curso', exact: true }).click()
  await expect(page.getByLabel('Nombre del curso', { exact: true })).toHaveValue('Diseño UX/UI')
  await page.getByLabel('Profesor', { exact: true }).selectOption('person-admin')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await adminNav(page, 'Personas')
  await page.getByRole('button', { name: 'Eliminar Lucía García', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'lucia@neoland.example' })).toHaveCount(0)
})

test('course edits update its session roster and course deletion removes its sessions', async ({
  page
}) => {
  await enterAdmin(page)
  await adminNav(page, 'Cursos')
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
  const originalCoursePath = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Editar curso', exact: true }).click()
  await expect(page.getByLabel('Profesor', { exact: true })).toHaveValue('person-admin')
  await expect(page.getByRole('checkbox', { name: 'Ana López', exact: true })).toBeChecked()
  await page.getByLabel('Nombre del curso', { exact: true }).fill('Cambio cancelado')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Desarrollo web')
  await page.getByRole('button', { name: 'Editar curso', exact: true }).click()
  await page.getByLabel('Nombre del curso', { exact: true }).fill('Curso editado')
  await page.getByLabel('Profesor', { exact: true }).selectOption('person-teacher')
  await page.getByRole('checkbox', { name: 'Ana López', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${originalCoursePath}$`))
  await page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('link').click()
  const originalSessionPath = new URL(page.url()).pathname
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Curso editado')
  await expect(page.locator('dd').filter({ hasText: 'Lucía García' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Ana López' })).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Luis Martín' })).toBeVisible()
  await page.getByRole('link', { name: 'Volver al curso', exact: true }).click()
  await page.getByRole('button', { name: 'Eliminar curso', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar curso', exact: true })
  await expect(dialog).toContainText('1 sesiones programadas')
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Curso editado')
  await page.getByRole('button', { name: 'Eliminar curso', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/courses\/?$/)
  await expect(page.getByRole('link', { name: 'Curso editado', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Diseño UX/UI', exact: true }).click()
  await expect(
    page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('row')
  ).toHaveCount(2)
  await adminNav(page, 'Cursos')
  await page.getByRole('button', { name: 'Crear curso', exact: true }).click()
  await page.getByLabel('Nombre del curso', { exact: true }).fill('Después del borrado')
  await page.getByLabel('Profesor', { exact: true }).selectOption('person-admin')
  await page.getByRole('button', { name: 'Guardar curso', exact: true }).click()
  expect(new URL(page.url()).pathname).not.toBe(originalCoursePath)
  await page.evaluate((path) => window.history.pushState({}, '', path), originalCoursePath)
  await page.goBack()
  await page.goForward()
  await expect(
    page.getByRole('heading', { name: 'Curso no disponible', exact: true })
  ).toBeVisible()
  await page.evaluate((path) => window.history.pushState({}, '', path), originalSessionPath)
  await page.goBack()
  await page.goForward()
  await expect(
    page.getByRole('heading', { name: 'Sesión no disponible', exact: true })
  ).toBeVisible()
})

test('session editing is prefilled and validated; deleting it preserves its course', async ({
  page
}) => {
  await enterAdmin(page)
  await adminNav(page, 'Cursos')
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
  await page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('link').click()
  const originalPath = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Editar sesión', exact: true }).click()
  await expect(page.getByLabel('Fecha', { exact: true })).toHaveValue('2026-11-19')
  await expect(page.getByLabel('Aula', { exact: true })).toHaveValue('Aula 1')
  await page.getByLabel('Aula', { exact: true }).fill('Sin guardar')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByText('Aula 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Editar sesión', exact: true }).click()
  await page.getByLabel('Fecha', { exact: true }).fill('2026-12-01')
  await page.getByLabel('Hora de inicio', { exact: true }).fill('12:00')
  await page.getByLabel('Hora de fin', { exact: true }).fill('11:00')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('posterior')
  await page.getByLabel('Hora de fin', { exact: true }).fill('13:30')
  await page.getByLabel('Aula', { exact: true }).fill('Aula editada')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${originalPath}$`))
  await expect(page.getByText('Aula editada', { exact: true })).toBeVisible()
  await expect(
    page.getByText('1 de diciembre de 2026 · 12:00–13:30', { exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar sesión', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar sesión', exact: true })
  await expect(dialog).toContainText('Desarrollo web')
  await expect(dialog).toContainText('1 de diciembre de 2026')
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.getByRole('button', { name: 'Eliminar sesión', exact: true }).click()
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/courses\/course-web$/)
  await expect(
    page.getByText('Todavía no hay sesiones programadas.', { exact: true })
  ).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Desarrollo web')
})

for (const theme of ['atempo-oscuro', 'atempo-claro']) {
  test(`editing and deletion dialogs fit mobile with keyboard cancellation in ${theme}`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript((name) => localStorage.setItem('atempo-student-theme', name), theme)
    await enterAdmin(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await adminNav(page, 'Personas')
    await page.getByRole('button', { name: 'Editar Ana López', exact: true }).click()
    await expect(page.getByLabel('Nombre completo', { exact: true })).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: test.info().outputPath(`admin-edit-person-${theme}-390.png`),
      fullPage: true
    })
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await page.getByRole('button', { name: 'Eliminar Ana López', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Eliminar persona', exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('opacity', '1')
    await expect(dialog.locator('.modal-box')).toHaveCSS('opacity', '1')
    const box = await dialog.locator('.modal-box').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
    await page.screenshot({
      path: test.info().outputPath(`admin-delete-person-${theme}-390.png`),
      fullPage: true,
      animations: 'disabled'
    })
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Eliminar', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('row').filter({ hasText: 'ana@neoland.example' })).toBeVisible()
  })
}

async function openWeeklyForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Programar sesión', exact: true }).click()
  await page.getByRole('radio', { name: 'Semanal', exact: true }).check()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByLabel('Fecha inicial', { exact: true }).fill('2026-11-02')
  await page.getByLabel('Fecha final (incluida)', { exact: true }).fill('2026-11-11')
  await page
    .getByRole('group', { name: 'Días de la semana', exact: true })
    .getByRole('checkbox', { name: 'Lunes', exact: true })
    .check()
  await page.getByRole('checkbox', { name: 'Miércoles', exact: true }).check()
  await page.getByLabel('Hora de inicio', { exact: true }).fill('09:00')
  await page.getByLabel('Hora de fin', { exact: true }).fill('11:00')
  await page.getByLabel('Aula', { exact: true }).fill('Aula semanal')
}

async function openSeedCourse(page: Page): Promise<void> {
  await enterAdmin(page)
  await adminNav(page, 'Cursos')
  await page.getByRole('link', { name: 'Desarrollo web', exact: true }).click()
}

test('weekly preview creates four independent sessions and returns to course for individual CRUD', async ({
  page
}) => {
  await openSeedCourse(page)
  await openWeeklyForm(page)
  const preview = page.getByRole('region', { name: 'Vista previa', exact: true })
  await expect(preview).toContainText('4 coincidencias · 4 por crear · 0 ya existentes')
  await preview.getByText('Ver fechas', { exact: true }).click()
  await expect(preview.getByRole('listitem')).toHaveText([
    '2 de noviembre de 2026',
    '4 de noviembre de 2026',
    '9 de noviembre de 2026',
    '11 de noviembre de 2026'
  ])
  await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/courses\/course-web$/)
  await expect(page.getByRole('form', { name: 'Programar sesión' })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText(
    '4 sesiones creadas de 4 coincidencias. 0 ya existentes omitidas.'
  )
  const table = page.getByRole('table', { name: 'Sesiones del curso' })
  await expect(table.getByRole('row')).toHaveCount(6)
  const links = await table
    .getByRole('link')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('href')))
  expect(new Set(links).size).toBe(5)
  await table.getByRole('link', { name: '2 de noviembre de 2026', exact: true }).click()
  const occurrencePath = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Editar sesión', exact: true }).click()
  await expect(page.getByLabel('Fecha', { exact: true })).toHaveValue('2026-11-02')
  await expect(page.getByRole('radio', { name: 'Semanal', exact: true })).toHaveCount(0)
  await page.getByLabel('Aula', { exact: true }).fill('Solo esta ocurrencia')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  expect(new URL(page.url()).pathname).toBe(occurrencePath)
  await page.getByRole('link', { name: 'Volver al curso', exact: true }).click()
  await expect(table.getByRole('row').filter({ hasText: 'Solo esta ocurrencia' })).toHaveCount(1)
  await expect(table.getByRole('row').filter({ hasText: 'Aula semanal' })).toHaveCount(3)
  await table.getByRole('link', { name: '4 de noviembre de 2026', exact: true }).click()
  await page.getByRole('button', { name: 'Eliminar sesión', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/courses\/course-web$/)
  await expect(table.getByRole('row')).toHaveCount(5)
  await expect(
    table.getByRole('link', { name: '9 de noviembre de 2026', exact: true })
  ).toBeVisible()
  await expect(
    table.getByRole('link', { name: '11 de noviembre de 2026', exact: true })
  ).toBeVisible()
})

test('weekly UI omits exact duplicates in other rooms and repeated submission creates nothing', async ({
  page
}) => {
  await openSeedCourse(page)
  await page.getByRole('button', { name: 'Programar sesión', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Una sesión', exact: true })).toBeChecked()
  await page.getByLabel('Fecha', { exact: true }).fill('2026-11-02')
  await page.getByLabel('Hora de fin', { exact: true }).fill('11:00')
  await page.getByLabel('Aula', { exact: true }).fill('Aula original')
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sessions\//)
  await page.getByRole('link', { name: 'Volver al curso', exact: true }).click()
  await openWeeklyForm(page)
  await expect(page.getByRole('region', { name: 'Vista previa' })).toContainText(
    '4 coincidencias · 3 por crear · 1 ya existentes'
  )
  await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(
    '3 sesiones creadas de 4 coincidencias. 1 ya existentes omitidas.'
  )
  const table = page.getByRole('table', { name: 'Sesiones del curso' })
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(table.getByRole('row').filter({ hasText: 'Aula original' })).toHaveCount(1)
  const before = await table.innerText()
  await openWeeklyForm(page)
  await expect(page.getByRole('region', { name: 'Vista previa' })).toContainText(
    '4 coincidencias · 0 por crear · 4 ya existentes'
  )
  for (let submission = 0; submission < 2; submission++) {
    await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Nada nuevo: las 4 sesiones ya existen.')
    expect(await table.innerText()).toBe(before)
  }
})

test('weekly form errors are correctable and cancel preserves existing sessions', async ({
  page
}) => {
  await openSeedCourse(page)
  const table = page.getByRole('table', { name: 'Sesiones del curso' })
  const before = await table.innerText()
  await page.getByRole('button', { name: 'Programar sesión', exact: true }).click()
  await page.getByRole('radio', { name: 'Semanal', exact: true }).check()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('fechas válidas')
  await page.getByLabel('Fecha inicial', { exact: true }).fill('2026-11-02')
  await page.getByLabel('Fecha final (incluida)', { exact: true }).fill('2026-11-11')
  await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('día de la semana')
  await page.getByRole('checkbox', { name: 'Lunes', exact: true }).check()
  await page.getByLabel('Aula', { exact: true }).fill('Temporal')
  await page.getByLabel('Hora de fin', { exact: true }).fill('09:00')
  await page.getByRole('button', { name: 'Guardar sesiones', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('posterior')
  expect(await table.innerText()).toBe(before)
  await page.getByLabel('Hora de fin', { exact: true }).fill('11:00')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Vista previa' })).toContainText('2 por crear')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Programar sesión' })).toHaveCount(0)
  expect(await table.innerText()).toBe(before)
})

for (const width of [390, 1280]) {
  for (const theme of ['atempo-oscuro', 'atempo-claro']) {
    test(`weekly form fits ${width}px in ${theme} with keyboard selection and cancellation`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((name) => localStorage.setItem('atempo-student-theme', name), theme)
      await openSeedCourse(page)
      await openWeeklyForm(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const group = page.getByRole('group', { name: 'Días de la semana', exact: true })
      await expect(group.getByRole('checkbox')).toHaveCount(7)
      await group.getByRole('checkbox', { name: 'Lunes', exact: true }).focus()
      await page.keyboard.press('Space')
      await expect(group.getByRole('checkbox', { name: 'Lunes', exact: true })).not.toBeChecked()
      await page.keyboard.press('Space')
      await page.keyboard.press('Tab')
      await expect(group.getByRole('checkbox', { name: 'Martes', exact: true })).toBeFocused()
      await expect(page.getByRole('region', { name: 'Vista previa' })).toContainText(
        '4 coincidencias'
      )
      await page.getByText('Ver fechas', { exact: true }).click()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true)
      await page.evaluate(async () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
      })
      await page.screenshot({
        path: `/private/tmp/atempo-recurrence-qa/weekly-${theme}-${width}.png`,
        fullPage: true,
        animations: 'disabled'
      })
      await page.getByRole('button', { name: 'Cancelar', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('form', { name: 'Programar sesión' })).toHaveCount(0)
      await expect(
        page.getByRole('table', { name: 'Sesiones del curso' }).getByRole('row')
      ).toHaveCount(2)
    })
  }
}
