'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleSalvar() {
    if (!password) return

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-md w-96">

        <h1 className="text-2xl font-bold text-center text-black mb-6">
          Definir senha
        </h1>

        <input
          type="password"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-2 text-black mb-4"
        />

        <button
          onClick={handleSalvar}
          disabled={loading}
          className="
            w-full
            bg-emerald-700
            hover:bg-emerald-800
            text-white
            rounded-lg
            py-2
          "
        >
          {loading
            ? "Salvando..."
            : "Salvar senha"}
        </button>

      </div>

    </div>
  )
}