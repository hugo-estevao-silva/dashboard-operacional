'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackContent() {

  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {

    async function handleInvite() {

      const tokenHash =
        params.get("token_hash")

      const type =
        params.get("type")

      if (tokenHash && type) {

        const { data, error } =
          await supabase.auth.verifyOtp({

            token_hash: tokenHash,
            type: type as any,

          })

        if (!error && data?.user) {

          router.replace(
            "/set-password"
          )

          return
        }
      }

      router.replace("/login")
    }

    handleInvite()

  }, [params, router])

  return (
    <div>
      Carregando...
    </div>
  )
}

export default function CallbackPage() {

  return (
    <Suspense
      fallback={
        <div>
          Carregando...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}