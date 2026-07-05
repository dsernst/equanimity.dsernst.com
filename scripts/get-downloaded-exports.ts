import { renameSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'

const EXPORTS_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}\.tsv$/ // eg `2026-06-19T17_07_29.tsv`
const DownloadsDir = join(homedir(), 'Downloads')
const LogsDir = join(process.cwd(), 'logs')

// Get list of export TSVs in ~/Downloads
const tsvs = readdirSync(DownloadsDir)
  .filter((name) => EXPORTS_REGEX.test(name))
  .map((name) => join(DownloadsDir, name))

// Move from ~/Downloads to ./logs
for (const src of tsvs) {
  const dest = join(LogsDir, basename(src))
  if (existsSync(dest)) continue
  renameSync(src, dest)
  console.log(`moved ${basename(src)}`)
}

// Print if none
if (tsvs.length === 0) console.log('no new exports in ~/Downloads')
