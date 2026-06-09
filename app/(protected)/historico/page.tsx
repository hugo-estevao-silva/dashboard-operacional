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
    const ITENS_POR_PAGINA = 100;
    const [pagina, setPagina] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [buscaAplicada, setBuscaAplicada] = useState("");
    const [filtroAnalistaAplicado, setFiltroAnalistaAplicado] = useState("");
    const [buscaCliente, setBuscaCliente] = useState("");
    const [buscaClienteAplicada, setBuscaClienteAplicada] = useState("");
    const [buscaCelular, setBuscaCelular] = useState("");
    const [buscaCelularAplicada, setBuscaCelularAplicada] = useState("");

    // ======================
    // CALCULAR TEMPO
    // ======================

    function calcularTempoTotal(item: any) {
        if (!item.inicio_do_atendimento_bot || !item.fim_do_atendimento) {
            return "";
        }

        const inicio = new Date(item.inicio_do_atendimento_bot).getTime();
        const fim = new Date(item.fim_do_atendimento).getTime();

        if (isNaN(inicio) || isNaN(fim)) {
            return "";
        }

        const diferenca = fim - inicio;

        if (diferenca < 0) {
            return "";
        }

        const horas = Math.floor(diferenca / (1000 * 60 * 60));
        const minutos = Math.floor(
            (diferenca % (1000 * 60 * 60)) / (1000 * 60)
        );
        const segundos = Math.floor(
            (diferenca % (1000 * 60)) / 1000
        );

        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    }

    function calcularTempoAtendimento(item: any) {
        if (!item.inicio_do_atendimento_humano || !item.fim_do_atendimento) {
            return "";
        }

        const inicio = new Date(item.inicio_do_atendimento_humano).getTime();
        const fim = new Date(item.fim_do_atendimento).getTime();

        if (isNaN(inicio) || isNaN(fim)) {
            return "";
        }

        const diferenca = fim - inicio;

        if (diferenca < 0) {
            return "";
        }

        const horas = Math.floor(diferenca / (1000 * 60 * 60));
        const minutos = Math.floor(
            (diferenca % (1000 * 60 * 60)) / (1000 * 60)
        );
        const segundos = Math.floor(
            (diferenca % (1000 * 60)) / 1000
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

            const inicio = (pagina - 1) * ITENS_POR_PAGINA;
            const fim = inicio + ITENS_POR_PAGINA - 1;

            let query = supabase
                .from("atendimento")
                .select("*", { count: "exact" })
                .eq("status_do_atendimento", "Finalizado");

            if (buscaClienteAplicada.trim()) {
                query = query.ilike(
                    "cliente",
                    `%${buscaClienteAplicada.trim()}%`
                );
            }

            if (buscaCelularAplicada.trim()) {
                query = query.eq(
                    "celular",
                    buscaCelularAplicada.trim()
                );
            }

            if (filtroAnalistaAplicado) {
                query = query.eq(
                    "id_analista_atual",
                    filtroAnalistaAplicado
                );
            }

            const { data, error, count } = await query
                .order("id", { ascending: false })
                .range(inicio, fim);

            if (error) {
                console.error(error);
                return;
            }

            setAtendimentos(data || []);
            setTotalRegistros(count || 0);
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

    }, [
        pagina,
        buscaClienteAplicada,
        buscaCelularAplicada,
        filtroAnalistaAplicado
    ]);

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

    const atendimentosFiltrados = atendimentos;

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

    const totalPaginas = Math.max(
        1,
        Math.ceil(totalRegistros / ITENS_POR_PAGINA)
    );

    // ======================
    // TELA
    // ======================

    return (

        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-black">
                    Histórico de Atendimentos
                </h1>
            </div>


            <div className="mb-6 flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Buscar cliente por nome"
                    value={buscaCliente}
                    onChange={(e) =>
                        setBuscaCliente(
                            e.target.value
                        )
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm w-72"
                />

                <input
                    type="text"
                    placeholder="Buscar cliente por celular"
                    value={buscaCelular}
                    onChange={(e) =>
                        setBuscaCelular(
                            e.target.value
                        )
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2 text-black bg-white shadow-sm w-72"
                />

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

                <button
                    onClick={() => {
                        setPagina(1);

                        setBuscaClienteAplicada(buscaCliente);
                        setBuscaCelularAplicada(buscaCelular);

                        setFiltroAnalistaAplicado(filtroAnalista);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-medium shadow-sm hover:bg-emerald-800 cursor-pointer"
                >
                    Buscar
                </button>

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

                                    <td>{item.status_do_atendimento}</td>

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

                                    <td>{item.analista_responsavel_atual}</td>

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

            <div className="flex justify-end items-center gap-3 p-4">
                <button
                    disabled={pagina === 1}
                    onClick={() => setPagina((prev) => prev - 1)}
                    className="
            px-4 py-2
            rounded-lg
            bg-emerald-700
            text-white
            font-medium
            shadow-sm
            hover:bg-emerald-800
            cursor-pointer
            disabled:opacity-50
            disabled:cursor-not-allowed
        "
                >
                    Anterior
                </button>

                <select
                    value={pagina}
                    onChange={(e) => setPagina(Number(e.target.value))}
                    className="
            border border-emerald-700
            rounded-lg
            px-3 py-2
            text-black
            bg-white
            cursor-pointer
            shadow-sm
        "
                >
                    {Array.from({ length: totalPaginas }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                            Página {index + 1}
                        </option>
                    ))}
                </select>

                <button
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina((prev) => prev + 1)}
                    className="
            px-4 py-2
            rounded-lg
            bg-emerald-700
            text-white
            font-medium
            shadow-sm
            hover:bg-emerald-800
            cursor-pointer
            disabled:opacity-50
            disabled:cursor-not-allowed
        "
                >
                    Próxima
                </button>
            </div>

        </div>


    );

}