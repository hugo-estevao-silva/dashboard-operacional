"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Holiday = {
    id: number;
    feriado: string;
    data: string;
    feriado_fixo: boolean;
    ativo: boolean;
};

type Props = {
    isOpen: boolean;
    holiday: Holiday | null;
    onClose: () => void;
    onUpdated: () => void;
};

export default function EditHolidayModal({
    isOpen,
    holiday,
    onClose,
    onUpdated
}: Props) {
    const [feriado, setFeriado] = useState("");
    const [data, setData] = useState("");
    const [feriadoFixo, setFeriadoFixo] = useState(false);
    const [ativo, setAtivo] = useState(true);

    useEffect(() => {
        if (holiday) {
            setFeriado(holiday.feriado);
            setData(holiday.data);
            setFeriadoFixo(holiday.feriado_fixo);
            setAtivo(holiday.ativo);
        }
    }, [holiday]);

    if (!isOpen || !holiday) return null;

    async function handleUpdate() {

        if (!holiday) return;

        if (!feriado.trim()) {
            alert("Informe o nome do feriado.");
            return;
        }

        if (!data) {
            alert("Informe a data do feriado.");
            return;
        }

        const { error } = await supabase
            .from("feriados")
            .update({
                feriado,
                data,
                feriado_fixo: feriadoFixo,
                ativo
            })
            .eq("id", holiday!.id);

        if (error) {
            alert("Erro ao atualizar feriado");
            console.error(error);
            return;
        }

        onUpdated();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96 text-black">
                <h2 className="text-lg font-semibold mb-4">
                    Editar feriado
                </h2>

                <input
                    value={feriado}
                    onChange={(e) => setFeriado(e.target.value)}
                    className="border rounded-lg px-4 py-2 w-full mb-3"
                />

                <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    disabled={feriadoFixo}
                    className={`
    border rounded-lg px-4 py-2 w-full mb-3
    ${feriadoFixo ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
  `}
                />

                {feriadoFixo && (
                    <p className="text-xs text-gray-500 mb-3">
                        A data de feriados fixos não pode ser alterada manualmente.
                    </p>
                )}

                <label className="flex items-center gap-2 mb-3">
                    <input
                        type="checkbox"
                        checked={feriadoFixo}
                        onChange={(e) => setFeriadoFixo(e.target.checked)}
                    />
                    Feriado fixo
                </label>

                <label className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                    />
                    Ativo
                </label>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="border px-4 py-2 rounded-lg"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleUpdate}
                        className="bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}