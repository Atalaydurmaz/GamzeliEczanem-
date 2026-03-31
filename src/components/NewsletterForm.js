'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [gonderildi, setGonderildi] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setGonderildi(true)
    setEmail('')
    setTimeout(() => setGonderildi(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        placeholder="E-posta adresiniz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-400 transition-colors"
        required
      />
      <button
        type="submit"
        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {gonderildi ? '✓ Abone Oldunuz!' : 'Abone Ol'}
      </button>
    </form>
  )
}
