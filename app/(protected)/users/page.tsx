"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreateUserModal from "./components/CreateUserModal";
import EditUserModal from "./components/EditUserModal";
import ImportUsersModal from "./components/ImportUsersModal";


type User = {
  id: number;
  bd_user_id: string;
  user_id_chatguru: string;
  user_name: string;
  user_email: string;
  user_department: string;
  nome_do_gestor: string;
  user_status: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [managerFilter, setManagerFilter] = useState("");

  const managers = [
    ...new Set(users.map((u) => u.nome_do_gestor).filter(Boolean)),
  ].sort();

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.user_name.toLowerCase().includes(search.toLowerCase()) ||
        user.user_email.toLowerCase().includes(search.toLowerCase());

      const matchesManager =
        managerFilter === "" ||
        user.nome_do_gestor === managerFilter;

      return matchesSearch && matchesManager;
    })
    .sort((a, b) =>
      a.user_name.localeCompare(b.user_name, "pt-BR")
    );


  async function fetchUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("userChatguru")
      .select("*")
      .order("user_name", { ascending: true });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleDelete(user: User) {

    const confirmed = confirm(
      `Deseja remover ${user.user_name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("userChatguru")
      .delete()
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Erro ao remover usuário");
      return;
    }

    fetchUsers();
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">

        <h1 className="text-xl font-semibold text-black">
          Gestão de Usuários
        </h1>

        <div className="flex gap-2">

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-700 text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Novo usuário
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="bg-white border border-emerald-700 text-emerald-700 px-4 py-2 rounded-lg cursor-pointer"
          >
            Importar CSV
          </button>

        </div>

      </div>

      {/* Busca e Filtros */}
      <div className="mt-4 mb-4 flex gap-4">

        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-80 text-black"
        />

        <select
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-black"
        >
          <option value="">Todos os gestores</option>

          {managers.map((manager) => (
            <option key={manager} value={manager}>
              {manager}
            </option>
          ))}
        </select>

      </div>

      {/* Table */}
      <div className="mt-6 bg-white border rounded-lg overflow-hidden">

        <table className="w-full text-black">

          <thead className="bg-emerald-700 text-white">
            <tr>
              <th className="w-[23%] text-left px-5 py-4">Nome</th>
              <th className="w-[23%] text-left px-5 py-4">Email</th>
              <th className="w-[18%] text-left px-5 py-4">Departamento</th>
              <th className="w-[16%] text-left px-5 py-4">Gestor</th>
              <th className="w-[10%] text-left px-5 py-4">Status</th>
              <th className="w-[10%] text-center px-5 py-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.user_id_chatguru}
                className="border-t hover:bg-green-50"
              >
                <td className="p-3 text-black">{user.user_name}</td>
                <td className="p-3 text-black">{user.user_email}</td>
                <td className="p-3 text-black">{user.user_department}</td>
                <td className="p-3 text-black">{user.nome_do_gestor}</td>

                <td className="p-3 text-black">{user.user_status}</td>

                <td className="p-3 flex gap-3">

                  <button
                    className="text-green-700 hover:underline cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditOpen(true);
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className="text-red-600 hover:underline cursor-pointer"
                    onClick={() => handleDelete(user)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* 👇 AQUI FICA O MODAL */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchUsers}
      />

      <EditUserModal
        isOpen={isEditOpen}
        user={selectedUser}
        onClose={() => setIsEditOpen(false)}
        onUpdated={fetchUsers}
      />

      <ImportUsersModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={fetchUsers}
      />


    </div>
  );
}