"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const departmentOptions = [
  "N1 Chatbot/Integrações",
  "N1 Premium/WL",
  "Não autorizado",
  "Parceiros",
  "N1 Problemas",
  "N1 Whatsapp",
  "N1 Dúvidas",
  "N1 Quarentena",
  "N1 Financeiro",
  "Ativação WABA",
  "Noturno",
  "Escalation Premium",
  "Escalation Problemas",
  "Escalation Dúvidas",
  "Escalation ChatBot",
  "Escalation Whatsapp",
];


export default function CreateUserModal({
  isOpen,
  onClose,
  onCreated,
}: Props) {


  type Gestor = {
    user_name: string;
    user_id_chatguru: string;
  };

  const [gestores, setGestores] = useState<Gestor[]>([]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    user_email: "",
    user_name: "",
    user_id_chatguru: "",
    user_level: "N1",
    user_department: [] as string[],
    connection_overflow: [] as string[],
    nome_do_gestor: "",
    gestor_user_id: "",
    work_start_time: "",
    work_end_time: "",
    service_max_count: "",
    gestor: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    async function buscarGestores() {
      const { data, error } = await supabase
        .from("userChatguru")
        .select("user_name, user_id_chatguru")
        .eq("gestor", true)
        .order("user_name", { ascending: true });

      if (error) {
        console.error(error);
        alert("Erro ao buscar gestores");
        return;
      }

      setGestores(data || []);
    }

    buscarGestores();
  }, [isOpen]);



  if (!isOpen) return null;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    });
  }

  function handleCheckbox(
    field: "user_department" | "connection_overflow",
    value: string
  ) {
    const current = form[field];

    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    setForm({
      ...form,
      [field]: updated,
    });
  }

  function handleGestorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const gestorSelecionado = gestores.find(
      gestor => gestor.user_id_chatguru === e.target.value
    );

    setForm({
      ...form,
      nome_do_gestor: gestorSelecionado?.user_name || "",
      gestor_user_id: gestorSelecionado?.user_id_chatguru || "",
    });
  }

  function resetForm() {
    setForm({
      user_email: "",
      user_name: "",
      user_id_chatguru: "",
      user_level: "N1",
      user_department: [],
      connection_overflow: [],
      nome_do_gestor: "",
      gestor_user_id: "",
      work_start_time: "",
      work_end_time: "",
      service_max_count: "",
      gestor: false,
    });
  }

  async function handleSubmit() {

    // validações

    if (!form.user_email.trim()) {
      alert("Preencha o campo E-mail");
      return;
    }

    if (!form.user_name.trim()) {
      alert("Preencha o campo Nome");
      return;
    }

    if (!form.user_id_chatguru.trim()) {
      alert("Preencha o campo User ID");
      return;
    }

    if (form.user_department.length === 0) {
      alert("Selecione pelo menos um Departamento");
      return;
    }

    if (!form.nome_do_gestor.trim()) {
      alert("Preencha o Nome do gestor");
      return;
    }

    if (!form.gestor_user_id.trim()) {
      alert("Selecione um gestor");
      return;
    }

    if (!form.work_start_time) {
      alert("Informe o horário de início");
      return;
    }

    if (!form.work_end_time) {
      alert("Informe o horário de fim");
      return;
    }

    if (!form.service_max_count) {
      alert("Informe o limite de chats simultâneos");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("userChatguru")
        .insert([
          {
            user_email: form.user_email,
            user_name: form.user_name,
            user_id_chatguru: form.user_id_chatguru,
            user_level: form.user_level,
            gestor: form.gestor,

            user_department:
              form.user_department.join(", "),

            connection_overflow:
              form.connection_overflow.join(", "),

            nome_do_gestor:
              form.nome_do_gestor,

            gestor_user_id:
              form.gestor_user_id,

            work_start_time:
              form.work_start_time,

            work_end_time:
              form.work_end_time,

            service_max_count:
              Math.max(
                0,
                Number(form.service_max_count)
              ),
          },
        ]);

      if (error) {
        throw error;
      }

      // limpa formulário após sucesso
      resetForm();

      // atualiza tabela
      onCreated();

      // fecha modal
      onClose();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao criar usuário"
      );

    } finally {

      // SEMPRE executa
      setLoading(false);

    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-4">

      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-4 flex justify-between shrink-0">
          <h2 className="font-semibold text-lg">
            Novo Usuário
          </h2>

          <button onClick={onClose} className="cursor-pointer">
            ✕
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <label className="text-black">
            E-mail*
          </label>

          <input
            name="user_email"
            placeholder="E-mail"
            value={form.user_email}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black"
          />

          <label className="text-black">
            Nome*
          </label>

          <input
            name="user_name"
            placeholder="Nome"
            value={form.user_name}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black"
          />

          <label className="text-black">
            user_id*
          </label>

          <input
            name="user_id_chatguru"
            placeholder="User ID ChatGuru"
            value={form.user_id_chatguru}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black"
          />

          <label className="text-black">
            Nível
          </label>

          <select
            name="user_level"
            value={form.user_level}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black"
          >
            <option>N1</option>
            <option>N2</option>
          </select>

          <div className="flex items-center border rounded p-3 text-black">
            <label htmlFor="gestor" className="mr-2">
              Este usuário é um gestor?
            </label>

            <input
              type="checkbox"
              id="gestor"
              checked={form.gestor}
              onChange={(e) =>
                setForm({
                  ...form,
                  gestor: e.target.checked,
                })
              }
              className="cursor-pointer"
            />
          </div>


          {/* Departamento */}

          <div>
            <label className="font-medium text-black">
              Departamento*
            </label>

            <div className="grid grid-cols-2 gap-2 mt-2">

              {departmentOptions.map(item => (

                <label
                  key={item}
                  className="flex gap-2 text-black"
                >
                  <input
                    type="checkbox"
                    checked={form.user_department.includes(item)}
                    onChange={() =>
                      handleCheckbox(
                        "user_department",
                        item
                      )
                    }
                  />

                  {item}
                </label>

              ))}

            </div>
          </div>

          {/* Overflow */}

          <div>
            <label className="font-medium text-black">
              Atende transbordo de
            </label>

            <div className="grid grid-cols-2 gap-2 mt-2">

              {departmentOptions.map(item => (

                <label
                  key={item}
                  className="flex gap-2 text-black"
                >
                  <input
                    type="checkbox"
                    checked={form.connection_overflow.includes(item)}
                    onChange={() =>
                      handleCheckbox(
                        "connection_overflow",
                        item
                      )
                    }
                  />

                  {item}
                </label>

              ))}

            </div>
          </div>

          <label className="text-black">
            Nome do gestor*
          </label>

          <label className="text-black">
            Gestor*
          </label>

          <select
            value={form.gestor_user_id}
            onChange={handleGestorChange}
            className="w-full border rounded p-3 text-black"
          >
            <option value="">
              Selecione um gestor
            </option>

            {gestores.map(gestor => (
              <option
                key={gestor.user_id_chatguru}
                value={gestor.user_id_chatguru}
              >
                {gestor.user_name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-black">
                Horário de inicio do atendimento*
              </label>

              <input
                type="time"
                name="work_start_time"
                value={form.work_start_time}
                onChange={handleChange}
                className="w-full border rounded p-3 text-black"
              />
            </div>

            <div>
              <label className="text-black">
                Horário do Fim do atendimento*
              </label>

              <input
                type="time"
                name="work_end_time"
                value={form.work_end_time}
                onChange={handleChange}
                className="w-full border rounded p-3 text-black"
              />
            </div>

          </div>
          <label className="text-black">
            Limite de chats simultâneos*
          </label>
          <input
            type="number"
            name="service_max_count"
            placeholder="Limite de chats simultâneos"
            value={form.service_max_count}
            onChange={handleChange}
            min={0}
            step={1}
            className="w-full border rounded p-3 text-black"
          />

        </div>

        {/* Footer fixo */}
        <div className="border-t p-4 flex justify-end gap-2 shrink-0 bg-white">

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded text-black cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            {loading
              ? "Criando..."
              : "Criar usuário"}
          </button>

        </div>

      </div>

    </div>
  );
}