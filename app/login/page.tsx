"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function fazerLogin(
  e: React.FormEvent
) {
  e.preventDefault();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

  if (error) {
    alert("E-mail ou senha inválidos");
    return;
  }

  // espera a sessão existir antes de navegar
  let tentativas = 0;

  while (tentativas < 10) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.replace("/dashboard");
      return;
    }

    tentativas++;

    await new Promise(resolve =>
      setTimeout(resolve, 200)
    );
  }

  alert("Não foi possível iniciar sessão.");
}

  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold text-center text-black mb-8">
          Login
        </h1>

        <form
          onSubmit={fazerLogin}
          className="space-y-4"
        >

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
          />

          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>

        </form>

      </div>

    </main>
  );
}