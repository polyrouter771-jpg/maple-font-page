import { fontPrefix } from './constant'

function getMapleMonoFontFace(italic: boolean) {
  const suffix = italic ? 'Italic' : 'Regular'
  const src = [
    `url('${fontPrefix}/MapleMono${italic ? '-Italic' : ''}[wght]-VF.woff2') format('woff2-variations')`,
    `local("MapleMono-${suffix}")`,
    `local("Maple Mono ${suffix}")`,
    `local("Maple Mono")`,
    `local("MapleMono-CN-${suffix}")`,
    `local("Maple Mono CN ${suffix}")`,
    `local("Maple Mono CN")`,
    `local("MapleMono-NF-${suffix}")`,
    `local("Maple Mono NF ${suffix}")`,
    `local("Maple Mono NF")`,
    `local("MapleMono-NF-CN-${suffix}")`,
    `local("Maple Mono NF CN ${suffix}")`,
    `local("Maple Mono NF CN")`,
  ].join(',')
  return new FontFace('MapleMono', src, {
    display: 'swap',
    style: italic ? 'italic' : 'normal',
    weight: '100 900',
  })
}

export async function loadMapleMono() {
  const face = await Promise.all([
    getMapleMonoFontFace(false).load(),
    getMapleMonoFontFace(true).load(),
  ])
  face.forEach(f => document.fonts.add(f))
}

const MAPLE_KR_ARCHIVE = 'https://github.com/subframe7536/maple-font/releases/download/v8.0-beta.3/MapleMono-NF-KR-VF.zip'
let mapleKRLoad: Promise<void> | undefined

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true)
}

async function extractZipEntry(
  archive: Uint8Array,
  view: DataView,
  localOffset: number,
  compressedSize: number,
  method: number,
): Promise<ArrayBuffer> {
  const nameLength = readU16(view, localOffset + 26)
  const extraLength = readU16(view, localOffset + 28)
  const start = localOffset + 30 + nameLength + extraLength
  const compressed = archive.subarray(start, start + compressedSize)

  if (method === 0) return compressed.slice().buffer
  if (method !== 8) throw new Error(`Unsupported Maple Mono KR ZIP compression method: ${method}`)

  const stream = new Blob([compressed]).stream().pipeThrough(
    new DecompressionStream('deflate-raw'),
  )
  return new Response(stream).arrayBuffer()
}

async function loadKRFromArchive(buffer: ArrayBuffer) {
  const archive = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let endOffset = -1

  for (let offset = Math.max(0, archive.length - 65_557); offset <= archive.length - 22; offset++) {
    if (readU32(view, offset) === 0x06054B50) endOffset = offset
  }
  if (endOffset < 0) throw new Error('The Maple Mono KR archive is invalid (ZIP directory not found).')

  const entries = readU16(view, endOffset + 10)
  let cursor = readU32(view, endOffset + 16)
  let regular: ArrayBuffer | undefined
  let italic: ArrayBuffer | undefined

  for (let index = 0; index < entries; index++) {
    if (readU32(view, cursor) !== 0x02014B50) {
      throw new Error('The Maple Mono KR archive contains an invalid directory entry.')
    }
    const method = readU16(view, cursor + 10)
    const compressedSize = readU32(view, cursor + 20)
    const nameLength = readU16(view, cursor + 28)
    const extraLength = readU16(view, cursor + 30)
    const commentLength = readU16(view, cursor + 32)
    const localOffset = readU32(view, cursor + 42)
    const name = new TextDecoder().decode(archive.subarray(cursor + 46, cursor + 46 + nameLength))

    if (/\.ttf$/i.test(name) && /KR/i.test(name) && /VF/i.test(name)) {
      const font = await extractZipEntry(archive, view, localOffset, compressedSize, method)
      if (/italic/i.test(name)) italic = font
      else if (!regular) regular = font
    }
    cursor += 46 + nameLength + extraLength + commentLength
  }

  if (!regular) throw new Error('The official Maple Mono KR variable font was not found in the archive.')

  const faces = [
    new FontFace('MapleMonoKR', regular, { display: 'swap', style: 'normal', weight: '100 900' }),
  ]
  if (italic) {
    faces.push(new FontFace('MapleMonoKR', italic, { display: 'swap', style: 'italic', weight: '100 900' }))
  }
  await Promise.all(faces.map(face => face.load()))
  faces.forEach(face => document.fonts.add(face))
}

/** Load the official Maple Mono NF-KR variable package and register its fonts. */
export function loadMapleMonoKR(): Promise<void> {
  if (mapleKRLoad) return mapleKRLoad

  mapleKRLoad = (async () => {
    const response = await fetch(MAPLE_KR_ARCHIVE)
    if (!response.ok) throw new Error(`Maple Mono KR download failed: ${response.status}`)
    await loadKRFromArchive(await response.arrayBuffer())
  })().catch((error) => {
    mapleKRLoad = undefined
    throw error
  })
  return mapleKRLoad
}

export function getCNFromRemote(italic: boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const entry = italic ? 'italic' : 'main'
    const href = `https://fontsapi.zeoseven.com/442/${entry}/result.css`
    const existingEl = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null
    if (existingEl) existingEl.remove()

    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load ${href}`))
    document.head.append(el)
  })
}
