import { unzipSync } from 'fflate'

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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/**
 * Load the official Maple Mono NF-KR variable package on demand.
 * The KR build is distributed as an archive by the upstream project, so
 * extract its variable TTF files in-browser and register them as FontFace objects.
 */
export function loadMapleMonoKR(): Promise<void> {
  if (mapleKRLoad) {
    return mapleKRLoad
  }

  mapleKRLoad = (async () => {
    const response = await fetch(MAPLE_KR_ARCHIVE)
    if (!response.ok) {
      throw new Error(`Maple Mono KR download failed: ${response.status}`)
    }

    const archive = new Uint8Array(await response.arrayBuffer())
    const entries = Object.entries(unzipSync(archive))
      .filter(([name]) => /\.ttf$/i.test(name))

    const regular = entries.find(([name]) =>
      /MapleMono-NF-KR(?:\[wght\])?-VF\.ttf$/i.test(name),
    )?.[1]
    const italic = entries.find(([name]) =>
      /MapleMono-NF-KR-Italic\[wght\]-VF\.ttf$/i.test(name),
    )?.[1]

    if (!regular) {
      throw new Error('The official Maple Mono KR variable font was not found in the archive.')
    }

    const faces = [
      new FontFace('MapleMonoKR', toArrayBuffer(regular), {
        display: 'swap',
        style: 'normal',
        weight: '100 900',
      }),
      new FontFace('MapleMonoKR', toArrayBuffer(italic ?? regular), {
        display: 'swap',
        style: 'italic',
        weight: '100 900',
      }),
    ]

    await Promise.all(faces.map(face => face.load()))
    faces.forEach(face => document.fonts.add(face))
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

    if (existingEl) {
      existingEl.remove()
    }

    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href

    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load ${href}`))

    document.head.append(el)
  })
}
