import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check, User, Sparkles, Download, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '../../store/useStore'
import { copyToClipboard, getUserInitials } from '../../utils/helpers'

/**
 * Renders a single chat message with markdown support.
 * Handles user bubbles, assistant responses, streaming, and code blocks.
 */
export default function MessageBubble({ message, user }) {
  const { isDark } = useStore()
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming
  const isImageLoading = message.type === 'image-loading'
  const isImage = message.type === 'image'

  // Extract image URL from markdown if it's an image message
  const imageUrlMatch = isImage ? message.content.match(/!\[.*?\]\((.*?)\)/) : null
  const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null
  const promptMatch = isImage ? message.content.match(/\*\*Prompt:\*\*\s*(.+)/) : null
  const revisedPrompt = promptMatch ? promptMatch[1] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #0891b2 100%)' }}>
            {getUserInitials(user)}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isImage || isImageLoading ? 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }}>
            {isImage || isImageLoading ? <Wand2 size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

        {/* Image generation loading state */}
        {isImageLoading && (
          <div className="px-4 py-4 rounded-2xl rounded-tl-sm"
            style={{ background: 'var(--assistant-bubble)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
                <Wand2 size={16} className="absolute inset-0 m-auto" style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generating your image…</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>DALL·E 3 is painting. This takes ~15 seconds.</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden" style={{ background: 'var(--bg-tertiary)', height: '180px' }}>
              <div className="h-full w-full shimmer" />
            </div>
          </div>
        )}

        {/* Rendered generated image */}
        {isImage && imageUrl && (
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl rounded-tl-sm overflow-hidden relative group/img"
              style={{ border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 4px 24px rgba(124,58,237,0.15)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="AI Generated"
                className="w-full max-w-sm object-cover"
                style={{ display: 'block' }}
              />
              {/* Download overlay */}
              <a
                href={imageUrl}
                download="nexus-ai-generated.png"
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}
              >
                <Download size={12} />
                Save
              </a>
            </div>
            {revisedPrompt && (
              <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: '#a78bfa' }}>✨ Prompt:</span> {revisedPrompt}
              </p>
            )}
          </div>
        )}

        {/* Regular text bubble (not for image types) */}
        {!isImageLoading && !isImage && (
          <div
            className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
            }`}
            style={{
              background: isUser ? 'var(--user-bubble)' : 'var(--assistant-bubble)',
              color: isUser ? 'var(--user-bubble-text)' : 'var(--assistant-bubble-text)',
              border: isUser ? 'none' : '1px solid var(--border)',
              boxShadow: isUser ? '0 2px 12px rgba(20,184,166,0.2)' : 'var(--shadow)',
            }}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose-chat">
                {isStreaming && !message.content ? (
                  <TypingIndicator />
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const lang = match ? match[1] : ''
                        const code = String(children).replace(/\n$/, '')

                        if (!inline && lang) {
                          return (
                            <CodeBlock code={code} language={lang} isDark={isDark} />
                          )
                        }
                        return <code className={className} {...props}>{children}</code>
                      },
                      pre({ children }) {
                        return <div>{children}</div>
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
                {/* Streaming cursor */}
                {isStreaming && message.content && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 -mb-0.5 rounded animate-pulse"
                    style={{ background: 'var(--accent)', verticalAlign: 'middle' }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Copy button */}
        {!isStreaming && !isImageLoading && !isImage && message.content && (
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'self-end' : 'self-start'}`}>
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

// ─── Code Block with Copy ────────────────────────────────────────────────────

function CodeBlock({ code, language, isDark }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: isDark ? '#0d1421' : '#f0f4f8', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all"
          style={{
            color: copied ? 'var(--accent)' : 'var(--text-muted)',
            background: copied ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          background: isDark ? '#0a0f1a' : '#f8fafc',
          padding: '16px',
        }}
        showLineNumbers={code.split('\n').length > 5}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(text)
    setCopied(true)
    toast.success('Copied to clipboard', { duration: 1500 })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all"
      style={{
        color: copied ? 'var(--accent)' : 'var(--text-muted)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
