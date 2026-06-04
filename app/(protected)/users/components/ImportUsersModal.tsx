"use client";

import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportUsersModal({
  isOpen,
  onClose,
  onImported,
}: Props) {

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  if (!isOpen) return null;

  async function handleSubmit() {

    if (!file) {
      alert("Selecione um arquivo CSV");
      return;
    }

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: async (
        results: Papa.ParseResult<any>
      ) => {

        try {

          const users = results.data.map(
            (user: any) => ({
              user_email: user.user_email,
              user_name: user.user_name,
              user_id_chatguru:
                user.user_id_chatguru,

              user_level:
                user.user_level,

              user_department:
                user.user_department,

              connection_overflow:
                user.connection_overflow,

              nome_do_gestor:
                user.nome_do_gestor,

              gestor_user_id:
                user.gestor_user_id,

              work_start_time:
                user.work_start_time,

              work_end_time:
                user.work_end_time,

              service_max_count:
                Number(
                  user.service_max_count
                ),
            })
          );

          const { error } =
            await supabase
              .from("userChatguru")
              .insert(users);

          if (error) {
            throw error;
          }

          setFile(null);

          onImported();
          onClose();

        } catch (error: any) {
          console.error("Erro completo:", error);
          console.error("Mensagem:", error?.message);
          console.error("Detalhes:", error?.details);
          console.error("Hint:", error?.hint);
          console.error("Code:", error?.code);

          alert(error?.message || "Erro ao atualizar usuário");
        } finally {

          setLoading(false);

        }
      }
    });
  }

  return (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-full max-w-lg">

        <div className="bg-emerald-700 text-white p-4 flex justify-between">

          <h2 className="font-semibold text-lg">
            Importar CSV
          </h2>

          <button onClick={onClose} className="cursor-pointer">
            ✕
          </button>

        </div>

        <div className="p-6 space-y-4">

          <p className="text-black">

            Selecione um arquivo CSV contendo:

          </p>

          <div className="bg-gray-100 p-3 rounded text-sm text-black">

            user_email<br />
            user_name<br />
            user_id_chatguru<br />
            user_level<br />
            user_department<br />
            connection_overflow<br />
            work_start_time<br />
            work_end_time<br />
            service_max_count

          </div>

          <div className="space-y-2">

            <label className="text-black font-medium">
              Arquivo CSV
            </label>

            <label
              className="
      flex items-center justify-center
      w-full p-4
      border-2 border-dashed
      border-emerald-600
      rounded-lg
      bg-gray-50
      hover:bg-emerald-50
      cursor-pointer
      transition
    "
            >
              <span className="text-black">

                {file
                  ? `📄 ${file.name}`
                  : "Clique para selecionar um arquivo CSV"}

              </span>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

          </div>

        </div>

        <div className="border-t p-4 flex justify-end gap-2">

          <button
            onClick={onClose}
            className="
      border
      px-4 py-2
      rounded
      text-black
      cursor-pointer
    "
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="
      bg-emerald-700
      text-white
      px-4 py-2
      rounded
      cursor-pointer
      hover:bg-emerald-800
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
          >
            {loading
              ? "Importando..."
              : "Importar usuários"}
          </button>

        </div>

      </div>

    </div>

  );

}