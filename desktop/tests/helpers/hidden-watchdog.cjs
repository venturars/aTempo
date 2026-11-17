/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type -- Independent test watchdog. */
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const [directory, parent] = process.argv.slice(2)
let pid
const owned = new Set()
let stopping = false
let failure
function record(event, detail) {
  fs.appendFileSync(
    `${directory}/foreground.jsonl`,
    JSON.stringify({ time: Date.now(), event, detail }) + '\n'
  )
}
function alive(target) {
  try {
    process.kill(target, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') return false
    throw error
  }
}
function observe() {
  const front = execFileSync('/usr/bin/lsappinfo', ['front'], {
    timeout: 1500,
    encoding: 'utf8'
  }).trim()
  if (!front.startsWith('ASN:')) throw new Error('Missing frontmost ASN')
  const info = execFileSync('/usr/bin/lsappinfo', ['info', '-only', 'pid', '-app', front], {
    timeout: 1500,
    encoding: 'utf8'
  })
  const match = info.match(/"pid"\s*=\s*(\d+)/)
  if (!match) throw new Error('Missing frontmost PID')
  const foreground = Number(match[1])
  record('foreground', foreground)
  if (pid && foreground === pid) throw new Error('Own Electron PID reached foreground')
}
function descendants() {
  const rows = execFileSync('/bin/ps', ['-axo', 'pid=,ppid=,stat='], {
    timeout: 1500,
    encoding: 'utf8'
  })
    .trim()
    .split('\n')
    .map((row) => row.trim().split(/\s+/))
  if (pid) owned.add(pid)
  let changed = true
  while (changed) {
    changed = false
    for (const [child, parent] of rows) {
      if (owned.has(Number(parent)) && !owned.has(Number(child))) {
        owned.add(Number(child))
        changed = true
      }
    }
  }
  return rows
    .filter(([child, , state]) => owned.has(Number(child)) && !state.startsWith('Z'))
    .map(([child]) => Number(child))
}
function stop(reason) {
  if (reason && !failure) {
    failure = reason
    record('failure', reason)
    fs.writeFileSync(`${directory}/failure`, reason)
  }
  stopping = true
  const remaining = descendants()
  for (const child of remaining) {
    try {
      process.kill(child, 'SIGKILL')
      record('killed-owned-pid', child)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
  if (!remaining.length) {
    record('exit-confirmed', [...owned])
    process.exit(failure ? 1 : 0)
  }
}
const started = Date.now()
function tick() {
  try {
    if (!pid && fs.existsSync(`${directory}/pid`)) {
      const value = fs.readFileSync(`${directory}/pid`, 'utf8').trim()
      if (!/^\d+$/.test(value) || Number(value) <= 1) throw new Error('Invalid owned PID')
      pid = Number(value)
      record('owned-pid', pid)
    }
    if (stopping) {
      stop()
      return
    }
    descendants()
    observe()
    if (fs.existsSync(`${directory}/close-request`) || (pid && !alive(pid))) {
      stop()
      return
    }
    if (!alive(Number(parent)) || Date.now() - started > 120000)
      throw new Error('Worker exited or watchdog deadline')
    if (!fs.existsSync(`${directory}/ready`)) fs.writeFileSync(`${directory}/ready`, 'ready')
  } catch (error) {
    stop(error.message)
  }
}
tick()
setInterval(tick, 25)
