import OpenAI from 'openai'

/**
 * POST /api/chat
 * 
 * Streams AI responses from multiple providers.
 * For Google, we use a direct fetch to bypass SDK versioning issues.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let { messages, model = 'gemini-2.5-flash', systemPrompt, images = [] } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages array' })
  }

  // Normalize model string
  model = String(model || 'gpt-4o').trim().toLowerCase()

  // Model mapping: normalize all Gemini model names to ones available for this key
  const modelMapping = {
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-flash',
    'gemini-1.5-flash-latest': 'gemini-2.5-flash',
    'gemini-1.5-pro-latest': 'gemini-2.5-flash',
    'gemini-pro': 'gemini-2.5-flash',
  }

  if (modelMapping[model]) {
    model = modelMapping[model]
  } else if (model.startsWith('gemini-') && !model.includes('2.5')) {
    // Catch-all: remap any unknown gemini model to the working one
    model = 'gemini-2.5-flash'
  }

  const isGoogle = model.startsWith('gemini-')
  const apiKey = isGoogle ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY

  if (!apiKey || apiKey.includes('your-')) {
    return res.status(500).json({ error: 'API key not configured.' })
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  try {
    if (isGoogle) {
      /**
       * --- Google Gemini Direct Fetch (No SDK) ---
       * This is the most robust way to avoid 404/400 errors.
       */
      const systemMsg = systemPrompt || 'You are Nexus, a helpful AI assistant.'
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

      // Prepend system prompt to the first user message
      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = `${systemMsg}\n\n${contents[0].parts[0].text}`
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

      // Add image parts to the last user message if any images were attached
      if (images && images.length > 0) {
        const lastContent = contents[contents.length - 1]
        if (lastContent && lastContent.role === 'user') {
          images.forEach(img => {
            // Strip data URL prefix (e.g. "data:image/jpeg;base64,")
            const base64 = img.data.includes(',') ? img.data.split(',')[1] : img.data
            lastContent.parts.push({
              inlineData: { mimeType: img.mimeType, data: base64 }
            })
          })
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.7 } })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Google API error ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.replace('data: ', ''))
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                const standardizedChunk = { choices: [{ delta: { content: text }, finish_reason: null }] }
                res.write(`data: ${JSON.stringify(standardizedChunk)}\n\n`)
              }
            } catch (e) { /* skip partial lines */ }
          }
        }
      }
      
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\n\n`)
      res.write('data: [DONE]\n\n')

    } else {
      /**
       * --- OpenAI Implementation ---
       */
      const client = new OpenAI({ apiKey })
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are Nexus, a helpful AI assistant.' },
          ...messages
        ],
        stream: true,
      })

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        if (chunk.choices[0]?.finish_reason === 'stop') {
          res.write('data: [DONE]\n\n')
        }
      }
    }

    res.end()
  } catch (error) {
    console.error('API error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    }
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
}
