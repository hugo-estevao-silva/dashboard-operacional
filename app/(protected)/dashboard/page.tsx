"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function Home() {
  
  const [now, setNow] = useState(Date.now());
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ordenacao, setOrdenacao] = useState("nome");
  const [filtroStatus, setFiltroStatus] = useState("")
  const [ordenacaoTempo, setOrdenacaoTempo] = useState("maior")
  const [busca, setBusca] = useState("");
  const [somenteCriticos, setSomenteCriticos] = useState(false);
  const [mostrarDeslogados, setMostrarDeslogados] = useState(false)
  const router = useRouter();

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

  async function alterarStatus(
  id: number,
  novoStatus: string
): Promise<void> {
  const { data, error } = await supabase
    .from("userChatguru")
    .update({
      user_status: novoStatus
    })
    .eq("user_id_chatguru", id)

    .select();

  console.log("Resultado:", data);
  console.log("Erro:", error);

  if (error) {
    alert(`Erro: ${error.message}`);
    return;
  }

  buscarUsuarios();
}

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

  const usuariosDeslogados = [
    "Offline",
    "Férias",
    "Atestado"
  ];

  if (
    !mostrarDeslogados &&
    usuariosDeslogados.includes(
      usuario.user_status
    )
  ) {
    return false;
  }

  if (
    filtroStatus &&
    usuario.user_status !== filtroStatus
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
    usuario.user_status === "Pausa Banheiro" &&
    minutos > 15;

  const almocoCritico =
    usuario.user_status === "Almoço" &&
    minutos > 120;

  const callCritico =
    usuario.user_status === "Call" &&
    minutos > 60;


  return banheiroCritico || almocoCritico || callCritico;
});

const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => {

  let resultado = 0;

  switch (ordenacao) {

    case "nome":
      resultado = a.user_name.localeCompare(
        b.user_name
      );
      break;

    case "maisChats":
      resultado =
        (b.in_progress_chats_count || 0) -
        (a.in_progress_chats_count || 0);
      break;

    case "menosChats":
      resultado =
        (a.in_progress_chats_count || 0) -
        (b.in_progress_chats_count || 0);
      break;

    default:
      resultado = 0;
  }

  // Se houver empate, usa tempo
  if (resultado === 0) {

    if (
      a.status_started_at &&
      b.status_started_at
    ) {

      const tempoA =
        new Date(
          a.status_started_at
        ).getTime();

      const tempoB =
        new Date(
          b.status_started_at
        ).getTime();

      return ordenacaoTempo === "maior"
        ? tempoA - tempoB
        : tempoB - tempoA;
    }

  }

  return resultado;

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
  if (usuario.user_status === "PAUSA BANHEIRO") {

    if (minutos > 15) {
      return "bg-red-200 text-red-900";
    }

    return "bg-blue-100 text-blue-700";
  }

  // Call
  if (usuario.user_status === "Call") {

    if (minutos > 60) {
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
  (u) => u.user_status === "Banheiro"
).length;

const totalCall = usuarios.filter(
  (u) => u.user_status === "Call"
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

const alertasCall = usuarios.filter((usuario) => {

  if (
    usuario.user_status !== "Call" ||
    !usuario.status_started_at
  ) {
    return false;
  }

  const inicio = new Date(usuario.status_started_at);

  inicio.setHours(inicio.getHours() - 3);

  const agora = new Date();

  const minutos =
    (agora.getTime() - inicio.getTime()) / 1000 / 60;

  return minutos > 60;

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
    usuario.user_status === "Banheiro" &&
    minutos > 15;

  const almocoCritico =
    usuario.user_status === "Almoço" &&
    minutos > 120;

  const callCritico =
    usuario.user_status === "Call" &&
    minutos > 60;

  if (banheiroCritico || callCritico) {
    return "bg-red-50 border-l-4 border-red-500";
  }

  return "";
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

          <p className="text-4xl font-bold text-yellow-600 mt-2">
          {totalBanheiro}
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-gray-500 text-sm">
            Call
          </h2>

          <p className="text-4xl font-bold text-blue-600 mt-2">
          {totalCall}
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
            {alertasBanheiro + alertasAlmoco + alertasCall}
          </p>

          <div className="mt-4 text-sm text-gray-600">

            <p>
              🚽 Pausa banheiro: {alertasBanheiro}
            </p>

            <p>
              🍽️ Almoço: {alertasAlmoco}
            </p>

            <p>
              🍽️ Call: {alertasCall}
            </p>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-3xl font-bold text-black">
          Dashboard Operacional
        </h1>

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
              checked={mostrarDeslogados}
              onChange={(e) =>
                setMostrarDeslogados(
                  e.target.checked
                )
              }
            />

              Mostrar deslogados
            </label>

          <select
           value={ordenacao}
           onChange={(e) => setOrdenacao(e.target.value)}
           className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm"
          >
            <option value="">
              Selecione um Filtro
            </option>


            <option value="nome">
              Nome A-Z
            </option>

            <option value="maisChats">
              Mais chats
            </option>

            <option value="menosChats">
              Menos chats
            </option>

          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm"
          >
            <option value="">Todos status</option>

            <option value="Disponível">DISPONÍVEL</option>
            <option value="Almoço">ALMOÇO</option>
            <option value="Call">CALL</option>
            <option value="Banheiro">BANHEIRO</option>
            <option value="Offline">OFFLINE</option>
            <option value="Férias">FÉRIAS</option>
            <option value="Atestado">ATESTADO</option>

          </select>

          <select
            value={ordenacaoTempo}
            onChange={(e) => setOrdenacaoTempo(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm"
          >
            
            <option value="maior">
              Mais tempo
            </option>

            <option value="menor">
              Menos tempo
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

                  <td>
                    <select
                      value={usuario.user_status}
                      onChange={(e) =>
                        alterarStatus(
                        usuario.user_id_chatguru,
                        e.target.value
                      )
                      }
                      className={`rounded-lg px-3 py-2 font-semibold text-black border-none

                        ${
                          usuario.user_status === "Disponível"
                            ? "bg-green-200"

                          : usuario.user_status === "Offline"
                            ? "bg-gray-300"

                          : [
                              "Almoço",
                              "Call",
                              "Banheiro",
                              "Férias",
                              "Atestado"
                            ].includes(usuario.user_status)
                            ? (
                                usuario.tempoPausaCritico
                                  ? "bg-red-300"
                                  : "bg-yellow-200"
                              )

                          : "bg-white"
                        }
                      `}
                    >
                      <option value="Disponível">
                        DISPONÍVEL
                      </option>

                      <option value="Almoço">
                        ALMOÇO
                      </option>

                      <option value="Call">
                        CALL
                      </option>

                      <option value="Banheiro">
                        PAUSA BANHEIRO
                      </option>

                      <option value="Offline">
                        OFFLINE
                      </option>

                      <option value="Férias">
                        FÉRIAS
                      </option>

                      <option value="Atestado">
                        ATESTADO
                      </option>
                    </select>
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