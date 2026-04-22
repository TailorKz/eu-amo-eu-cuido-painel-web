import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  LogOut,
  Search,
  Shield,
  UserCog,
  X,
  Ban,
  CheckCircle,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Usuario {
  id: number;
  nome: string;
  telefone: string;
  perfil: string;
  setorAtuacao: string | null;
  bloqueado?: boolean;
}

interface Setor {
  id: number;
  nome: string;
  icone: string;
}

export default function GestaoPerfis() {
  const navigate = useNavigate();
  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const isGestor = usuarioLogado.perfil === "GESTOR_SETOR";
  const cidadeAdmin = usuarioLogado.cidade;
  const meuSetor = usuarioLogado.setorAtuacao;

  const logosPorCidade: Record<string, string> = {
    "Iporã do Oeste": "/logos/logoeuamoipora.png",
    Itapiranga: "/logos/logoeuamoipora.png",
    "São Miguel do Oeste": "/logos/logoeuamoipora.png",
    Tunápolis: "/logos/logoeuamoipora.png",
  };

  // Se a cidade não tiver logo mapeada, ele carrega uma genérica
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setoresDaCidade, setSetoresDaCidade] = useState<Setor[]>([]);
  const [termoBusca, setTermoBusca] = useState("");

  // Estados da Modal de Edição
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null,
  );
  const [novoPerfil, setNovoPerfil] = useState("");
  const [novoSetor, setNovoSetor] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  //  Estados da Modal de Adicionar Membro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTelefone, setAddTelefone] = useState("");
  const [addPerfil, setAddPerfil] = useState("FUNCIONARIO");
  const [addSetor, setAddSetor] = useState(isSuperAdmin ? "" : meuSetor);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!usuarioLogado.id || !isSuperAdmin) {
      navigate("/solicitacoes");
      return;
    }
    carregarUsuarios();
    carregarSetores();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/cidade/${cidadeAdmin}`,
      );
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarSetores = async () => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/setores?cidade=${cidadeAdmin}`,
      );
      setSetoresDaCidade(response.data);
    } catch (error) {
      console.error("Erro ao carregar setores:", error);
    }
  };

  const abrirDetalhes = (usuario: Usuario) => {
    if (!isSuperAdmin && usuario.perfil === "SUPER_ADMIN")
      return alert("Acesso negado. Utilizador de nível superior.");
    if (
      !isSuperAdmin &&
      usuario.perfil === "GESTOR_SETOR" &&
      usuario.setorAtuacao !== meuSetor
    )
      return alert("Não pode editar um gestor de outro setor.");

    setUsuarioSelecionado(usuario);
    setNovoPerfil(usuario.perfil || "CIDADÃO");
    setNovoSetor(usuario.setorAtuacao || (isSuperAdmin ? "" : meuSetor));
  };

  const handleSalvarPerfil = async () => {
    if (!usuarioSelecionado) return;
    setIsSaving(true);
    try {
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/${usuarioSelecionado.id}/perfil`;
      const setorFinal =
        novoPerfil === "CIDADÃO" ||
        novoPerfil === "SUPER_ADMIN" ||
        novoPerfil === "VEREADOR"
          ? null
          : novoSetor;

      await axios.put(url, {
        perfil: novoPerfil === "CIDADÃO" ? null : novoPerfil,
        setorAtuacao: setorFinal,
      });
      alert("Perfil atualizado com sucesso!");
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlternarBloqueio = async (bloquear: boolean) => {
    if (!usuarioSelecionado) return;
    const acao = bloquear
      ? "BANIR e bloquear o acesso de"
      : "RESTAURAR o acesso de";
    if (
      !window.confirm(
        `ATENÇÃO: Tem a certeza que deseja ${acao} este utilizador no seu município?`,
      )
    )
      return;

    setIsSaving(true);
    try {
      await axios.put(
        `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/${usuarioSelecionado.id}/bloquear?bloquear=${bloquear}`,
      );
      alert(`Utilizador ${bloquear ? "banido" : "restaurado"} com sucesso!`);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      alert(`Erro ao ${bloquear ? "banir" : "restaurar"} utilizador.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluirUsuario = async () => {
    if (!usuarioSelecionado) return;
    if (
      !window.confirm(
        `PERIGO: Tem a certeza absoluta que deseja EXCLUIR PERMANENTEMENTE a conta de ${usuarioSelecionado.nome}?`,
      )
    )
      return;

    setIsSaving(true);
    try {
      await axios.delete(
        `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/admin-excluir/${usuarioSelecionado.id}`,
      );
      alert("Conta excluída permanentemente do sistema!");
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir a conta do utilizador.");
    } finally {
      setIsSaving(false);
    }
  };

  // Puxa um usuário existente para a equipe pelo número
  const handleAdicionarMembro = async () => {
    if (!addTelefone || addTelefone.length < 11)
      return alert("Preencha corretamente o número de celular (11 dígitos)!");
    if (!addSetor) return alert("Selecione o Setor de Atuação.");

    setIsCreatingUser(true);
    try {
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/promover-por-telefone?telefone=${addTelefone}&cidade=${cidadeAdmin}&perfil=${addPerfil}&setorAtuacao=${addSetor}`;

      await axios.put(url);

      alert(`O utilizador foi adicionado com sucesso à equipa: ${addSetor}!`);
      setIsAddModalOpen(false);
      setAddTelefone("");
      carregarUsuarios();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        alert(
          "Erro: Não existe conta para este número. O utilizador tem de instalar o App e fazer o registo inicial primeiro!",
        );
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        alert("Erro: Esta conta está banida do município.");
      } else {
        alert("Erro ao adicionar membro.");
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const getBadgePerfil = (user: Usuario) => {
    if (user.bloqueado) return "bg-red-100 text-red-700 border border-red-200";
    switch (user.perfil) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700";
      case "GESTOR_SETOR":
        return "bg-blue-100 text-blue-700";
      case "FUNCIONARIO":
        return "bg-amber-100 text-amber-700";
      case "VEREADOR":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      u.telefone.includes(termoBusca);
    if (isSuperAdmin) return matchBusca;

    const noMeuSetor = u.setorAtuacao === meuSetor;
    const isCidadao = !u.perfil || u.perfil === "CIDADÃO";
    return matchBusca && (noMeuSetor || isCidadao);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col z-10">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex justify-center items-center mb-4 mt-2">
            <img
              src={logoAtual}
              alt={`Eu amo ${cidadeAdmin} eu cuido`}
              className="h-16 w-auto object-contain"
            />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
            {isSuperAdmin ? "ADMINISTRAÇÃO GERAL" : `SETOR: ${meuSetor}`}
          </span>
          <span className="text-sm text-gray-600 font-medium text-center">
            Olá, {usuarioLogado.nome}
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a
            href="#"
            onClick={() => navigate("/solicitacoes")}
            className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MapPin size={20} /> Solicitações
          </a>
          <a
            href="#"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LayoutDashboard size={20} /> Dashboard
          </a>
          {(isSuperAdmin || isGestor) && (
            <a
              href="#"
              onClick={() => navigate("/perfis")}
              className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors"
            >
              <Users size={20} />{" "}
              {isSuperAdmin ? "Gestão de Perfis" : "Meu Setor"}
            </a>
          )}
          {isSuperAdmin && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/definicoes");
              }}
              className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings size={20} /> Definições
            </a>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              localStorage.removeItem("user_ipora");
              navigate("/");
            }}
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} /> Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isSuperAdmin ? "Controle de Acessos" : `Equipe: ${meuSetor}`}
            </h1>
            <p className="text-gray-500">
              {isSuperAdmin
                ? "Defina cargos, permissões e bloqueios."
                : "Atribua cidadãos já registados à sua equipa."}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64 shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primaryDark transition-colors shadow-sm"
            >
              <UserPlus size={20} /> Adicionar Membro
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Utilizador</th>
                <th className="p-4 font-semibold">Contacto</th>
                <th className="p-4 font-semibold">Nível de Acesso</th>
                <th className="p-4 font-semibold">Setor de Atuação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    A carregar equipa...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => abrirDetalhes(user)}
                    className={`cursor-pointer transition-colors ${user.bloqueado ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-blue-50"}`}
                  >
                    <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${user.bloqueado ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}
                      >
                        {user.nome.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={
                          user.bloqueado ? "line-through text-gray-400" : ""
                        }
                      >
                        {user.nome}
                      </span>
                      {user.bloqueado && (
                        <span
                          title="Usuário Banido"
                          className="flex items-center"
                        >
                          <Ban size={14} className="text-red-500 ml-1" />
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-4 ${user.bloqueado ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {user.telefone}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgePerfil(user)}`}
                      >
                        {user.bloqueado
                          ? "BANIDO"
                          : user.perfil
                            ? user.perfil.replace("_", " ")
                            : "CIDADÃO"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {user.setorAtuacao || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ATRIBUIR EXISTENTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <UserPlus className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  {isSuperAdmin ? "Atribuir Cargo" : `Novo Membro: ${meuSetor}`}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Digite o número de quem já usa o aplicativo para promovê-lo a
                Colaborador ou Gestor.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Celular (DDD+Número)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={addTelefone}
                  onChange={(e) =>
                    setAddTelefone(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="11999999999"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cargo / Perfil
                </label>
                <select
                  value={addPerfil}
                  onChange={(e) => setAddPerfil(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                  <option value="FUNCIONARIO">Colaborador do Setor</option>
                  <option value="GESTOR_SETOR">Gestor do Setor</option>
                  <option value="PREFEITO">Prefeito (Visão Global)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Setor de Atuação
                </label>
                <select
                  value={addSetor}
                  onChange={(e) => setAddSetor(e.target.value)}
                  disabled={!isSuperAdmin}
                  className={`w-full p-3 border rounded-lg outline-none ${!isSuperAdmin ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-300 focus:ring-2 focus:ring-primary"}`}
                >
                  {!isSuperAdmin ? (
                    <option value={meuSetor}>{meuSetor}</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Selecione...
                      </option>
                      {setoresDaCidade.map((s) => (
                        <option key={s.id} value={s.nome}>
                          {s.nome}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={handleAdicionarMembro}
                disabled={isCreatingUser}
                className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50"
              >
                {isCreatingUser ? "A processar..." : "Salvar Membro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO DE PERFIL / SEGURANÇA */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <UserCog className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  Gerir Utilizador
                </h2>
              </div>
              <button
                onClick={() => setUsuarioSelecionado(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Identificação</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-800">
                    {usuarioSelecionado.nome}
                  </p>
                  {usuarioSelecionado.bloqueado && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      Banido
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {usuarioSelecionado.telefone}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${usuarioSelecionado.bloqueado ? "bg-gray-50 border-gray-200 opacity-60 pointer-events-none" : "border-blue-100 bg-blue-50/30"}`}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Nível de Acesso
                </label>
                <select
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                  <option value="CIDADÃO">
                    Cidadão (Apenas abre chamados)
                  </option>
                  <option value="FUNCIONARIO">
                    Colaborador (Vê/responde chamados do setor)
                  </option>
                  <option value="GESTOR_SETOR">
                    Gestor (Administra um setor)
                  </option>
                  <option value="PREFEITO">Prefeito (Visão Global)</option>{" "}
                  {isSuperAdmin && (
                    <option value="VEREADOR">Vereador / Fiscalização</option>
                  )}
                  {isSuperAdmin && (
                    <option value="SUPER_ADMIN">
                      Super Admin (Acesso Total)
                    </option>
                  )}
                </select>

                {(novoPerfil === "FUNCIONARIO" ||
                  novoPerfil === "GESTOR_SETOR") && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Setor de Atuação
                    </label>
                    <select
                      value={novoSetor}
                      onChange={(e) => setNovoSetor(e.target.value)}
                      disabled={!isSuperAdmin}
                      className={`w-full p-3 border rounded-lg outline-none ${!isSuperAdmin ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-300 focus:ring-2 focus:ring-primary"}`}
                    >
                      {!isSuperAdmin ? (
                        <option value={meuSetor}>{meuSetor}</option>
                      ) : (
                        <>
                          <option value="" disabled>
                            Selecione um setor...
                          </option>
                          {setoresDaCidade.map((setor) => (
                            <option key={setor.id} value={setor.nome}>
                              {setor.nome}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleSalvarPerfil}
                  disabled={
                    isSaving ||
                    ((novoPerfil === "FUNCIONARIO" ||
                      novoPerfil === "GESTOR_SETOR") &&
                      !novoSetor)
                  }
                  className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50"
                >
                  {isSaving ? "A guardar..." : "Salvar Permissões"}
                </button>
              </div>

              {/* BLOCO DE SEGURANÇA (Só Super Admin) */}
              {isSuperAdmin && usuarioSelecionado.id !== usuarioLogado.id && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Zona de Segurança
                  </h3>
                  <div className="flex flex-col gap-2">
                    {usuarioSelecionado.bloqueado ? (
                      <button
                        onClick={() => handleAlternarBloqueio(false)}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={18} /> Restaurar Acesso do Utilizador
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAlternarBloqueio(true)}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Ban size={18} /> Banir do Município
                      </button>
                    )}

                    <button
                      onClick={handleExcluirUsuario}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} /> Excluir Conta Permanentemente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
