"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
};

export default function CreateHolidayModal({
    isOpen,
    onClose,
    onCreated
}: Props) {
    const [feriado, setFeriado] = useState("");
    const [data, setData] = useState("");
    const [feriadoFixo, setFeriadoFixo] = useState(false);
    const [ativo, setAtivo] = useState(true);

    if (!isOpen) return null;



    async function handleCreate() {

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
            .insert({
                feriado,
                data,
                feriado_fixo: feriadoFixo,
                ativo
            });

        if (error) {
            alert("Erro ao criar feriado");
            console.error(error);
            return;
        }

        setFeriado("");
        setData("");
        setFeriadoFixo(false);
        setAtivo(true);

        onCreated();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96 text-black">
                <h2 className="text-lg font-semibold mb-4">
                    Novo feriado
                </h2>

                <input
                    required
                    value={feriado}
                    onChange={(e) => setFeriado(e.target.value)}
                    placeholder="Nome do feriado"
                    className="border rounded-lg px-4 py-2 w-full mb-3"
                />

                <input
                    required
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="border rounded-lg px-4 py-2 w-full mb-3"
                />

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
                        onClick={handleCreate}
                        className="bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}