const MAX_BYTES = 4 * 1024 * 1024
const MAX_DIMENSION = 2400

async function hasChunkTag(file: File, tag: string) {
  const bytes = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer())
  const code = Array.from(tag, (character) => character.charCodeAt(0))
  for (let index = 0; index <= bytes.length - code.length; index++) {
    if (code.every((value, offset) => bytes[index + offset] === value)) return true
  }
  return false
}

async function preserveAnimation(file: File) {
  if (file.type === 'image/gif') return true
  if (file.type === 'image/png') return hasChunkTag(file, 'acTL')
  if (file.type === 'image/webp') return hasChunkTag(file, 'ANIM')
  if (file.type === 'image/avif') return hasChunkTag(file, 'avis')
  return false
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const pixels = context.getImageData(0, 0, width, height).data
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 255) return true
  }
  return false
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Keep image processing local until the user presses Save. */
export async function prepareImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, WebP, GIF, or AVIF image.')
  }

  // Drawing an animated source onto canvas keeps only one frame.
  if (await preserveAnimation(file)) {
    if (file.size <= MAX_BYTES) return file
    throw new Error('Animated images over 4 MB cannot be resized safely. Choose a smaller file.')
  }

  let image: HTMLImageElement
  try { image = await loadImage(file) }
  catch {
    if (file.size <= MAX_BYTES) return file
    throw new Error('This browser cannot resize the image. Choose a file under 4 MB.')
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    if (file.size <= MAX_BYTES) return file
    throw new Error('This browser cannot prepare the image.')
  }
  context.drawImage(image, 0, 0, width, height)

  if (file.type === 'image/png') {
    let transparent = false
    try { transparent = hasTransparency(context, width, height) } catch { /* retain the source below if possible */ }
    if (transparent) {
      if (scale < 1) {
        const resizedPng = await toBlob(canvas, 'image/png')
        if (resizedPng && resizedPng.size <= MAX_BYTES &&
          (file.size > MAX_BYTES || resizedPng.size < file.size)) {
          return new File([resizedPng], file.name, { type: 'image/png' })
        }
      }
      if (file.size <= MAX_BYTES) return file
    }
  }

  let best: Blob | null = null
  for (const quality of [0.92, 0.84, 0.76, 0.68]) {
    const webp = await toBlob(canvas, 'image/webp', quality)
    if (!webp || webp.type !== 'image/webp') break
    if (!best || webp.size < best.size) best = webp
    if (webp.size <= MAX_BYTES) break
  }

  // Keep the source when it is already smaller. WebP keeps alpha, but retaining
  // a compact PNG also avoids unnecessary changes to transparent artwork.
  if (file.size <= MAX_BYTES && (!best || file.size <= best.size)) return file
  if (!best || best.size > MAX_BYTES) {
    throw new Error('Image is still over 4 MB after resizing. Choose a smaller image.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([best], `${baseName}.webp`, { type: 'image/webp' })
}
