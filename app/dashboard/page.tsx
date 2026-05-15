"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Home() {
  
  const [now, setNow] = useState(Date.now());
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ordenacao, setOrdenacao] = useState("nome");
  const [busca, setBusca] = useState("");
  const [somenteCriticos, setSomenteCriticos] = useState(false);
  const [ocultarOffline, setOcultarOffline] = useState(false);
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);

  function formatarTempo(dataInicio: string) {

  const inicio = new Date(dataInicio);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const diferenca = agora.getTime() - inicio.getTime();

  const totalSegundos = Math.floor(diferenca / 1000);

  const horas = Math.floor(totalSegundos / 3600);

  const minutos = Math.floor(
    (totalSegundos % 3600) / 60
  );

  const segundos = totalSegundos % 60;

 


  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

  async function logout() {

    await supabase.auth.signOut();

    router.push("/login");
  }

  async function buscarUsuarios() {

    const { data, error } = await supabase
      .from("userChatguru")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setUsuarios(data);
  }

useEffect(() => {

  async function verificarLogin() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {

      router.push("/login");
      return;
    }

    setCarregando(false);
  }

  verificarLogin();

}, [router]);

useEffect(() => {

  buscarUsuarios();

  const interval = setInterval(() => {

    buscarUsuarios();

    setNow(Date.now());

  }, 1000);

  return () => clearInterval(interval);

}, []);

const usuariosFiltrados = usuarios.filter((usuario) => {

  const nomeMatch = usuario.user_name
    ?.toLowerCase()
    .includes(busca.toLowerCase());

  if (!nomeMatch) {
    return false;
  }

  if (
  ocultarOffline &&
  usuario.user_status === "Offline"
  ) {
  return false;
  }

  if (!somenteCriticos) {
    return true;
  }

  if (!usuario.status_started_at) {
    return false;
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  const banheiroCritico =
    usuario.user_status === "Pausa banheiro" &&
    minutos > 15;

  const almocoCritico =
    usuario.user_status === "Almoço" &&
    minutos > 120;

  return banheiroCritico || almocoCritico;
});

const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => {

  switch (ordenacao) {

    case "nome":
      return a.user_name.localeCompare(b.user_name);

    case "maisChats":
      return (
        (b.in_progress_chats_count || 0) -
        (a.in_progress_chats_count || 0)
      );

    case "menosChats":
      return (
        (a.in_progress_chats_count || 0) -
        (b.in_progress_chats_count || 0)
      );

    case "status":
      return a.user_status.localeCompare(b.user_status);

    default:
      return 0;
  }
});

function obterClasseStatus(usuario: any) {

  if (!usuario.status_started_at) {
    return "bg-gray-100 text-gray-700";
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  // DISPONÍVEL
  if (usuario.user_status === "Disponível") {

    if (minutos > 240) {
      return "bg-yellow-200 text-yellow-900";
    }

    return "bg-green-100 text-green-700";
  }

  // ALMOÇO
  if (usuario.user_status === "Almoço") {

    if (minutos > 120) {
      return "bg-red-200 text-red-900";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  // BANHEIRO
  if (usuario.user_status === "Pausa banheiro") {

    if (minutos > 15) {
      return "bg-red-200 text-red-900";
    }

    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
}

const totalDisponiveis = usuarios.filter(
  (u) => u.user_status === "Disponível"
).length;

const totalAlmoco = usuarios.filter(
  (u) => u.user_status === "Almoço"
).length;

const totalBanheiro = usuarios.filter(
  (u) => u.user_status === "Pausa banheiro"
).length;

const totalAtendimento = usuarios.filter(
  (u) => (u.in_progress_chats_count || 0) > 0
).length;

const alertasBanheiro = usuarios.filter((usuario) => {

  if (
    usuario.user_status !== "Pausa banheiro" ||
    !usuario.status_started_at
  ) {
    return false;
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  return minutos > 15;

}).length;

const alertasAlmoco = usuarios.filter((usuario) => {

  if (
    usuario.user_status !== "Almoço" ||
    !usuario.status_started_at
  ) {
    return false;
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  return minutos > 120;

}).length;

function linhaCritica(usuario: any) {

  if (!usuario.status_started_at) {
    return "";
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  const banheiroCritico =
    usuario.user_status === "Pausa banheiro" &&
    minutos > 15;

  const almocoCritico =
    usuario.user_status === "Almoço" &&
    minutos > 120;

  if (banheiroCritico || almocoCritico) {
    return "bg-red-50 border-l-4 border-red-500";
  }

  return "";
}

if (carregando) {

  return (
    <div className="p-10 text-black">
      Carregando...
    </div>
  );
}

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-gray-500 text-sm">
            Disponíveis
          </h2>

          <p className="text-4xl font-bold text-green-600 mt-2">
           {totalDisponiveis}
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-gray-500 text-sm">
            Em almoço
          </h2>

          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {totalAlmoco}
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-gray-500 text-sm">
            Pausa banheiro
          </h2>

          <p className="text-4xl font-bold text-blue-600 mt-2">
          {totalBanheiro}
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-gray-500 text-sm">
            Em atendimento
          </h2>

          <p className="text-4xl font-bold text-emerald-600 mt-2">
            {totalAtendimento}
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6 border-2 border-red-300">

          <h2 className="text-gray-500 text-sm">
            Alertas críticos
          </h2>

          <p className="text-4xl font-bold text-red-600 mt-2">
            {alertasBanheiro + alertasAlmoco}
          </p>

          <div className="mt-4 text-sm text-gray-600">

            <p>
              🚽 Banheiro: {alertasBanheiro}
            </p>

            <p>
              🍽️ Almoço: {alertasAlmoco}
            </p>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-3xl font-bold text-black">
          Dashboard Operacional
        </h1>

        <button
          onClick={logout}
          className="
            bg-red-600
            hover:bg-red-700
              text-white
              font-bold
              px-4
              py-2
              rounded-lg
              transition-colors
          "
        >
          Sair
        </button>

      </div>


        <div className="mb-6 flex items-center gap-4">

          <input
           type="text"
            placeholder="Buscar analista..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm w-72"
          />

          <label className="text-black font-semibold">
            Ordenar por:
          </label>

          <label className="flex items-center gap-2 text-black">

          <input
            type="checkbox"
            checked={somenteCriticos}
            onChange={(e) =>
              setSomenteCriticos(e.target.checked)
            }
          />

            Somente críticos

          </label>

          <label className="flex items-center gap-2 text-black">

          <input
            type="checkbox"
            checked={ocultarOffline}
            onChange={(e) =>
              setOcultarOffline(e.target.checked)
            }
          />

           Ocultar offline

          </label>

          <select
           value={ordenacao}
           onChange={(e) => setOrdenacao(e.target.value)}
           className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm"
          >

            <option value="nome">
              Nome A-Z
            </option>

            <option value="maisChats">
              Mais chats
            </option>

            <option value="menosChats">
              Menos chats
            </option>

            <option value="status">
              Status
            </option>

          </select>

        </div>



        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <table className="w-full text-black">

            <thead className="bg-emerald-700 text-white">

              <tr>

                <th className="text-left p-4 font-bold">
                  Analista
                </th>

                <th className="text-left p-4 font-bold">
                  Status
                </th>

                <th className="text-center p-4 font-bold">
                  Tempo
                </th>

                <th className="text-center p-4 font-bold">
                  Em Atendimento
                </th>

                <th className="text-center p-4 font-bold">
                  Aguardando
                </th>

              </tr>

            </thead>

            <tbody>

              {usuariosOrdenados?.map((usuario) => (

                <tr
                  key={usuario.user_id_chatguru}
                  className={`
                  border-t hover:bg-gray-50
                  ${linhaCritica(usuario)}
                `}
                >

                  <td className="p-4 font-medium">
                    {usuario.user_name}
                  </td>

                  <td className="p-4">

                    <span
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${obterClasseStatus(usuario)}
                      `}
                    >
                      {usuario.user_status}
                    </span>

                  </td>

                  <td className="text-center p-4 font-mono">

                    {usuario.status_started_at
                    ? formatarTempo(usuario.status_started_at)
                    : "--:--:--"}

                  </td>

                  <td className="text-center p-4">
                    {usuario.in_progress_chats_count}
                  </td>

                  <td className="text-center p-4">
                    {usuario.pending_chats_count}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}