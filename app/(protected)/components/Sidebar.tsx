"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function Sidebar() {

  const pathname = usePathname();

  const items = [
      
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
    },

    {
      label: "Atendimentos",
      href: "/atendimento",
      icon: "🎧",
    },

      {
      label: "Histórico",
      href: "/historico",
      icon: "🗃️",
    },
  
    {
      label: "Usuários",
      href: "/users",
      icon: "👥",
    },
    {
      label: "Feriados",
      href: "/feriados",
      icon: "📅",
    },
  ];

    const router = useRouter();

      async function logout() {
        await supabase.auth.signOut();
        router.push("/login");
      }

  return (
    <div className="w-64 bg-emerald-700 min-h-screen text-white p-4">

      <h1 className="text-xl font-bold mb-8">
        Dashboard Operacional
      </h1>

      <div className="space-y-2">

        {items.map((item) => (

          <Link
            key={item.href}
            href={item.href}
            className={`
              block
              p-3
              rounded-lg
              cursor-pointer
              ${
                pathname === item.href
                  ? "bg-emerald-800"
                  : "hover:bg-emerald-600"
              }
            `}
          >
            {item.icon} {item.label}
          </Link>

        ))}

        <button
          onClick={logout}
          className="
            mt-auto
            w-full
            bg-red-900
            hover:bg-red-1000
            text-white
            rounded-lg
            px-4
            py-2
            transition
          "
        >
          Sair
        </button>

      </div>

    </div>
  );
}