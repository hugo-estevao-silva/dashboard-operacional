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
  // ======================
  // CALCULAR TEMPO
  // ======================

    function calcularTempo(item: any) {

        let dataInicio = null;

        if (
            item.status_do_atendimento ===
            "Em atendimento"
        ) {

            dataInicio =
            item.inicio_do_atendimento;

        } else if (
            item.status_do_atendimento ===
            "Aguardando"
        ) {

            dataInicio =
            item.hora_inicio_fila;

        } else {

            dataInicio =
            item.created_at;

        }

        if (!dataInicio) {
            return "--:--:--";
        }

        const inicio =
            new Date(dataInicio).getTime();

        const diferenca =
            agora - inicio;

        const horas =
            Math.floor(
            diferenca / (1000 * 60 * 60)
            );

        const minutos =
            Math.floor(
            (diferenca %
                (1000 * 60 * 60)) /
            (1000 * 60)
            );

        const segundos =
            Math.floor(
            (diferenca %
                (1000 * 60)) /
            1000
            );

        return `${String(horas)
            .padStart(2, "0")}:${String(
            minutos
        ).padStart(2, "0")}:${String(
            segundos
        ).padStart(2, "0")}`;
    }

  // ======================
  // BUSCAR DADOS
  // ======================

    useEffect(() => {

        async function carregar() {

        // verifica login

        const { data, error } = await supabase
        .from("atendimento")
        .select("*")
        .neq(
            "status_do_atendimento",
            "Finalizado"
        );

        console.log("Dados:", data);
        console.log("Erro:", error);

        if (!error) {

            console.log("Dados recebidos:", data);
            console.log("Erro:", error);

            setAtendimentos(
            data || []
            );

        }


        setCarregando(false);

        }

        carregar();

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
                        Tempo
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
                                    {item.status_do_atendimento}
                                </td>

                                <td className="text-center">
                                    {calcularTempo(item)}
                                </td>

                                <td className="text-center">
                                    {item.analista_responsavel_atual || "-"}
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