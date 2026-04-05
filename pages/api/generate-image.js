/**
 * POST /api/generate-image
 * Step 1: Enhance the prompt using Gemini for accuracy.
 * Step 2: Generate the image using Pollinations.ai (free, no key needed).
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

  let enhancedPrompt = prompt.trim()

  // Step 1: Use Gemini to enhance the prompt into a detailed image description
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert image prompt engineer. Convert the following user request into a highly detailed, accurate image generation prompt. Be specific about: exact model details, colors, materials, lighting, camera angle, background, photorealistic style. Return ONLY the enhanced prompt, nothing else, no explanations.\n\nUser request: ${prompt.trim()}`
              }]
            }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
          })
        }
      )

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json()
        const improved = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (improved) enhancedPrompt = improved
      }
    } catch (e) {
      // If Gemini fails, fall through with original prompt
      console.warn('Gemini prompt enhancement failed, using original:', e.message)
    }
  }

  // Step 2: Generate image with Pollinations using the enhanced prompt
  const encoded = encodeURIComponent(enhancedPrompt)
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`

  try {
    const imgResponse = await fetch(pollinationsUrl)

    if (!imgResponse.ok) {
      throw new Error(`Pollinations returned status ${imgResponse.status}`)
    }

    const buffer = await imgResponse.arrayBuffer()
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    return res.status(200).json({
      imageUrl: dataUrl,
      revisedPrompt: enhancedPrompt,
    })
  } catch (err) {
    console.error('Image generation error:', err)
    return res.status(500).json({ error: 'Failed to generate image. Please try again.' })
  }
}

export const config = {
  api: { responseLimit: '10mb' },
}


