/**
 * POST /api/generate-image
 * Generates an image using Pollinations.ai — completely free, no API key required.
 * We fetch the image server-side so we wait for it to be ready before returning.
 * Body: { prompt: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'A prompt is required to generate an image.' })
  }

  const encoded = encodeURIComponent(prompt.trim())
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`

  try {
    // Fetch the image and wait for Pollinations to fully generate it
    const imgResponse = await fetch(pollinationsUrl)

    if (!imgResponse.ok) {
      throw new Error(`Pollinations returned status ${imgResponse.status}`)
    }

    const buffer = await imgResponse.arrayBuffer()
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    return res.status(200).json({ imageUrl: dataUrl, revisedPrompt: prompt.trim() })
  } catch (err) {
    console.error('Image generation error:', err)
    return res.status(500).json({ error: 'Failed to generate image. Please try again.' })
  }
}

export const config = {
  api: { responseLimit: '10mb' },
}

