import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const storybookRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(storybookRoot, '../..')
const sourceRoot = path.join(storybookRoot, 'src')
const guideRoot = path.join(repoRoot, 'docs', 'guia')
const themeFile = path.join(sourceRoot, 'theme.css')
const previewFile = path.join(storybookRoot, '.storybook', 'preview.tsx')

const checkOnly = process.argv.includes('--check')

writeOrCheck(buildGuide(), checkOnly)

function buildGuide() {
  const pages = []
  const files = new Map()

  for (const file of walkFiles(sourceRoot)) {
    if (file.endsWith('.mdx')) pages.push(pageFromRule(file))
    if (file.endsWith('.stories.tsx')) pages.push(pageFromStory(file))
  }

  pages.sort(comparePages)

  for (const page of pages) {
    if (files.has(page.output)) throw new Error(`Dos páginas escriben ${page.output}`)
    files.set(page.output, page.markdown)
  }

  files.set('temas.md', themeMarkdown())
  files.set('README.md', indexMarkdown(pages))
  return files
}

function comparePages(a, b) {
  const rankA = groupRank(a.group)
  const rankB = groupRank(b.group)
  if (rankA !== rankB) return rankA - rankB
  return a.title.localeCompare(b.title, 'es')
}

function groupRank(group) {
  const pinned = ['Reglas', 'Fundamentos']
  const index = pinned.indexOf(group)
  return index === -1 ? pinned.length : index
}

function walkFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(full))
    else files.push(full)
  }
  return files.sort()
}

function pageFromRule(file) {
  const source = fs.readFileSync(file, 'utf8')
  const title = readMetaTitle(source, file)
  const lines = source.split('\n')
  const start = lines.findIndex((line) => line.startsWith('# '))
  if (start < 0) fail(file, 'La regla no tiene un título markdown')
  const body = lines.slice(start).join('\n').trim()
  const heading = body.match(/^# (.+)$/m)[1]
  const name = title.split('/')[1]
  if (heading !== name) fail(file, `El título ${title} no coincide con # ${heading}`)
  return {
    title,
    group: title.split('/')[0],
    name,
    output: outputPath(title),
    markdown: finish(`${generatedNote(file)}\n\n${body}`)
  }
}

function pageFromStory(file) {
  try {
    const source = fs.readFileSync(file, 'utf8')
    const title = readStoryTitle(source)
    const expanded = expandListMaps(source, file)
    const frameIndex = expanded.indexOf('<Frame>')
    if (frameIndex < 0) fail(file, 'No hay Frame')
    const frame = parseElement(expanded, frameIndex).node
    const imports = readImports(source, file)
    const sections = frame.children.filter((node) => typeof node !== 'string')
    if (sections.length === 0) fail(file, 'La historia no tiene secciones')

    const parts = [`# ${title}`, '', generatedNote(file), '']
    for (const section of sections) {
      if (section.tag !== 'Section') fail(file, `Dentro de Frame hay un ${section.tag}`)
      const heading = attributeString(section, 'title')
      const html = printNodes(section.children, imports)
      if (html.includes('```')) fail(file, 'El ejemplo rompe el bloque de código')
      parts.push(`## ${heading}`, '', '```html', html, '```', '')
    }

    const [group, name] = splitTitle(title, file)
    return {
      title,
      group,
      name,
      output: outputPath(title),
      markdown: finish(parts.join('\n'))
    }
  } catch (error) {
    if (error.file) throw error
    fail(file, error.message)
  }
}

function themeMarkdown() {
  const css = fs.readFileSync(themeFile, 'utf8')
  const preview = fs.readFileSync(previewFile, 'utf8')
  const themes = readThemes(css)
  const fonts = readFonts(css)
  const previewThemes = readPreviewThemes(preview)
  const cssNames = themes.map((theme) => theme.name)
  const sameNames =
    cssNames.length === previewThemes.names.length &&
    cssNames.every((name) => previewThemes.names.includes(name))
  if (!sameNames) {
    throw new Error('Los temas de theme.css y de preview.tsx no coinciden')
  }
  const defaults = themes.filter((theme) => theme.isDefault).map((theme) => theme.name)
  if (defaults.length !== 1 || defaults[0] !== previewThemes.defaultTheme) {
    throw new Error('El tema por defecto del CSS y el de la vista previa no coinciden')
  }

  const lines = [
    '# Temas',
    '',
    generatedNote(themeFile).replace(
      `Sale de \`${repoPath(themeFile)}\`.`,
      `Sale de \`${repoPath(themeFile)}\` y \`${repoPath(previewFile)}\`.`
    ),
    '',
    `La barra de Storybook cambia \`${previewThemes.attribute}\`. El tema por defecto es \`${previewThemes.defaultTheme}\`.`,
    ''
  ]

  for (const theme of themes) {
    const font = fonts.get(theme.name)
    if (!font) throw new Error(`Falta la fuente de ${theme.name}`)
    lines.push(`## ${theme.name}`, '')
    const role = theme.isDefault ? 'Es el tema por defecto. ' : ''
    const dark = theme.prefersDark ? ' Sigue `prefers-color-scheme: dark`.' : ''
    lines.push(`${role}Esquema \`${theme.scheme}\`. La fuente es ${font.family}.${dark}`)
    if (font.letterSpacing) lines.push('', `\`letter-spacing: ${font.letterSpacing}\`.`)
    lines.push('', '### Color', '', table(['Variable', 'Valor'], theme.colors), '')
    lines.push('### Resto del tema', '', table(['Variable', 'Valor'], theme.rest), '')
  }

  lines.push('## Tamaño de texto', '')
  lines.push('El tema añade estos tamaños. El resto sale de Tailwind.', '')
  lines.push(
    table(
      ['Clase', 'Tamaño', 'Interlineado'],
      readTextSizes(css).map((size) => [size.name, size.size, size.line])
    ),
    ''
  )

  lines.push('## Alturas', '')
  lines.push(
    table(
      ['Pieza', 'Altura'],
      [
        ['Botón', readHeight(css, '.btn:where(:not(.btn-xs, .btn-sm, .btn-lg, .btn-xl))', 'botón')],
        ['Botón `btn-sm`', readHeight(css, '.btn-sm {', 'btn-sm')],
        [
          'Campo y lista (`input`, `select`)',
          readHeight(css, '.input:where(:not(.input-xs, .input-sm, .input-lg, .input-xl))', 'campo')
        ],
        ['Botón, campo y lista con puntero grueso', readCoarseHeight(css)],
        ['Celda de tabla', readHeight(css, '.table :where(th, td)', 'tabla')]
      ]
    ),
    ''
  )

  const focus = readFocus(css)
  lines.push(`El foco visible es \`${focus.outline}\`, con separación \`${focus.offset}\`.`, '')
  return finish(lines.join('\n'))
}

function indexMarkdown(pages) {
  const lines = [
    '# Guía visual',
    '',
    'Storybook, en `docs/storybook`, es la fuente de verdad. Estos archivos salen de ahí.',
    'Para construir una pantalla, lee este markdown. No abras Storybook para copiar clases.',
    '',
    'Si cambia una historia, una regla, el tema o la vista previa, lanza esto desde `docs/storybook`:',
    '',
    '```sh',
    'pnpm guide',
    '```',
    '',
    'No edites esta carpeta a mano. `pnpm guide:check` comprueba que sigue igual que Storybook.',
    '',
    'Empieza por los temas y las reglas.',
    '',
    '## Temas',
    '',
    'Colores, fuentes y alturas de `atempo-oscuro` y `atempo-claro`.',
    '',
    '- [Temas](temas.md)',
    ''
  ]

  let group = ''
  for (const page of pages) {
    if (page.group !== group) {
      if (group) lines.push('')
      group = page.group
      lines.push(`## ${group}`, '')
    }
    lines.push(`- [${page.name}](${page.output})`)
  }
  lines.push('')
  return finish(lines.join('\n'))
}

function expandListMaps(source, file) {
  let cursor = 0
  let output = ''
  while (cursor < source.length) {
    const match = source.slice(cursor).match(/\{(\w+)\.map\(\((\w+)\) => \(/)
    if (!match) {
      output += source.slice(cursor)
      break
    }
    const start = cursor + match.index
    output += source.slice(cursor, start)
    const openParen = start + match[0].length - 1
    const closeParen = matchPair(source, openParen, '(', ')')
    const template = source.slice(openParen + 1, closeParen)
    let after = skipSpace(source, closeParen + 1)
    if (source[after] !== ')') fail(file, `El map de ${match[1]} no cierra`)
    after = skipSpace(source, after + 1)
    if (source[after] !== '}') fail(file, `El map de ${match[1]} no cierra`)
    const rendered = readObjectArray(source, match[1], file)
      .map((item) => fillTemplate(template, match[2], item, file))
      .join('\n')
    output += rendered
    cursor = after + 1
  }
  if (output.includes('.map(')) fail(file, 'Queda un .map() sin convertir')
  return output
}

function readObjectArray(source, name, file) {
  const marker = `const ${name} = [`
  const start = source.indexOf(marker)
  if (start < 0) fail(file, `No está la lista ${name}`)
  const open = source.indexOf('[', start)
  const close = matchPair(source, open, '[', ']')
  const body = source.slice(open + 1, close)
  const objects = []
  for (let index = 0; index < body.length; index++) {
    if (body[index] !== '{') continue
    const end = matchPair(body, index, '{', '}')
    objects.push(readFields(body.slice(index + 1, end), file))
    index = end
  }
  if (objects.length === 0) fail(file, `La lista ${name} está vacía`)
  return objects
}

function readFields(body, file) {
  const fields = {}
  for (const match of body.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) fields[match[1]] = match[2]
  if (Object.keys(fields).length === 0) fail(file, 'Hay un objeto de lista sin campos de texto')
  return fields
}

function fillTemplate(template, param, item, file) {
  let text = template.replace(new RegExp(`\\skey=\\{${param}\\.\\w+\\}`, 'g'), '')
  const fields = Object.entries(item).sort((a, b) => b[0].length - a[0].length)
  for (const [field, value] of fields) {
    text = text.replaceAll(`\${${param}.${field}}`, value)
    text = text.replaceAll(`{${param}.${field}}`, value)
  }
  if (text.includes('${') || text.includes(`{${param}.`)) {
    fail(file, `La plantilla de ${param} sigue teniendo campos sin dato`)
  }
  return text
}

function parseElement(text, index) {
  const nameMatch = text.slice(index).match(/^<([A-Za-z][\w.-]*)/)
  if (!nameMatch) throw new Error(`Etiqueta no reconocida cerca de ${text.slice(index, index + 24)}`)
  let cursor = index + nameMatch[0].length
  const parsed = parseAttributes(text, cursor)
  cursor = skipSpace(text, parsed.index)
  if (text[cursor] === '/') {
    if (text[cursor + 1] !== '>') throw new Error(`Cierre mal formado en ${nameMatch[1]}`)
    return {
      node: { tag: nameMatch[1], attrs: parsed.attrs, children: [] },
      index: cursor + 2
    }
  }
  if (text[cursor] !== '>') throw new Error(`La etiqueta no cierra: ${nameMatch[1]}`)
  const children = parseNodes(text, cursor + 1)
  const closing = `</${nameMatch[1]}>`
  if (!text.startsWith(closing, children.index)) {
    throw new Error(`Falta ${closing} cerca de ${text.slice(children.index, children.index + 40)}`)
  }
  return {
    node: { tag: nameMatch[1], attrs: parsed.attrs, children: children.nodes },
    index: children.index + closing.length
  }
}

function parseNodes(text, index) {
  const nodes = []
  let cursor = index
  while (cursor < text.length && !text.startsWith('</', cursor)) {
    if (text[cursor] === '<') {
      const parsed = parseElement(text, cursor)
      nodes.push(parsed.node)
      cursor = parsed.index
      continue
    }
    if (text[cursor] === '{') {
      const end = matchPair(text, cursor, '{', '}')
      const value = expressionToText(text.slice(cursor + 1, end).trim())
      if (value !== '') nodes.push(value)
      cursor = end + 1
      continue
    }
    let next = cursor
    while (next < text.length && text[next] !== '<' && text[next] !== '{') next++
    const raw = text.slice(cursor, next).replace(/\s+/g, ' ').trim()
    if (raw) nodes.push(raw)
    cursor = next
  }
  return { nodes, index: cursor }
}

function parseAttributes(text, index) {
  const attrs = []
  let cursor = index
  while (cursor < text.length) {
    cursor = skipSpace(text, cursor)
    if (text[cursor] === '>' || text[cursor] === '/') break
    const nameMatch = text.slice(cursor).match(/^([A-Za-z_:][\w:.-]*)/)
    if (!nameMatch) throw new Error(`Atributo no reconocido cerca de ${text.slice(cursor, cursor + 24)}`)
    const name = nameMatch[1]
    cursor += name.length
    cursor = skipSpace(text, cursor)
    if (text[cursor] !== '=') {
      attrs.push({ name, value: true })
      continue
    }
    cursor = skipSpace(text, cursor + 1)
    if (text[cursor] === '"' || text[cursor] === "'") {
      const quote = text[cursor]
      const end = text.indexOf(quote, cursor + 1)
      if (end < 0) throw new Error(`Comillas sin cerrar en ${name}`)
      attrs.push({ name, value: text.slice(cursor + 1, end) })
      cursor = end + 1
      continue
    }
    if (text[cursor] === '{') {
      const end = matchPair(text, cursor, '{', '}')
      attrs.push({ name, value: { expr: text.slice(cursor + 1, end).trim() } })
      cursor = end + 1
      continue
    }
    throw new Error(`Valor no reconocido en ${name}`)
  }
  return { attrs, index: cursor }
}

function printNodes(nodes, imports) {
  return nodes
    .map((node) => (typeof node === 'string' ? escapeText(node) : printNode(node, 0, imports)))
    .join('\n\n')
}

function printNode(node, indent, imports) {
  const pad = ' '.repeat(indent)
  const attrs = node.attrs.map((attr) => htmlAttribute(attr, imports)).filter(Boolean)
  const open = attrs.length === 0 ? node.tag : `${node.tag} ${attrs.join(' ')}`
  if (isVoid(node.tag)) return `${pad}<${open}>`
  const text = node.children.every((child) => typeof child === 'string')
  if (node.children.length === 0) return `${pad}<${open}></${node.tag}>`
  if (text) {
    return `${pad}<${open}>${node.children.map(escapeText).join('')}</${node.tag}>`
  }
  const inner = node.children
    .map((child) => (typeof child === 'string' ? `${pad}  ${escapeText(child)}` : printNode(child, indent + 2, imports)))
    .join('\n')
  return `${pad}<${open}>\n${inner}\n${pad}</${node.tag}>`
}

function attributeString(node, name) {
  const attr = node.attrs.find((item) => item.name === name)
  if (!attr || typeof attr.value !== 'string') throw new Error(`Falta ${name} en ${node.tag}`)
  return attr.value
}

function htmlAttribute(attr, imports) {
  if (attr.name === 'key' || attr.name === 'onClick' || attr.name === 'onChange') return null
  const name = htmlName(attr.name)
  if (attr.value === true) return name
  const value = typeof attr.value === 'string' ? attr.value : expressionToAttribute(attr.name, attr.value.expr, imports)
  return `${name}="${escapeAttr(value)}"`
}

function htmlName(name) {
  if (name === 'className') return 'class'
  if (name === 'htmlFor') return 'for'
  if (name === 'defaultValue') return 'value'
  if (name === 'defaultChecked') return 'checked'
  if (name === 'autoComplete') return 'autocomplete'
  if (name === 'inputMode') return 'inputmode'
  if (name === 'maxLength') return 'maxlength'
  return name
}

function expressionToAttribute(name, expr, imports) {
  if (name === 'style') return styleToCss(expr)
  const literal = readLiteral(expr)
  if (literal !== null) return literal
  if (/^\d+$/.test(expr)) return expr
  if (/^[A-Za-z_]\w*$/.test(expr) && imports.has(expr)) return imports.get(expr)
  throw new Error(`No sé convertir ${name}={${expr}}`)
}

function expressionToText(expr) {
  const literal = readLiteral(expr)
  if (literal !== null) return literal
  if (/^\d+$/.test(expr)) return expr
  throw new Error(`Expresión sin convertir: {${expr}}`)
}

function styleToCss(expr) {
  const pattern = /\['(--[\w-]+)' as string\]:\s*(?:(\d+(?:\.\d+)?)|'([^']*)'|"([^"]*)")/g
  const found = [...expr.matchAll(pattern)]
  if (found.length === 0) throw new Error(`style no reconocido: ${expr}`)
  const leftover = expr.replace(pattern, '').replace(/[{},\s]/g, '')
  if (leftover) throw new Error(`style no reconocido: ${expr}`)
  return found.map((match) => `${match[1]}: ${match[2] ?? match[3] ?? match[4]}`).join('; ')
}

function readLiteral(expr) {
  const quote = expr[0]
  if ((quote === "'" || quote === '"') && expr.at(-1) === quote) return expr.slice(1, -1)
  if (quote === '`' && expr.at(-1) === '`' && !expr.includes('${')) return expr.slice(1, -1)
  return null
}

function readImports(source, file) {
  const imports = new Map()
  for (const match of source.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (!match[2].startsWith('.')) continue
    const absolute = path.resolve(path.dirname(file), match[2])
    imports.set(match[1], repoPath(absolute))
  }
  return imports
}

function readStoryTitle(source) {
  const match = source.match(/title:\s*'([^']+)'/)
  if (!match) throw new Error('La historia no tiene título')
  return match[1]
}

function readMetaTitle(source, file) {
  const match = source.match(/<Meta title="([^"]+)" \/>/)
  if (!match) fail(file, 'La regla no tiene Meta title')
  splitTitle(match[1], file)
  return match[1]
}

function splitTitle(title, file) {
  const parts = title.split('/')
  if (parts.length !== 2 || parts.some((part) => part.trim() === '')) fail(file, `Título raro: ${title}`)
  return parts
}

function outputPath(title) {
  return `${title.split('/').map(slug).join('/')}.md`
}

function readThemes(css) {
  const themes = []
  for (const match of css.matchAll(/@plugin "daisyui\/theme" \{/g)) {
    const open = css.indexOf('{', match.index)
    const body = css.slice(open + 1, matchPair(css, open, '{', '}'))
    const name = body.match(/name:\s*"([^"]+)"/)
    const scheme = body.match(/color-scheme:\s*(\w+)/)
    if (!name || !scheme) throw new Error('Un tema no tiene nombre o esquema')
    const vars = [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((item) => [
      `--${item[1]}`,
      item[2].trim()
    ])
    themes.push({
      name: name[1],
      isDefault: /default:\s*true/.test(body),
      prefersDark: /prefersdark:\s*true/.test(body),
      scheme: scheme[1],
      colors: vars.filter((item) => item[0].startsWith('--color-')),
      rest: vars.filter((item) => !item[0].startsWith('--color-'))
    })
  }
  if (themes.length === 0) throw new Error('theme.css no tiene temas')
  return themes
}

function readFonts(css) {
  const fonts = new Map()
  for (const match of css.matchAll(/\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g)) {
    const family = match[2].match(/--font-sans:\s*"([^"]+)"/)
    if (!family) continue
    const spacing = match[2].match(/letter-spacing:\s*([^;]+);/)
    fonts.set(match[1], { family: family[1], letterSpacing: spacing ? spacing[1].trim() : '' })
  }
  return fonts
}

function readPreviewThemes(source) {
  const block = source.match(/themes:\s*\{([^}]+)\}/)
  const fallback = source.match(/defaultTheme:\s*'([^']+)'/)
  const attribute = source.match(/attributeName:\s*'([^']+)'/)
  if (!block || !fallback || !attribute) throw new Error('preview.tsx no declara los temas')
  if (attribute[1] !== 'data-theme') throw new Error('El atributo del tema no es data-theme')
  const names = [...block[1].matchAll(/'([^']+)':\s*'([^']+)'/g)].map((match) => {
    if (match[1] !== match[2]) throw new Error('El nombre del tema y el valor de data-theme no coinciden')
    return match[1]
  })
  return { names, defaultTheme: fallback[1], attribute: attribute[1] }
}

function readTextSizes(css) {
  const open = css.indexOf('@theme {')
  const body = css.slice(open, matchPair(css, css.indexOf('{', open), '{', '}'))
  return ['2xl', 'meta', 'xs'].map((name) => {
    const size = body.match(new RegExp(`--text-${name}:\\s*([^;]+);`))
    const line = body.match(new RegExp(`--text-${name}--line-height:\\s*([^;]+);`))
    if (!size || !line) throw new Error(`Falta el tamaño text-${name}`)
    return { name: `text-${name}`, size: size[1].trim(), line: line[1].trim() }
  })
}

function readHeight(css, selector, label) {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`Falta el selector de ${label}`)
  const open = css.indexOf('{', start)
  const body = css.slice(open + 1, matchPair(css, open, '{', '}'))
  const height = body.match(/height:\s*([^;]+);/)
  if (!height) throw new Error(`Falta la altura de ${label}`)
  return height[1].trim()
}

function readCoarseHeight(css) {
  const start = css.indexOf('@media (pointer: coarse)')
  if (start < 0) throw new Error('Falta la regla del puntero grueso')
  const open = css.indexOf('{', start)
  const body = css.slice(open + 1, matchPair(css, open, '{', '}'))
  const heights = [...body.matchAll(/height:\s*([^;]+);/g)].map((match) => match[1].trim())
  if (heights.length === 0 || new Set(heights).size !== 1) {
    throw new Error('La altura del puntero grueso no es una sola')
  }
  return heights[0]
}

function readFocus(css) {
  const match = css.match(/:focus-visible\s*\{([^}]+)\}/)
  if (!match) throw new Error('Falta :focus-visible')
  const outline = match[1].match(/outline:\s*([^;]+);/)
  const offset = match[1].match(/outline-offset:\s*([^;]+);/)
  if (!outline || !offset) throw new Error('Falta el anillo de foco')
  return { outline: outline[1].trim(), offset: offset[1].trim() }
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n')
}

function generatedNote(file) {
  return `Sale de \`${repoPath(file)}\`.`
}

function slug(part) {
  return part
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function repoPath(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/')
}

function matchPair(text, openIndex, openChar, closeChar) {
  let depth = 0
  let quote = ''
  for (let index = openIndex; index < text.length; index++) {
    const char = text[index]
    if (quote) {
      if (char === '\\') {
        index++
        continue
      }
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === openChar) depth++
    else if (char === closeChar) {
      depth--
      if (depth === 0) return index
    }
  }
  throw new Error(`No cierra ${openChar}`)
}

function skipSpace(text, index) {
  let cursor = index
  while (text[cursor] === ' ' || text[cursor] === '\n' || text[cursor] === '\r' || text[cursor] === '\t') {
    cursor++
  }
  return cursor
}

function isVoid(tag) {
  return tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr'
}

function escapeAttr(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function escapeText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
}

function finish(text) {
  return `${text.trimEnd()}\n`
}

function fail(file, message) {
  const error = new Error(`${repoPath(file)}: ${message}`)
  error.file = file
  throw error
}

function writeOrCheck(files, check) {
  const expected = new Set(files.keys())
  const current = listMarkdown(guideRoot)
  const problems = []

  for (const [relative, content] of files) {
    const full = path.join(guideRoot, relative)
    if (!check) {
      fs.mkdirSync(path.dirname(full), { recursive: true })
      fs.writeFileSync(full, content)
      continue
    }
    const existing = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null
    if (existing !== content) problems.push(relative)
  }

  for (const relative of current) {
    if (expected.has(relative)) continue
    if (check) problems.push(`sobra ${relative}`)
    else fs.rmSync(path.join(guideRoot, relative))
  }

  if (!check) removeEmptyDirs(guideRoot)
  if (problems.length > 0) {
    console.error('La guía markdown no coincide con Storybook. Lanza `pnpm guide` desde docs/storybook.')
    for (const problem of problems) console.error(`- ${problem}`)
    process.exit(1)
  }
  if (check) console.log(`La guía coincide con Storybook: ${files.size} archivos`)
  else console.log(`Guía escrita: ${files.size} archivos en docs/guia`)
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return []
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...listMarkdown(full))
    else if (entry.name.endsWith('.md')) found.push(repoPath(full).slice('docs/guia/'.length))
  }
  return found
}

function removeEmptyDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(dir, entry.name)
    removeEmptyDirs(full)
    if (fs.readdirSync(full).length === 0) fs.rmdirSync(full)
  }
}
