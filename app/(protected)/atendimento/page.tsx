"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Fragment } from "react";

export default function Atendimento() {

  const router = useRouter();

    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState("");
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [agora, setAgora] = useState(Date.now());
    const [expandido, setExpandido] = useState<number | null>(null);
    const [analistas, setAnalistas] = useState<any[]>([]);
    
  // ======================
  // CALCULAR TEMPO
  // ======================

    function calcularTempoTotal(item: any) {

        if (!item.inicio_do_atendimento_bot) {
            return "--:--:--";
        }

        const inicio = new Date(
            item.inicio_do_atendimento_bot
        ).getTime();

        const diferenca = agora - inicio;

        const horas = Math.floor(
            diferenca / (1000 * 60 * 60)
        );

        const minutos = Math.floor(
            (diferenca % (1000 * 60 * 60)) /
            (1000 * 60)
        );

        const segundos = Math.floor(
            (diferenca % (1000 * 60)) /
            1000
        );

        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    }

    function calcularTempoAtendimento(item: any) {

        if (!item.inicio_do_atendimento_humano) {
            return "--:--:--";
        }

        const inicio = new Date(
            item.inicio_do_atendimento_humano
        ).getTime();

        const diferenca = agora - inicio;

        const horas = Math.floor(
            diferenca / (1000 * 60 * 60)
        );

        const minutos = Math.floor(
            (diferenca % (1000 * 60 * 60)) /
            (1000 * 60)
        );

        const segundos = Math.floor(
            (diferenca % (1000 * 60)) /
            1000
        );

        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    }

    function classeTempoAtendimento(item: any) {

        if (
            item.status_do_atendimento !==
            "Em atendimento"
        ) {
            return "";
        }

        if (!item.inicio_do_atendimento_humano) {
            return "";
        }

        const inicio = new Date(
            item.inicio_do_atendimento_humano
        ).getTime();

        const diferencaMinutos =
            (agora - inicio) / 1000 / 60;

        if (diferencaMinutos > 30) {

            return "bg-red-100 text-red-700 font-bold";

        } else if (
            diferencaMinutos > 25 &&
            diferencaMinutos <= 30
        ) {

            return "bg-yellow-100 text-yellow-800";

        }

        return "";
    }


    async function atualizarAnalista(
        atendimentoId: number,
        analistaId: string
    ) {

        const analistaSelecionado = analistas.find(
            (a) =>
                a.user_id_chatguru === analistaId
        );

        console.log("ANALISTA ID:", analistaId);

        console.log("ANALISTAS:", analistas);

        console.log("SELECIONADO:", analistaSelecionado);


        if (!analistaSelecionado) {
            return;
        }

        const { data, error } = await supabase
        .from("atendimento")
        .update({

            id_analista_atual:
                analistaSelecionado.user_id_chatguru,

            analista_responsavel_atual:
                analistaSelecionado.user_name

        })
        .eq("id", atendimentoId)
        .select();

        if (error) {

            console.error(error);

            alert("Erro ao atualizar analista");

            return;
        }

        // Atualiza a tabela localmente
        setAtendimentos((prev) =>
            prev.map((item) =>
                item.id === atendimentoId
                    ? {
                        ...item,

                        id_analista_atual:
                            analistaSelecionado.user_id_chatguru,

                        analista_responsavel_atual:
                            analistaSelecionado.user_name
                    }
                    : item
            )
        );
    }

  // ======================
  // BUSCAR DADOS
  // ======================

    useEffect(() => {

        async function carregar(): Promise<void> {

            const { data, error } = await supabase
                .from("atendimento")
                .select("*")
                .neq(
                    "status_do_atendimento",
                    "Finalizado"
                );

            if (!error) {
                setAtendimentos(data || []);
            }

            setCarregando(false);
        }

        async function buscarAnalistas() {

            const { data, error } = await supabase
                .from("userChatguru")
                .select(`
                    user_id_chatguru,
                    user_name
                `)
                .order("user_name");

            if (!error) {
                setAnalistas(data || []);
            }
        }

        // primeira carga
        carregar();

        buscarAnalistas();

        // atualização automática
        const interval = setInterval(() => {

            carregar();

        }, 5000);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {

        const intervalo = setInterval(() => {
            setAgora(Date.now());

        },1000);

        return () =>
        clearInterval(intervalo);

    },[]);


  // ======================
  // FILTRO BUSCA
  // ======================

  const atendimentosFiltrados =
    atendimentos.filter(
      (item) =>
        item.cliente
          ?.toLowerCase()
          .includes(
            busca.toLowerCase()
          )
    );

  // ======================
  // LOADING
  // ======================

  if (carregando) {

    return (
      <div className="p-6">
        Carregando...
      </div>
    );

  }


    async function buscarAnalistas() {

        const { data, error } = await supabase
            .from("userChatguru")
            .select(`
                user_id_chatguru,
                user_name
            `)
            .order("user_name");

        if (!error) {
            setAnalistas(data || []);
        }
    }



    async function atualizarAtendimento(
        id: number,
        campo: string,
        valor: string
    ) {

        const { error } = await supabase
            .from("atendimento")
            .update({
                [campo]: valor
            })
            .eq("id", id);

        if (error) {
            console.error(error);
            alert("Erro ao atualizar atendimento");
            return;
        }

        // Atualiza a lista local
        setAtendimentos((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [campo]: valor
                    }
                    : item
            )
        );
    }


  // ======================
  // TELA
  // ======================

  return (

    <div className="p-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-black">
                Atendimentos
            </h1>
        </div>

        <div className="mb-6 flex items-center gap-4">
            <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e)=>
            setBusca(
                e.target.value
            )
            }
            className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm w-72"/>
        </div>
        <div
            className="
            bg-white
            rounded-2xl
            shadow-md
            overflow-hidden
            "
            >

            <table className="w-full">

                <thead className="bg-emerald-700 text-white">

                    <tr>

                        <th className="text-left px-5 py-4">
                        Cliente
                        </th>

                        <th className="text-center px-5 py-4">
                        Status
                        </th>

                        <th className="text-center px-5 py-4">
                        Tempo Total
                        </th>

                        <th className="text-center px-5 py-4">
                            Tempo Atendimento
                        </th>

                        <th className="text-center px-5 py-4">
                        Analista
                        </th>

                        <th className="text-center px-5 py-4">
                        Ticket
                        </th>

                    </tr>

                </thead>

                <tbody className="bg-white text-black">

                    {atendimentosFiltrados.map((item) => (
                        <Fragment key={item.id}>

                            <tr
                                className="border-b hover:bg-gray-50 cursor-pointer"
                                onClick={() =>
                                    setExpandido(
                                        expandido === item.id
                                        ? null
                                        : item.id
                                    )
                                }
                            >

                                <td className="px-5 py-4">
                                    {item.cliente}
                                </td>

                                <td className="text-center">

                                    <select
                                        value={item.status_do_atendimento || ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                            atualizarAtendimento(
                                                item.id,
                                                "status_do_atendimento",
                                                e.target.value
                                            )
                                        }
                                        className="border rounded px-2 py-1 bg-white"
                                    >

                                        <option value="Aberto">
                                            Aberto
                                        </option>

                                        <option value="Fila de Atendimento">
                                            Fila de atendimento
                                        </option>

                                        <option value="Em atendimento">
                                            Em atendimento
                                        </option>

                                        <option value="Aguardando">
                                            Aguardando
                                        </option>

                                        <option value="Finalizado">
                                            Finalizado
                                        </option>

                                    </select>

                                </td>

                                <td className="text-center">
                                    {calcularTempoTotal(item)}
                                </td>

                                <td
                                    className={`
                                        text-center
                                        ${classeTempoAtendimento(item)}
                                    `}
                                >
                                    {calcularTempoAtendimento(item)}
                                </td>

                                <td className="text-center">

                                    <select
                                        value={String(item.id_analista_atual || "")}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                            atualizarAnalista(
                                                item.id,
                                                e.target.value
                                            )
                                        }
                                        className="border rounded px-2 py-1 bg-white"
                                    >

                                        <option value="">
                                            Selecione
                                        </option>

                                        {analistas.map((analista) => (

                                            <option
                                                key={analista.user_id_chatguru}
                                                value={String(analista.user_id_chatguru)}
                                            >
                                                {analista.user_name}
                                            </option>

                                        ))}

                                    </select>

                                </td>

                                <td className="text-center">
                                    {item.ticket_jira || "-"}
                                </td>

                            </tr>

                            {expandido === item.id && (
                                <tr>
                                    <td colSpan={5}
                                        className="bg-gray-50 px-6 py-4 text-black"
                                    >
                                        <div className="grid grid-cols-2 gap-4">

                                            <div>
                                                <b>ID:</b> {item.id}
                                            </div>

                                            <div>
                                            <b>Celular:</b> {item.celular}
                                            </div>

                                            <div>
                                            <b>Tipo:</b> {item.tipo_do_cliente}
                                            </div>

                                            <div>
                                            <b>Motivo:</b> {item.motivo}
                                            </div>

                                            <div>
                                            <b>Submotivo:</b> {item.submotivo}
                                            </div>

                                            <div>
                                            <b>Fila:</b> {item.hora_inicio_fila}
                                            </div>

                                            <div>
                                            <b>Chat:</b>{" "}
                                            <a
                                                href={item.link_do_chat}
                                                target="_blank"
                                                className="text-blue-600 underline ml-2"
                                            >
                                                Abrir
                                            </a>
                                            </div>

                                        </div>
                                    </td>
                                </tr>
                            )}

                        </Fragment>
                    ))}

                </tbody>

            </table>


        </div>

    </div>


  );

}