'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from './components/Sidebar'


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    async function verificar() {

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setLoading(false)

    }

    verificar()

  }, [router])

  if (loading) {

    return (
      <div className="p-10">
        Carregando...
      </div>
    )

  }

  return (

    <div className="flex">

      <Sidebar />

      <main className="flex-1 p-6 bg-gray-100">

        {children}

      </main>

    </div>

  )

}