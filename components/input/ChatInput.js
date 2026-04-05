import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip, Mic, Square, ArrowUp,
  Loader2, X, FileText, Image as ImageIcon, AlertCircle, Wand2
} from 'lucide-react'
import useStore from '../../store/useStore'
import toast from 'react-hot-toast'

/**
 * ChatInput — the message composition area.
 * Features: auto-resize textarea, send on Enter, real file attachments, real voice input.
 */
export default function ChatInput({ onSend, onGenerateImage, disabled }) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([]) // { name, type, content, preview }
  const [micSupported, setMicSupported] = useState(true)
  const [imageMode, setImageMode] = useState(false)

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const { isStreaming } = useStore()

  // Check mic support & set up Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setInput(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow microphone access.')
      } else {
        toast.error('Voice recognition failed. Please try again.')
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [])

  // Listen for suggestion clicks from WelcomeScreen
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail)
      textareaRef.current?.focus()
    }
    window.addEventListener('nexus:suggestion', handler)
    return () => window.removeEventListener('nexus:suggestion', handler)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [input])

  // --- File Processing ---
  const processFile = useCallback((file) => {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith('image/')
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')

      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: 'image',
            mimeType: file.type,
            content: e.target.result, // base64 data URL
            preview: e.target.result,
          })
        }
        reader.readAsDataURL(file)
      } else if (isText) {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: 'text',
            content: e.target.result,
            preview: null,
          })
        }
        reader.readAsText(file)
      } else {
        // Unsupported file type - just mention the name
        resolve({
          name: file.name,
          type: 'unsupported',
          content: null,
          preview: null,
        })
      }
    })
  }, [])

  const addFiles = useCallback(async (files) => {
    const MAX_FILES = 3
    const remaining = MAX_FILES - attachedFiles.length
    const toProcess = Array.from(files).slice(0, remaining)

    if (toProcess.length === 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const processed = await Promise.all(toProcess.map(processFile))
    setAttachedFiles(prev => [...prev, ...processed])

    // Check for unsupported
    processed.forEach(f => {
      if (f.type === 'unsupported') {
        toast(`"${f.name}" will be referenced by name only`, { icon: '⚠️' })
      }
    })
  }, [attachedFiles, processFile])

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // --- Send ---
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if ((!trimmed && attachedFiles.length === 0) || isStreaming || disabled) return

    // Image mode: route to DALL·E generator
    if (imageMode) {
      if (!trimmed) {
        toast.error('Please describe the image you want to generate')
        return
      }
      onGenerateImage?.(trimmed)
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      return
    }

    // Build the message content
    let content = trimmed

    // Append text file contents inline
    const textFiles = attachedFiles.filter(f => f.type === 'text')
    if (textFiles.length > 0) {
      content += '\n\n' + textFiles.map(f =>
        `--- File: ${f.name} ---\n${f.content}`
      ).join('\n\n')
    }

    // Append unsupported file names
    const unsupported = attachedFiles.filter(f => f.type === 'unsupported')
    if (unsupported.length > 0) {
      content += '\n\n[Attached files: ' + unsupported.map(f => f.name).join(', ') + ']'
    }

    // Images passed separately as attachments
    const images = attachedFiles.filter(f => f.type === 'image')

    onSend(content || '[Image attached]', images)
    setInput('')
    setAttachedFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, attachedFiles, isStreaming, disabled, onSend, onGenerateImage, imageMode])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // --- Drag & Drop ---
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  // --- Microphone ---
  const handleVoice = () => {
    if (!micSupported) {
      toast.error('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = recognitionRef.current
    if (!recognition) return

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setInput('')
      recognition.start()
      setIsRecording(true)
      toast('Listening… speak now', { icon: '🎙️', duration: 2000 })
    }
  }

  const canSend = (input.trim().length > 0 || attachedFiles.length > 0) && !isStreaming && !disabled

  return (
    <div className="shrink-0 p-3 md:p-4">
      {/* Drop zone overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(20,184,166,0.08)',
              border: '2px dashed var(--accent)',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--accent)' }}>Drop files here</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,text/*,.md,.json,.csv,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
      />

      {/* Input container */}
      <div
        className="relative max-w-3xl mx-auto rounded-2xl transition-all duration-200 input-glow"
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
          boxShadow: 'var(--shadow)',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Streaming indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute -top-7 left-0 flex items-center gap-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <Loader2 size={11} className="animate-spin" style={{ color: 'var(--accent)' }} />
              Nexus is responding...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top action row */}
        <div className="flex items-center gap-1 px-3 pt-2.5">
          {/* Image mode toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setImageMode(m => !m)}
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: imageMode ? 'rgba(20,184,166,0.15)' : 'transparent',
              color: imageMode ? 'var(--accent)' : 'var(--text-muted)',
              border: imageMode ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!imageMode) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--accent)' } }}
            onMouseLeave={e => { if (!imageMode) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            title="Toggle image generation mode"
          >
            <Wand2 size={13} />
            <span>Image</span>
          </motion.button>

          {/* Attachment button — hidden in image mode */}
          {!imageMode && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: attachedFiles.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = attachedFiles.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
              title="Attach image or text file"
            >
              <Paperclip size={15} />
            </motion.button>
          )}

          {/* File count badge */}
          {attachedFiles.length > 0 && !imageMode && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(20,184,166,0.15)', color: 'var(--accent)' }}
            >
              {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''}
            </span>
          )}

          {/* Image mode label */}
          {imageMode && (
            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
              Pollinations AI · describe your image
            </span>
          )}
        </div>

        {/* Attached file previews */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 px-3 py-2"
            >
              {attachedFiles.map((file, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs relative"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)' }}
                >
                  {/* Thumbnail or icon */}
                  {file.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : file.type === 'text' ? (
                    <FileText size={16} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                  )}
                  <span
                    className="max-w-[80px] truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-red-500/20 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording ? '🎙️ Listening… speak now'
            : imageMode ? '✨ Describe the image you want to generate…'
            : 'Message Nexus…'
          }
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-2 resize-none outline-none text-sm leading-relaxed"
          style={{
            background: 'transparent',
            color: isRecording ? 'var(--accent)' : imageMode ? '#a78bfa' : 'var(--text-primary)',
            minHeight: '40px',
            maxHeight: '200px',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {/* Bottom action row */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          {/* Voice button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleVoice}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: isRecording ? 'rgba(239,68,68,0.1)' : 'transparent',
              color: isRecording ? '#ef4444' : micSupported ? 'var(--text-muted)' : 'var(--text-muted)',
              opacity: micSupported ? 1 : 0.4,
            }}
            onMouseEnter={e => { if (!isRecording && micSupported) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--accent)' } }}
            onMouseLeave={e => { if (!isRecording) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            title={micSupported ? (isRecording ? 'Stop recording' : 'Voice input') : 'Voice not supported in this browser'}
          >
            {isRecording ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <Square size={13} fill="currentColor" />
              </motion.div>
            ) : (
              <Mic size={15} />
            )}
          </motion.button>

          <div className="flex items-center gap-2">
            {/* Keyboard hint */}
            {input.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ↵ send · ⇧↵ newline
              </span>
            )}

            {/* Send button */}
            <motion.button
              whileHover={{ scale: canSend ? 1.05 : 1 }}
              whileTap={{ scale: canSend ? 0.95 : 1 }}
              onClick={handleSend}
              disabled={!canSend}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: canSend
                  ? imageMode
                    ? 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)'
                    : 'linear-gradient(135deg, var(--accent) 0%, #0891b2 100%)'
                  : 'var(--bg-tertiary)',
                color: canSend ? '#fff' : 'var(--text-muted)',
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend
                  ? imageMode ? '0 2px 12px rgba(124,58,237,0.4)' : '0 2px 12px rgba(20,184,166,0.3)'
                  : 'none',
              }}
            >
              {isStreaming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : imageMode ? (
                <Wand2 size={14} />
              ) : (
                <ArrowUp size={14} strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Nexus can make mistakes. Consider verifying important info.
      </p>
    </div>
  )
}
