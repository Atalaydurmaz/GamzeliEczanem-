'use client'

import { useState, useRef, useEffect } from 'react'

const GREETING = 'Merhaba! Ben Gamzelieczanem eczacı asistanınızım. Size nasıl yardımcı olabilirim?'

// Kısa tag'ler yerine sohbeti başlatmaya yardımcı 2 açıklayıcı öneri.
const SUGGESTIONS = [
  'Cilt tipime uygun nemlendirici önerir misin?',
  'Güneş koruyucu seçerken nelere dikkat etmeliyim?',
]

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Mobil klavye açıldığında alt kenardan ne kadar kapatıldığı (px).
  const [kbInset, setKbInset] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, isOpen])

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('openChatBot', handler)
    return () => window.removeEventListener('openChatBot', handler)
  }, [])

  // 2 sn sonra göster, 10 sn sonra gizle — her oturumda bir kez
  useEffect(() => {
    const seen = sessionStorage.getItem('chatbot_bubble_seen')
    if (seen) return
    const show = setTimeout(() => setShowBubble(true), 2000)
    const hide = setTimeout(() => {
      setShowBubble(false)
      sessionStorage.setItem('chatbot_bubble_seen', '1')
    }, 12000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [])

  // Visual Viewport API — mobil klavye açılınca chat penceresini yukarı kaydır.
  // iOS/Android Safari + Chrome bu API'yi destekler. Fallback: kbInset = 0.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKbInset(inset)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      setKbInset(0)
    }
  }, [isOpen])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    // API'ye gönderilecek mesajlar: ilk asistan selamını atla, user ile başla
    const firstUserIdx = updatedMessages.findIndex((m) => m.role === 'user')
    const apiMessages = updatedMessages.slice(firstUserIdx)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) throw new Error('API hatası')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const isStreaming =
    isLoading && messages[messages.length - 1]?.role === 'assistant'

  const dismissBubble = () => {
    setShowBubble(false)
    sessionStorage.setItem('chatbot_bubble_seen', '1')
  }

  // Klavye açıkken chat penceresini klavyenin hemen üstüne yasla.
  // Kapalıyken sabit bottom-24 (96px) pozisyonunu koru.
  const kbOpen = kbInset > 50
  const chatBottom = kbOpen ? `${kbInset + 8}px` : undefined
  // Yükseklik: dvh (dynamic viewport height) klavye açılınca zaten küçülür;
  // üstüne klavye payını da düşerek overflow engellenir.
  const chatMaxHeight = kbOpen
    ? `calc(100dvh - ${kbInset + 24}px)`
    : 'min(50dvh, 420px)'

  return (
    <>
      {/* Karşılama Bubble */}
      {showBubble && !isOpen && (
        <div className="fixed bottom-24 right-6 z-50 max-w-[260px]"
          style={{ animation: 'slideUpFade 0.4s ease-out' }}>
          <div className="bg-white rounded-2xl rounded-br-none shadow-xl border border-rose-100 p-4 relative">
            <button
              onClick={dismissBubble}
              className="absolute top-2 right-2 text-stone-300 hover:text-stone-500 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-sm flex-shrink-0">
                💊
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800 leading-none">Eczacı Asistanı</p>
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  7/24 çevrimiçi
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              👋 Merhaba! Ürünler veya cilt bakımı hakkında sorularınızı yanıtlamak için buradayım.
            </p>
            <button
              onClick={() => { dismissBubble(); setIsOpen(true) }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              Sohbet Başlat 💬
            </button>
            <div className="absolute -bottom-2 right-5 w-4 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white border-r border-b border-rose-100 rotate-45 translate-x-0.5 -translate-y-1.5 shadow-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => { dismissBubble(); setIsOpen((o) => !o) }}
        aria-label={isOpen ? 'Sohbeti kapat' : 'Eczacı asistanını aç'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-rose-500 text-white rounded-full shadow-xl hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center"
        style={{ bottom: `max(1.5rem, env(safe-area-inset-bottom))` }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 z-50 w-[min(280px,calc(100vw-2rem))] sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden transition-[bottom] duration-200`}
          style={{
            bottom: chatBottom ?? '6rem',
            height: chatMaxHeight,
            maxHeight: chatMaxHeight,
          }}
        >
          {/* Header */}
          <div className="bg-rose-500 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-full flex items-center justify-center text-base sm:text-lg">
              💊
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-xs sm:text-sm leading-tight">Eczacı Asistanı</p>
              <p className="text-rose-100 text-[10px] sm:text-xs">GAMZELİECZANEM</p>
            </div>
            <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-rose-100">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full inline-block"></span>
              Çevrimiçi
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Sohbeti kapat"
              className="text-white/80 hover:text-white p-1 -mr-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-rose-50/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
                    💊
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-rose-500 text-white rounded-tr-sm'
                      : 'bg-white text-stone-800 rounded-tl-sm shadow-sm border border-rose-100'
                  }`}
                >
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-1 h-4 bg-rose-400 ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator (before stream starts) */}
            {isLoading && !isStreaming && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-sm shrink-0">
                  💊
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-rose-100">
                  <span className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions — yatay scroll'lu, tek satırda */}
          {messages.length === 1 && (
            <div
              className="flex gap-2 overflow-x-auto whitespace-nowrap sm:flex-col sm:overflow-x-visible sm:whitespace-normal sm:items-stretch bg-white border-t border-rose-50 px-3 pt-2 pb-1.5 shrink-0"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="text-[11px] sm:text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 active:scale-95 transition-all border border-rose-100 shrink-0 sm:w-full sm:text-left sm:rounded-xl"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input — safe area padding eklendi */}
          <form
            onSubmit={sendMessage}
            className="p-2.5 sm:p-3 border-t border-rose-100 flex gap-1.5 sm:gap-2 bg-white shrink-0"
            style={{ paddingBottom: `max(0.625rem, env(safe-area-inset-bottom))` }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sorunuzu yazın..."
              disabled={isLoading}
              enterKeyHint="send"
              autoComplete="off"
              className="flex-1 text-sm px-3 sm:px-3.5 py-2 border border-rose-200 rounded-full focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:opacity-50 transition-all"
              style={{ fontSize: '16px' }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 sm:w-9 sm:h-9 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 disabled:opacity-40 transition-colors shrink-0"
              aria-label="Gönder"
            >
              <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
