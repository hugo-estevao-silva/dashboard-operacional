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
    const [filtroAnalista, setFiltroAnalista] = useState("");
    const [filtroStatusAtendimento, setFiltroStatusAtendimento] = useState("");
    const [mostrarFinalizados, setMostrarFinalizados] = useState(false);
    const [disponibilidadePorDepartamento, setDisponibilidadePorDepartamento] = useState<any>({});

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

        const atendimentoAtual = atendimentos.find(
            (a) => a.id === atendimentoId
        );

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

        // POST PARA WEBHOOK
        await fetch("https://atendimento.chatguru.com.br/webhook/dashboard-atendimento-troca-analista", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                atendimento_id: atendimentoId,
                chat_id: atendimentoAtual?.chat_id,
                celular: atendimentoAtual?.celular,
                id_analista_atual:
                    analistaSelecionado.user_id_chatguru,
                analista_responsavel_atual:
                    analistaSelecionado.user_name,
                evento: "troca_analista"
            })
        });

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
                .neq("status_do_atendimento", "Finalizado")
                .order("id", { ascending: false })
                .limit(1000);

            if (error) {
                console.error(error);
                return;
            }

            setAtendimentos(data || []);
            setCarregando(false);

            console.log("Atendimentos carregados:", data?.length);
        }

        async function buscarDisponibilidadeDepartamentos() {
            const { data, error } = await supabase
                .from("userChatguru")
                .select(`
            user_status,
            user_department,
            service_max_count,
            in_progress_chats_count
        `)
                .eq("user_status", "Disponível");

            if (error) {
                console.error("Erro ao buscar disponibilidade:", error);
                return;
            }

            console.log("Usuários disponíveis:", data);

            const disponibilidade = (data || []).reduce((acc: any, usuario: any) => {
                const capacidade = Number(usuario.service_max_count || 0);
                const emAtendimento = Number(usuario.in_progress_chats_count || 0);
                const livre = Math.max(0, capacidade - emAtendimento);



                if (!usuario.user_department) {
                    return acc;
                }

                const departamentos = String(usuario.user_department)
                    .split(",")
                    .map((dep) => dep.trim())
                    .filter(Boolean);

                departamentos.forEach((departamento) => {
                    acc[departamento] = (acc[departamento] || 0) + livre;
                });

                console.log("Usuário disponibilidade:", {
                    nome: usuario.user_name,
                    status: usuario.user_status,
                    departamentos: usuario.user_department,
                    capacidade: usuario.service_max_count,
                    emAtendimento: usuario.in_progress_chats_count,
                    livre
                });

                return acc;
            }, {});

            console.log("Disponibilidade por departamento:", disponibilidade);

            setDisponibilidadePorDepartamento(disponibilidade);
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
        buscarDisponibilidadeDepartamentos();

        // atualização automática
        const interval = setInterval(() => {

            carregar();
            buscarDisponibilidadeDepartamentos();

        }, 5000);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {

        const intervalo = setInterval(() => {
            setAgora(Date.now());

        }, 1000);

        return () =>
            clearInterval(intervalo);

    }, []);


    // ======================
    // FILTRO BUSCA
    // ======================

    const atendimentosFiltrados =
        atendimentos.filter((item) => {

            const buscaFormatada =
                busca.toLowerCase();

            const nomeMatch =
                item.cliente
                    ?.toLowerCase()
                    .includes(buscaFormatada);

            const celularMatch =
                item.celular
                    ?.toString()
                    .includes(busca);

            const analistaMatch =
                !filtroAnalista ||
                String(item.id_analista_atual) ===
                String(filtroAnalista);

            const statusMatch =
                !filtroStatusAtendimento ||
                item.status_do_atendimento === filtroStatusAtendimento;

            return (
                (nomeMatch || celularMatch) &&
                analistaMatch &&
                statusMatch
            );
        });

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


    const atendimentosNaFila = atendimentos.filter(
        (item) => item.status_do_atendimento === "Fila de Atendimento"
    );

    const totalNaFila = atendimentosNaFila.length;

    const filaPorMotivo = atendimentosNaFila.reduce((acc: any, item: any) => {
        const motivo = item.motivo || "Sem motivo";

        acc[motivo] = (acc[motivo] || 0) + 1;

        return acc;
    }, {});

    const disponibilidadeTotal = Object.values(
        disponibilidadePorDepartamento
    ).reduce((total: number, valor: any) => total + Number(valor || 0), 0);


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
            <div>
                <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">

                    {/* CARD CLIENTES NA FILA */}
                    <div className="bg-white border border-emerald-300 rounded-2xl shadow-sm p-6">
                        <p className="text-gray-600 text-sm">
                            Clientes na fila
                        </p>

                        <p className="text-4xl font-bold text-emerald-700 mt-2">
                            {totalNaFila}
                        </p>

                        <div className="mt-4 space-y-1 text-sm text-gray-700">
                            {Object.entries(filaPorMotivo).length === 0 ? (
                                <p>Nenhum cliente na fila</p>
                            ) : (
                                Object.entries(filaPorMotivo).map(([motivo, quantidade]) => (
                                    <p key={motivo}>
                                        {motivo}: {String(quantidade)}
                                    </p>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CARD DISPONIBILIDADE */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-emerald-300 rounded-2xl shadow-sm p-4">
                            <p className="text-gray-600 text-sm mb-3">
                                Disponibilidade por departamento
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-1 text-sm">
                                {Object.entries(disponibilidadePorDepartamento)
                                    .map(([departamento, quantidade]) => (
                                        <div
                                            key={departamento}
                                            className="flex items-center justify-between py-1"
                                        >
                                            <span className="text-gray-700 whitespace-nowrap">
                                                {departamento}
                                            </span>

                                            <span
                                                className={` font-bold ml-4 ${Number(quantidade) === 0
                                                        ? "text-red-600"
                                                        : Number(quantidade) <= 2
                                                            ? "text-yellow-600"
                                                            : "text-emerald-700"
                                                    }
    `}
                                            >
                                                {String(quantidade)}
                                            </span>



                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                </div>



            </div>

            <div className="mb-6 flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Buscar cliente por nome ou número..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(
                            e.target.value
                        )
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm w-72" />

                <select
                    value={filtroAnalista}
                    onChange={(e) =>
                        setFiltroAnalista(e.target.value)
                    }
                    className="
                        border border-gray-300
                        rounded-lg
                        px-4 py-2
                        text-black
                        bg-white
                        shadow-sm
                    "
                >

                    <option value="">
                        Todos os analistas
                    </option>

                    {analistas.map((analista) => (

                        <option
                            key={analista.user_id_chatguru}
                            value={analista.user_id_chatguru}
                        >
                            {analista.user_name}
                        </option>

                    ))}

                </select>

                <select
                    value={filtroStatusAtendimento}
                    onChange={(e) =>
                        setFiltroStatusAtendimento(e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm"
                >
                    <option value="">
                        Todos status
                    </option>

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