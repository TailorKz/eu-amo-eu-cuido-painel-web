import { useState, useEffect, useMemo } from "react";
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
  Menu,
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
  dataCadastro?: string;
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
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("novo-antigo");
  const [setoresDaCidade, setSetoresDaCidade] = useState<Setor[]>([]);
  const [termoBusca, setTermoBusca] = useState("");

  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [novoPerfil, setNovoPerfil] = useState("");
  
  const [novoSetor, setNovoSetor] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTelefone, setAddTelefone] = useState("");
  const [addPerfil, setAddPerfil] = useState("FUNCIONARIO");
  
  // O setor no modal de adicionar também é um Array
  const [addSetor, setAddSetor] = useState<string[]>(isSuperAdmin ? [] : [meuSetor]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  useEffect(() => {
    if (!usuarioLogado.id || (!isSuperAdmin && !isGestor)) {
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

  const converterData = (data: string | number[] | undefined | null) => {
    if (!data) return 0;
    if (Array.isArray(data)) {
      return new Date(data[0], data[1] - 1, data[2], data[3] || 0, data[4] || 0).getTime();
    }
    const parsed = new Date(data).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const usuariosFiltrados = useMemo(() => {
    let lista = [...usuarios];

    lista = lista.filter((u) => {
      const nomeSeguro = u.nome || "Pendente";
      const telefoneSeguro = u.telefone || "";
      const matchBusca =
        nomeSeguro.toLowerCase().includes(termoBusca.toLowerCase()) ||
        telefoneSeguro.includes(termoBusca);
      
      if (isSuperAdmin) return matchBusca;
      
      // Ajuste: O Gestor agora verifica se o seu setor está "incluído" no texto
      const noMeuSetor = u.setorAtuacao ? u.setorAtuacao.includes(meuSetor) : false;
      const isCidadao = !u.perfil || u.perfil === "CIDADÃO";
      return matchBusca && (noMeuSetor || isCidadao);
    });

    if (filtroData === "ultimo-mes") {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      const tempoLimite = trintaDiasAtras.getTime();
      
      lista = lista.filter((user) => {
        const tempoUser = converterData(user.dataCadastro);
        return tempoUser > 0 && tempoUser >= tempoLimite; 
      });
    }

    lista.sort((a, b) => {
      const tempoA = converterData(a.dataCadastro);
      const tempoB = converterData(b.dataCadastro);
      if (filtroData === "antigo-novo") return tempoA - tempoB;
      return tempoB - tempoA;
    });

    return lista;
  }, [usuarios, filtroData, termoBusca, isSuperAdmin, meuSetor]);

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
    
    // Ajuste: O Gestor só pode editar se o seu setor estiver na lista do funcionário
    if (!isSuperAdmin && usuario.perfil === "GESTOR_SETOR" && (!usuario.setorAtuacao || !usuario.setorAtuacao.includes(meuSetor)))
      return alert("Não pode editar um gestor que não pertence ao seu setor.");
    
    setUsuarioSelecionado(usuario);
    setNovoPerfil(usuario.perfil || "CIDADÃO");

    // Converte o texto separado por vírgulas que vem do Java num Array
    if (usuario.setorAtuacao) {
      setNovoSetor(usuario.setorAtuacao.split(",").map(s => s.trim()));
    } else {
      setNovoSetor(isSuperAdmin ? [] : [meuSetor]);
    }
  };

  // Função para marcar/desmarcar checkboxes do modal de edição
  const toggleNovoSetor = (setorNome: string) => {
    setNovoSetor(prev => 
      prev.includes(setorNome) 
        ? prev.filter(s => s !== setorNome) 
        : [...prev, setorNome]
    );
  };

  // Função para marcar/desmarcar checkboxes do modal de adicionar
  const toggleAddSetor = (setorNome: string) => {
    setAddSetor(prev => 
      prev.includes(setorNome) 
        ? prev.filter(s => s !== setorNome) 
        : [...prev, setorNome]
    );
  };

  const handleSalvarPerfil = async () => {
    if (!usuarioSelecionado) return;
    setIsSaving(true);
    try {
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/${usuarioSelecionado.id}/perfil`;
      
      // Junta o array novamente numa string com vírgulas para o Java
      const setorFinal =
        novoPerfil === "CIDADÃO" || novoPerfil === "SUPER_ADMIN" || novoPerfil === "VEREADOR"
          ? null : novoSetor.join(", ");
          
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
    const acao = bloquear ? "BANIR e bloquear o acesso de" : "RESTAURAR o acesso de";
    if (!window.confirm(`ATENÇÃO: Tem a certeza que deseja ${acao} este utilizador no seu município?`)) return;
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
    if (!window.confirm(`PERIGO: Tem a certeza absoluta que deseja EXCLUIR PERMANENTEMENTE a conta de ${usuarioSelecionado.nome}?`)) return;
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

  const handleAdicionarMembro = async () => {
    if (!addTelefone || addTelefone.length < 11)
      return alert("Preencha corretamente o número de celular (11 dígitos)!");
    if (addSetor.length === 0) return alert("Selecione pelo menos um Setor de Atuação.");
    
    setIsCreatingUser(true);
    try {
      // Transforma o Array em String e usa o encodeURIComponent para ser seguro enviar pela URL
      const setoresConcatenados = encodeURIComponent(addSetor.join(", "));
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/promover-por-telefone?telefone=${addTelefone}&cidade=${cidadeAdmin}&perfil=${addPerfil}&setorAtuacao=${setoresConcatenados}`;
      
      await axios.put(url);
      alert(`O utilizador foi adicionado com sucesso à equipe!`);
      setIsAddModalOpen(false);
      setAddTelefone("");
      // Limpa os setores do modal
      setAddSetor(isSuperAdmin ? [] : [meuSetor]);
      carregarUsuarios();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        alert("Erro: Não existe conta para este número. O utilizador tem de instalar o App e fazer o registo inicial primeiro!");
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
      case "SUPER_ADMIN": return "bg-purple-100 text-purple-700";
      case "GESTOR_SETOR": return "bg-blue-100 text-blue-700";
      case "FUNCIONARIO": return "bg-amber-100 text-amber-700";
      case "VEREADOR": return "bg-emerald-100 text-emerald-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex flex-col gap-1">
        <div className="flex justify-center items-center mb-4 mt-2">
          <img src={logoAtual} alt={`Eu amo ${cidadeAdmin} eu cuido`} className="h-16 w-auto object-contain" />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
          {isSuperAdmin ? "ADMINISTRAÇÃO GERAL" : `SETOR: ${meuSetor}`}
        </span>
        <span className="text-sm text-gray-600 font-medium text-center">Olá, {usuarioLogado.nome}</span>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <a href="#" onClick={() => { setMenuMobileAberto(false); navigate("/solicitacoes"); }}
          className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <MapPin size={20} /> Solicitações
        </a>
        <a href="#" onClick={() => { setMenuMobileAberto(false); navigate("/dashboard"); }}
          className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <LayoutDashboard size={20} /> Dashboard
        </a>
        {(isSuperAdmin || isGestor) && (
          <a href="#" onClick={() => { setMenuMobileAberto(false); navigate("/perfis"); }}
            className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors">
            <Users size={20} />{isSuperAdmin ? "Gestão de Perfis" : "Meu Setor"}
          </a>
        )}
        {isSuperAdmin && (
          <a href="#" onClick={(e) => { e.preventDefault(); setMenuMobileAberto(false); navigate("/definicoes"); }}
            className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings size={20} /> Definições
          </a>
        )}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={() => { localStorage.removeItem("user_ipora"); navigate("/"); }}
          className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full">
          <LogOut size={20} /> Terminar Sessão
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-col z-10">
        <SidebarContent />
      </aside>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuMobileAberto(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <header className="mb-5 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600 flex-shrink-0"
                onClick={() => setMenuMobileAberto(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold text-gray-800">
                  {isSuperAdmin ? "Controle de Acessos" : `Equipe: ${meuSetor}`}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isSuperAdmin ? "Defina cargos, permissões e bloqueios." : "Atribua cidadãos já registados à sua equipe."}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  Exibindo {usuariosFiltrados.length} utilizadores
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              
              <div className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg shadow-sm flex items-center pr-2">
                 <select
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="w-full p-2 bg-transparent text-sm text-gray-600 outline-none cursor-pointer"
                  >
                    <option value="novo-antigo">Mais recentes primeiro</option>
                    <option value="antigo-novo">Mais antigos primeiro</option>
                    <option value="ultimo-mes">Apenas do último mês</option>
                 </select>
              </div>

              <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou número..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64 shadow-sm text-sm"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto flex justify-center items-center gap-1.5 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg font-bold hover:bg-primaryDark transition-colors shadow-sm text-sm whitespace-nowrap"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Adicionar Membro</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            </div>
          </div>
        </header>

        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">A carregar usuários...</td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum utilizador encontrado.</td></tr>
              ) : (
                usuariosFiltrados.map((user) => (
                  <tr key={user.id} onClick={() => abrirDetalhes(user)}
                    className={`cursor-pointer transition-colors ${user.bloqueado ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-blue-50"}`}
                  >
                    <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${user.bloqueado ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                        {user.nome ? user.nome.charAt(0).toUpperCase() : "?"}
                      </div>
                      <span className={user.bloqueado ? "line-through text-gray-400" : ""}>
                        {user.nome || <span className="text-gray-400 italic">Pendente (Aguardando Registo)</span>}
                      </span>
                      {user.bloqueado && <Ban size={14} className="text-red-500 ml-1" />}
                    </td>
                    <td className={`p-4 ${user.bloqueado ? "text-gray-400" : "text-gray-600"}`}>{user.telefone}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgePerfil(user)}`}>
                        {user.bloqueado ? "BANIDO" : user.perfil ? user.perfil.replace("_", " ") : "CIDADÃO"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{user.setorAtuacao || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow-sm border border-gray-100">A carregar usuários...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow-sm border border-gray-100">Nenhum utilizador encontrado.</div>
          ) : (
            usuariosFiltrados.map((user) => (
              <button key={user.id} onClick={() => abrirDetalhes(user)}
                className={`rounded-xl shadow-sm border p-4 text-left w-full transition-shadow hover:shadow-md active:scale-[0.99]
                  ${user.bloqueado ? "bg-red-50/40 border-red-100" : "bg-white border-gray-100"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${user.bloqueado ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                      {user.nome ? user.nome.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className={`text-sm font-semibold text-gray-800 ${user.bloqueado ? "line-through text-gray-400" : ""}`}>
                      {user.nome || <span className="text-gray-400 italic text-xs">Pendente</span>}
                    </span>
                    {user.bloqueado && <Ban size={12} className="text-red-500" />}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${getBadgePerfil(user)}`}>
                    {user.bloqueado ? "BANIDO" : user.perfil ? user.perfil.replace("_", " ") : "CIDADÃO"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{user.telefone}</p>
                {user.setorAtuacao && <p className="text-xs text-gray-400 mt-0.5">{user.setorAtuacao}</p>}
              </button>
            ))
          )}
        </div>
      </main>

      {/* ── MODAL ADICIONAR MEMBRO ────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserPlus className="text-primary" size={22} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  {isSuperAdmin ? "Atribuir Cargo" : `Novo Membro: ${meuSetor}`}
                </h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-gray-500">
                Digite o número de quem já usa o aplicativo para promovê-lo a Colaborador ou Gestor.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Celular (DDD+Número)</label>
                <input type="text" inputMode="numeric" maxLength={11} value={addTelefone}
                  onChange={(e) => setAddTelefone(e.target.value.replace(/\D/g, ""))}
                  placeholder="11999999999"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cargo / Perfil</label>
                <select value={addPerfil} onChange={(e) => setAddPerfil(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-sm">
                  <option value="FUNCIONARIO">Colaborador do Setor</option>
                  <option value="GESTOR_SETOR">Gestor do Setor</option>
                  <option value="PREFEITO">Prefeito (Visão Global)</option>
                </select>
              </div>

              {/* Seleção Múltipla de Setores (Adicionar) */}
              {addPerfil !== "PREFEITO" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Setores de Atuação</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {!isSuperAdmin ? (
                      <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-80 cursor-not-allowed">
                        <input type="checkbox" checked disabled className="w-4 h-4 text-primary rounded" />
                        <span className="text-sm text-gray-700 font-medium truncate">{meuSetor}</span>
                      </label>
                    ) : (
                      setoresDaCidade.map((setor) => (
                        <label key={setor.id} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${addSetor.includes(setor.nome) ? 'bg-primary/5 border-primary/30' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox" 
                            checked={addSetor.includes(setor.nome)} 
                            onChange={() => toggleAddSetor(setor.nome)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary" 
                          />
                          <span className="text-sm text-gray-700 font-medium truncate">{setor.nome}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <button onClick={handleAdicionarMembro} disabled={isCreatingUser || (addPerfil !== "PREFEITO" && addSetor.length === 0)}
                className="w-full mt-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50 text-sm">
                {isCreatingUser ? "A processar..." : "Salvar Membro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PERFIL ───────────────────────────────────────────── */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserCog className="text-primary" size={22} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Gerir Utilizador</h2>
              </div>
              <button onClick={() => setUsuarioSelecionado(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              <div>
                <p className="text-sm text-gray-500 mb-1">Identificação</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-800">{usuarioSelecionado.nome}</p>
                  {usuarioSelecionado.bloqueado && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Banido</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{usuarioSelecionado.telefone}</p>
              </div>

              <div className={`p-4 rounded-xl border ${usuarioSelecionado.bloqueado ? "bg-gray-50 border-gray-200 opacity-60 pointer-events-none" : "border-blue-100 bg-blue-50/30"}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Nível de Acesso
                </label>
                <select value={novoPerfil} onChange={(e) => setNovoPerfil(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-sm">
                  <option value="CIDADÃO">Cidadão (Apenas abre chamados)</option>
                  <option value="FUNCIONARIO">Colaborador (Vê/responde chamados do setor)</option>
                  <option value="GESTOR_SETOR">Gestor (Administra um setor)</option>
                  <option value="PREFEITO">Prefeito (Visão Global)</option>
                  {isSuperAdmin && <option value="VEREADOR">Vereador / Fiscalização</option>}
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin (Acesso Total)</option>}
                </select>

                {/* Seleção Múltipla de Setores (Editar) */}
                {(novoPerfil === "FUNCIONARIO" || novoPerfil === "GESTOR_SETOR") && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Setores de Atuação</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {!isSuperAdmin ? (
                        <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg opacity-80 cursor-not-allowed">
                          <input type="checkbox" checked disabled className="w-4 h-4 text-primary rounded" />
                          <span className="text-sm text-gray-700 font-medium truncate">{meuSetor}</span>
                        </label>
                      ) : (
                        setoresDaCidade.map((setor) => (
                          <label key={setor.id} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${novoSetor.includes(setor.nome) ? 'bg-primary/5 border-primary/30' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                              type="checkbox" 
                              checked={novoSetor.includes(setor.nome)} 
                              onChange={() => toggleNovoSetor(setor.nome)}
                              className="w-4 h-4 text-primary rounded focus:ring-primary" 
                            />
                            <span className="text-sm text-gray-700 font-medium truncate">{setor.nome}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                <button onClick={handleSalvarPerfil}
                  disabled={isSaving || ((novoPerfil === "FUNCIONARIO" || novoPerfil === "GESTOR_SETOR") && novoSetor.length === 0)}
                  className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50 text-sm">
                  {isSaving ? "A guardar..." : "Salvar Permissões"}
                </button>
              </div>

              {isSuperAdmin && usuarioSelecionado.id !== usuarioLogado.id && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Zona de Segurança</h3>
                  <div className="flex flex-col gap-2">
                    {usuarioSelecionado.bloqueado ? (
                      <button onClick={() => handleAlternarBloqueio(false)} disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm">
                        <CheckCircle size={17} /> Restaurar Acesso do Utilizador
                      </button>
                    ) : (
                      <button onClick={() => handleAlternarBloqueio(true)} disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm">
                        <Ban size={17} /> Banir do Município
                      </button>
                    )}
                    <button onClick={handleExcluirUsuario} disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm">
                      <Trash2 size={17} /> Excluir Conta Permanentemente
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