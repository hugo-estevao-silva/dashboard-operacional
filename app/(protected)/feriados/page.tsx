"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreateHolidayModal from "./components/CreateHolidayModal";
import EditHolidayModal from "./components/EditHolidayModal";

type Holiday = {
    id: number;
    feriado: string;
    data: string;
    feriado_fixo: boolean;
    ativo: boolean;
};

export default function FeriadosPage() {
    const [feriados, setFeriados] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

    function formatarData(data: string) {
        if (!data) return "-";

        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    async function handleDelete(holiday: Holiday) {
        const confirmed = confirm(
            `Deseja remover o feriado "${holiday.feriado}"?`
        );

        if (!confirmed) return;

        const { error } = await supabase
            .from("feriados")
            .delete()
            .eq("id", holiday.id);

        if (error) {
            console.error(error);
            alert("Erro ao remover feriado");
            return;
        }

        fetchFeriados();
    }

    async function fetchFeriados() {
        setLoading(true);

        const { data, error } = await supabase
            .from("feriados")
            .select("*")
            .order("data", { ascending: true });

        if (!error && data) {
            setFeriados(data);
        }

        setLoading(false);
    }


    useEffect(() => {
        fetchFeriados();
    }, []);

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border">

                <h1 className="text-xl font-semibold text-black">
                    Gestão de Feriados
                </h1>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-emerald-700 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                    Novo feriado
                </button>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                    <strong>Observação:</strong> Os feriados marcados como <strong>fixos</strong> serão atualizados automaticamente em 01/01 de cada ano.
                    Os demais feriados possuem datas variáveis e devem ser revisados e atualizados manualmente quando necessário.
                </p>
            </div>

            <div className="mt-6 bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-black">
                    <thead className="bg-emerald-700 text-white">
                        <tr>
                            <th className="p-3 text-left">Feriado</th>
                            <th className="p-3 text-left">Data</th>
                            <th className="p-3 text-center">Fixo</th>
                            <th className="p-3 text-center">Ativo</th>
                            <th className="p-3 text-left">Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center">
                                    Carregando...
                                </td>
                            </tr>
                        ) : (
                            feriados.map((feriado) => (
                                <tr key={feriado.id} className="border-t hover:bg-green-50">
                                    <td className="p-3">{feriado.feriado}</td>

                                    <td className="p-3">
                                        {formatarData(feriado.data)}
                                    </td>

                                    <td className="p-3 text-center">
                                        {feriado.feriado_fixo ? "✅" : "❌"}
                                    </td>

                                    <td className="p-3 text-center">
                                        {feriado.ativo ? "✅" : "❌"}
                                    </td>

                                    <td className="p-3 flex gap-3">
                                        <button
                                            className="text-green-700 hover:underline cursor-pointer"
                                            onClick={() => {
                                                setSelectedHoliday(feriado);
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="text-red-600 hover:underline cursor-pointer"
                                            onClick={() => handleDelete(feriado)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CreateHolidayModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={fetchFeriados}
            />

            <EditHolidayModal
                isOpen={isEditOpen}
                holiday={selectedHoliday}
                onClose={() => setIsEditOpen(false)}
                onUpdated={fetchFeriados}
            />
        </div>
    );
}