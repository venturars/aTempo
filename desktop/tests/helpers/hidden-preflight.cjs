/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type -- Standalone fail-closed test preflight. */
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '../..')
function preflight() {
  for (const file of ['src/main/index.ts', 'out/main/index.js']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    let constructors = 0
    function inspect(node) {
      if (
        ts.isNewExpression(node) &&
        node.expression.getText(tree) !== 'node_sqlite.DatabaseSync'
      ) {
        if (!['BrowserWindow', 'electron.BrowserWindow'].includes(node.expression.getText(tree))) {
          throw new Error(`Unreviewed constructor in ${file}`)
        }
        constructors++
        const options = node.arguments?.[0]
        if (!options || !ts.isObjectLiteralExpression(options))
          throw new Error('Nonliteral window options')
        let shows = 0
        for (const property of options.properties) {
          if (ts.isSpreadAssignment(property)) {
            const compact = property.expression
              .getText(tree)
              .replace(/\s|[()]/g, '')
              .replaceAll('"', "'")
            if (!/^process\.platform==='linux'\?\{icon(?::icon_default)?\}:\{\}$/.test(compact))
              throw new Error(`Unreviewed spread ${file}`)
          } else if (property.name?.getText(tree) === 'show') {
            shows++
            if (
              !ts.isPropertyAssignment(property) ||
              property.initializer.kind !== ts.SyntaxKind.FalseKeyword
            )
              throw new Error('Window must start hidden')
          }
        }
        if (shows !== 1) throw new Error('Expected exactly one show:false')
      }
      ts.forEachChild(node, inspect)
    }
    inspect(tree)
    if (
      constructors !== 1 ||
      /paintWhenInitiallyHidden|BaseWindow|WebContentsView|openDevTools/.test(text)
    )
      throw new Error(`Unreviewed window path in ${file}`)
  }
}
module.exports = { preflight }
if (require.main === module) {
  preflight()
  console.log('Hidden source/build preflight passed')
}
