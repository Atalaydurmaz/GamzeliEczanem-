// Anthropic client factory — .env.local fallback ile.
// Bazı ortamlarda (parent shell, Docker, CI) ANTHROPIC_API_KEY boş string
// olarak set edilebilir ve Next.js bunu .env.local ile override etmez.
// Bu modül öncelikle process.env'e, yoksa .env.local dosyasına bakar.
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

let _cachedKey = null

function loadKey() {
  if (_cachedKey) return _cachedKey

  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv?.trim()) {
    _cachedKey = fromEnv.trim()
    return _cachedKey
  }

  // Fallback: .env.local'den doğrudan oku
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    const value = match?.[1]?.trim()
    if (value) {
      _cachedKey = value
      return _cachedKey
    }
  } catch {
    // .env.local yoksa sessizce devam
  }

  throw new Error('ANTHROPIC_API_KEY tanımlı değil (ne process.env\'de ne de .env.local\'de)')
}

export function getAnthropicClient() {
  return new Anthropic({ apiKey: loadKey() })
}
