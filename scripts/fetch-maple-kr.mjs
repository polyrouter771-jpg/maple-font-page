import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = join(root, 'public', 'fonts')
const regularPath = join(outputDirectory, 'MapleMonoKR-VF.ttf')
const italicPath = join(outputDirectory, 'MapleMonoKR-Italic-VF.ttf')
const manifestPath = join(outputDirectory, 'maple-mono-kr.json')
const sourceVersion = 'v8.0-beta.3'
const archiveUrl = `https://github.com/subframe7536/maple-font/releases/download/${sourceVersion}/MapleMono-NF-KR-VF.zip`

function findEndOfCentralDirectory(archive) {
  const minimum = Math.max(0, archive.length - 65_557)
  for (let offset = archive.length - 22; offset >= minimum; offset--) {
    if (
      archive.readUInt32LE(offset) === 0x06054B50
      && offset + 22 + archive.readUInt16LE(offset + 20) === archive.length
    ) {
      return offset
    }
  }
  throw new Error('Invalid Maple Mono KR ZIP: end of central directory not found.')
}

function extractFontEntries(archive) {
  const endOffset = findEndOfCentralDirectory(archive)
  const entryCount = archive.readUInt16LE(endOffset + 10)
  let cursor = archive.readUInt32LE(endOffset + 16)
  let regular
  let italic

  for (let index = 0; index < entryCount; index++) {
    if (archive.readUInt32LE(cursor) !== 0x02014B50) {
      throw new Error('Invalid Maple Mono KR ZIP: malformed directory entry.')
    }

    const flags = archive.readUInt16LE(cursor + 8)
    const method = archive.readUInt16LE(cursor + 10)
    const compressedSize = archive.readUInt32LE(cursor + 20)
    const nameLength = archive.readUInt16LE(cursor + 28)
    const extraLength = archive.readUInt16LE(cursor + 30)
    const commentLength = archive.readUInt16LE(cursor + 32)
    const localOffset = archive.readUInt32LE(cursor + 42)
    const name = archive.toString('utf8', cursor + 46, cursor + 46 + nameLength)

    if (/\.ttf$/i.test(name) && /KR/i.test(name)) {
      if (flags & 0x1) throw new Error(`Encrypted font entry is not supported: ${name}`)

      const localNameLength = archive.readUInt16LE(localOffset + 26)
      const localExtraLength = archive.readUInt16LE(localOffset + 28)
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize)
      const font = method === 0
        ? Buffer.from(compressed)
        : method === 8
          ? inflateRawSync(compressed)
          : null

      if (!font) throw new Error(`Unsupported ZIP compression method ${method} for ${name}`)
      if (/italic/i.test(name)) italic = font
      else if (!regular) regular = font
    }

    cursor += 46 + nameLength + extraLength + commentLength
  }

  if (!regular) {
    throw new Error('Official Maple Mono NF-KR variable TTF was not found in the release archive.')
  }

  return { regular, italic }
}

async function main() {
  if (existsSync(regularPath) && existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (manifest.sourceVersion === sourceVersion) {
      console.log(`Maple Mono KR ${sourceVersion} is already prepared.`)
      return
    }
  }

  console.log(`Downloading official Maple Mono KR ${sourceVersion}…`)
  const response = await fetch(archiveUrl)
  if (!response.ok) {
    throw new Error(`Maple Mono KR download failed: HTTP ${response.status}`)
  }

  const { regular, italic } = extractFontEntries(Buffer.from(await response.arrayBuffer()))
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(regularPath, regular)
  if (italic) writeFileSync(italicPath, italic)
  else if (existsSync(italicPath)) rmSync(italicPath)

  writeFileSync(manifestPath, JSON.stringify({
    sourceVersion,
    italic: Boolean(italic),
  }, null, 2) + '\n')

  console.log(`Prepared Maple Mono KR: ${(regular.length / 1024 / 1024).toFixed(1)} MB regular${italic ? ' + italic' : ''}.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
