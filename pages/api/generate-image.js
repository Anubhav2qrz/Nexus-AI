/**
 * POST /api/generate-image
 * Generates an image using Pollinations.ai — completely free, no API key required.
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
  // Pollinations.ai: free image generation, no API key needed
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`

  return res.status(200).json({ imageUrl, revisedPrompt: prompt.trim() })
}
