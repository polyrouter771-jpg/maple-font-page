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

let mapleKRLoad: Promise<void> | undefined

/** Load the official Maple Mono NF-KR files prepared during the site build. */
export function loadMapleMonoKR(): Promise<void> {
  if (mapleKRLoad) return mapleKRLoad

  mapleKRLoad = (async () => {
    const fontBase = `${import.meta.env.BASE_URL}fonts/`
    const manifestResponse = await fetch(`${fontBase}maple-mono-kr.json`)
    if (!manifestResponse.ok) {
      throw new Error('Maple Mono KR assets are missing. Run the site build or dev command first.')
    }
    const manifest: { italic: boolean } = await manifestResponse.json()

    const faces = [
      new FontFace(
        'MapleMonoKR',
        `url('${fontBase}MapleMonoKR-VF.ttf') format('truetype')`,
        { display: 'swap', style: 'normal', weight: '100 900' },
      ),
    ]
    if (manifest.italic) {
      faces.push(new FontFace(
        'MapleMonoKR',
        `url('${fontBase}MapleMonoKR-Italic-VF.ttf') format('truetype')`,
        { display: 'swap', style: 'italic', weight: '100 900' },
      ))
    }

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
    if (existingEl) existingEl.remove()

    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load ${href}`))
    document.head.append(el)
  })
}
