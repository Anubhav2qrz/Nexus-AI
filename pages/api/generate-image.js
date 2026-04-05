import OpenAI from 'openai'

/**
 * POST /api/generate-image
 * Generates an image using OpenAI DALL·E 3.
 * Body: { prompt: string, size?: string, quality?: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, size = '1024x1024', quality = 'standard' } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'A prompt is required to generate an image.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.includes('your-')) {
    return res.status(500).json({
      error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.',
    })
  }

  try {
    const client = new OpenAI({ apiKey })

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size,         // '1024x1024' | '1792x1024' | '1024x1792'
      quality,      // 'standard' | 'hd'
      response_format: 'url',
    })

    const imageUrl = response.data[0]?.url
    const revisedPrompt = response.data[0]?.revised_prompt

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    return res.status(200).json({ imageUrl, revisedPrompt })
  } catch (err) {
    console.error('Image generation error:', err)
    const message = err?.error?.message || err?.message || 'Image generation failed'
    return res.status(500).json({ error: message })
  }
}
