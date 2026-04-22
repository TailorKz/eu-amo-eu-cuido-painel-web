import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  LogOut,
  Save,
  Image as ImageIcon,
  Bell,
  UserPlus,
  UserCheck,
  Briefcase,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// INTERFACE PARA O SETOR
interface Setor {
  id: number;
  nome: string;
  icone: string;
}

export default function Definicoes() {
  const navigate = useNavigate();

  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const cidadeAdmin = usuarioLogado.cidade;

  // ESTADOS DA CONFIGURAÇÃO GERAL
  const [imagemFundoLogin, setImagemFundoLogin] = useState("");
  const [tituloPopUp, setTituloPopUp] = useState("");
  const [mensagemPopUp, setMensagemPopUp] = useState("");
  const [popUpAtivo, setPopUpAtivo] = useState(false);
  const [popUpApenasUmaVez, setPopUpApenasUmaVez] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ESTADOS PARA OS SETORES
  const [setores, setSetores] = useState<Setor[]>([]);
  const [novoSetorNome, setNovoSetorNome] = useState("");
  const [novoSetorIcone, setNovoSetorIcone] = useState("");
  const [isSavingSetor, setIsSavingSetor] = useState(false);

  // ESTADOS PARA PRÉ-APROVAR NÚMERO (Sem Senha)
  const [vipTelefone, setVipTelefone] = useState("");
  const [vipPerfil, setVipPerfil] = useState("CIDADÃO");
  const [vipSetor, setVipSetor] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // ESTADOS PARA CRIAR CONTA DIRETA (Com Senha)
  const [diretoNome, setDiretoNome] = useState("");
  const [diretoTelefone, setDiretoTelefone] = useState("");
  const [diretoSenha, setDiretoSenha] = useState("");
  const [diretoPerfil, setDiretoPerfil] = useState("CIDADÃO");
  const [diretoSetor, setDiretoSetor] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!usuarioLogado.id || !isSuperAdmin) {
      navigate("/solicitacoes");
      return;
    }
    carregarConfiguracoes();
    carregarSetores();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/configuracoes?cidade=${cidadeAdmin}`,
      );
      const config = response.data;

      setImagemFundoLogin(config.imagemFundoLogin || "");
      setTituloPopUp(config.tituloPopUp || "");
      setMensagemPopUp(config.mensagemPopUp || "");
      setPopUpAtivo(config.popUpAtivo || false);
      setPopUpApenasUmaVez(config.popUpApenasUmaVez !== undefined ? config.popUpApenasUmaVez : true);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  // 🔴 ROTA CORRIGIDA: Usa exatamente o endpoint que sabemos que funciona!
  const carregarSetores = async () => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/setores?cidade=${cidadeAdmin}`
      );
      setSetores(response.data);
    } catch (error) {
      console.error("Erro ao carregar setores:", error);
    }
  };

  const handleSalvar = async () => {
    setIsSaving(true);
    try {
      await axios.put(
        `https://tailorkz-production-eu-amo.up.railway.app/api/configuracoes?cidade=${cidadeAdmin}`,
        {
          imagemFundoLogin,
          tituloPopUp,
          mensagemPopUp,
          popUpAtivo,
          popUpApenasUmaVez,
        },
      );
      alert("Configurações globais guardadas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao guardar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  // FUNÇÃO 1: PRÉ-APROVAR (Apenas Número e Cargo)
  const handlePreAprovarNumero = async () => {
    if (!vipTelefone || vipTelefone.length < 11) return alert("Preencha corretamente o número de celular (11 dígitos)!");
    if ((vipPerfil === "FUNCIONARIO" || vipPerfil === "GESTOR_SETOR") && !vipSetor) return alert("Selecione o Setor de Atuação.");

    setIsAuthorizing(true);
    try {
      await axios.post(
        "https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/admin-pre-aprovar",
        {
          telefone: vipTelefone,
          cidade: cidadeAdmin,
          perfil: vipPerfil,
          setorAtuacao: (vipPerfil === "FUNCIONARIO" || vipPerfil === "GESTOR_SETOR") ? vipSetor : null,
        },
      );
      alert("Número autorizado com sucesso! A pessoa receberá o cargo ao se cadastrar pelo app.");
      setVipTelefone("");
      setVipPerfil("CIDADÃO");
      setVipSetor("");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert("Erro: Este número já tem conta ou já foi autorizado.");
      } else {
        alert("Erro ao autorizar número.");
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  // FUNÇÃO 2: CRIAR CONTA COMPLETA DIRETO (Com Senha, ignora SMS)
  const handleCriarUsuarioDireto = async () => {
    if (!diretoNome || !diretoTelefone || !diretoSenha) return alert("Preencha o Nome, Celular e Senha Inicial!");
    if (diretoTelefone.length < 11) return alert("O telefone deve ter 11 dígitos.");
    if ((diretoPerfil === "FUNCIONARIO" || diretoPerfil === "GESTOR_SETOR") && !diretoSetor) return alert("Selecione o Setor de Atuação.");

    setIsCreatingUser(true);
    try {
      await axios.post(
        "https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/admin-criar",
        {
          nome: diretoNome,
          telefone: diretoTelefone,
          senha: diretoSenha,
          cidade: cidadeAdmin,
          perfil: diretoPerfil,
          setorAtuacao: (diretoPerfil === "FUNCIONARIO" || diretoPerfil === "GESTOR_SETOR") ? diretoSetor : null,
        },
      );
      alert("Conta completa criada com sucesso! Pode entregar o número e a senha para o acesso imediato.");
      setDiretoNome("");
      setDiretoTelefone("");
      setDiretoSenha("");
      setDiretoPerfil("CIDADÃO");
      setDiretoSetor("");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert("Erro: Este número de celular já está cadastrado.");
      } else {
        alert("Erro ao criar conta de acesso.");
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleAdicionarSetor = async () => {
    if (!novoSetorNome || !novoSetorIcone) return alert("Preencha o nome e o link da imagem do setor.");
    setIsSavingSetor(true);
    try {
      await axios.post(
        "https://tailorkz-production-eu-amo.up.railway.app/api/setores",
        { nome: novoSetorNome, icone: novoSetorIcone, cidade: cidadeAdmin },
      );
      setNovoSetorNome("");
      setNovoSetorIcone("");
      carregarSetores();
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar setor.");
    } finally {
      setIsSavingSetor(false);
    }
  };

  const handleApagarSetor = async (id: number) => {
    if (window.confirm("Tem certeza que deseja apagar este setor?")) {
      try {
        await axios.delete(`https://tailorkz-production-eu-amo.up.railway.app/api/setores/${id}`);
        carregarSetores();
      } catch (error) {
        console.error(error);
        alert("Erro ao apagar setor.");
      }
    }
  };

  const logosPorCidade: Record<string, string> = {
    "Iporã do Oeste": "/logos/logoeuamoipora.png",
    "Itapiranga": "/logos/logoeuamoipora.png",
    "São Miguel do Oeste": "/logos/logoeuamoipora.png",
    "Tunápolis": "/logos/logoeuamoipora.png",
  };

  // Se a cidade não tiver logo mapeada, ele pode carregar uma genérica
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";


  const handleLogout = () => {
    localStorage.removeItem("user_ipora");
    navigate("/");
  };

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
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            ADMINISTRAÇÃO GERAL
          </span>
          <span className="text-sm text-gray-600 font-medium">
            Olá, {usuarioLogado.nome}
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/solicitacoes"); }} className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <MapPin size={20} /> Solicitações
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/perfis"); }} className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} /> Gestão de Perfis
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/definicoes"); }} className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors">
            <Settings size={20} /> Definições
          </a>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full">
            <LogOut size={20} /> Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Definições do Sistema</h1>
            <p className="text-gray-500">Configure a aparência e acessos da plataforma.</p>
          </div>
          <button onClick={handleSalvar} disabled={isSaving} className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors disabled:opacity-50">
            <Save size={20} />
            {isSaving ? "A guardar..." : "Salvar Alterações"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* BLOCO 1: POP-UP DE AVISO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Aviso Geral (Pop-up)</h2>
                <p className="text-sm text-gray-500">Aparece para os cidadãos ao abrir o aplicativo.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700">Ativar Pop-up no Celular?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={popUpAtivo} onChange={(e) => setPopUpAtivo(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700">Mostrar apenas uma vez por pessoa?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={popUpApenasUmaVez} onChange={(e) => setPopUpApenasUmaVez(e.target.checked)} disabled={!popUpAtivo} />
                  <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!popUpAtivo ? "opacity-50" : "peer-checked:bg-primary"}`}></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título do Aviso</label>
                <input type="text" value={tituloPopUp} onChange={(e) => setTituloPopUp(e.target.value)} placeholder="Ex: Feriado Municipal" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" disabled={!popUpAtivo} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea rows={3} value={mensagemPopUp} onChange={(e) => setMensagemPopUp(e.target.value)} placeholder="Ex: Informamos que..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" disabled={!popUpAtivo}></textarea>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* BLOCO 2: IMAGEM DE FUNDO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Identidade Visual</h2>
                  <p className="text-sm text-gray-500">Imagem de fundo da tela de Login/Cadastro.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (URL) da Nova Imagem</label>
                <input type="text" value={imagemFundoLogin} onChange={(e) => setImagemFundoLogin(e.target.value)} placeholder="http://meusite.com/foto-cidade.jpg" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mb-3" />
                <p className="text-xs text-gray-500">* Se deixar em branco, o aplicativo usará a imagem padrão.</p>
              </div>
            </div>

            {/* BLOCO 3: PRÉ-APROVAÇÃO DE NÚMERO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Autorizar Número VIP</h2>
                  <p className="text-sm text-gray-500">A pessoa se cadastra pelo App e recebe o cargo.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Celular (Apenas Números)</label>
                    <input type="text" maxLength={11} value={vipTelefone} onChange={(e) => setVipTelefone(e.target.value.replace(/\D/g, ""))} placeholder="49999999999" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cargo / Perfil</label>
                    <select value={vipPerfil} onChange={(e) => { setVipPerfil(e.target.value); setVipSetor(""); }} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-white">
                      <option value="CIDADÃO">Cidadão</option>
                      <option value="VEREADOR">Vereador</option>
                      <option value="FUNCIONARIO">Funcionário setor</option>
                      <option value="GESTOR_SETOR">Gestor de Setor</option>
                      <option value="PREFEITO">Prefeito (Visão Global)</option>
                      <option value="SUPER_ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>

                {(vipPerfil === "FUNCIONARIO" || vipPerfil === "GESTOR_SETOR") && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase text-blue-600">Qual o Setor de Atuação?</label>
                    <select value={vipSetor} onChange={(e) => setVipSetor(e.target.value)} className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-blue-50">
                      <option value="" disabled>Escolha o setor...</option>
                      {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={handlePreAprovarNumero} disabled={isAuthorizing} className="w-full mt-2 py-2.5 bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm border border-purple-200">
                  {isAuthorizing ? "A autorizar..." : "Pré-aprovar Acesso"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CRIAÇÃO DIRETA DE CONTA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Criação Direta de Conta (Sem SMS)</h2>
              <p className="text-sm text-gray-500">Crie a conta completa com senha para pessoas que não recebem SMS ou para uso imediato.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nome Completo</label>
                <input type="text" value={diretoNome} onChange={(e) => setDiretoNome(e.target.value)} placeholder="Ex: João da Silva" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Celular (Sem espaços)</label>
                <input type="text" maxLength={11} value={diretoTelefone} onChange={(e) => setDiretoTelefone(e.target.value.replace(/\D/g, ""))} placeholder="49999999999" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Senha Inicial</label>
                <input type="text" value={diretoSenha} onChange={(e) => setDiretoSenha(e.target.value)} placeholder="Senha temporária" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cargo / Perfil</label>
                <select value={diretoPerfil} onChange={(e) => { setDiretoPerfil(e.target.value); setDiretoSetor(""); }} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                  <option value="CIDADÃO">Cidadão</option>
                  <option value="VEREADOR">Vereador</option>
                  <option value="FUNCIONARIO">Funcionário Setor</option>
                  <option value="GESTOR_SETOR">Gestor de Setor</option>
                  <option value="PREFEITO">Prefeito (Visão Global)</option>
                  <option value="SUPER_ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            {(diretoPerfil === "FUNCIONARIO" || diretoPerfil === "GESTOR_SETOR") && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase text-indigo-600">Qual o Setor de Atuação?</label>
                <select value={diretoSetor} onChange={(e) => setDiretoSetor(e.target.value)} className="w-full md:w-1/4 p-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-indigo-50">
                  <option value="" disabled>Escolha o setor...</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
            )}
            
            <button onClick={handleCriarUsuarioDireto} disabled={isCreatingUser} className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md">
              {isCreatingUser ? "A criar conta..." : "Criar Conta Imediata"}
            </button>
          </div>
        </div>

        {/* BLOCO DE SETORES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-green-50 text-green-500 rounded-lg">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Setores de Atendimento</h2>
              <p className="text-sm text-gray-500">Estes setores aparecem como botões na tela inicial do Cidadão.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Nome do Setor</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {setores.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-500">Nenhum setor cadastrado.</td>
                      </tr>
                    ) : (
                      setores.map((setor) => (
                        <tr key={setor.id} className="bg-white">
                          <td className="p-3 text-gray-500">#{setor.id}</td>
                          <td className="p-3 font-medium text-gray-800">{setor.nome}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleApagarSetor(setor.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 h-fit">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} /> Adicionar Novo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Setor</label>
                  <input type="text" value={novoSetorNome} onChange={(e) => setNovoSetorNome(e.target.value)} placeholder="Ex: Defesa Civil" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link da Imagem (URL)</label>
                  <input type="text" value={novoSetorIcone} onChange={(e) => setNovoSetorIcone(e.target.value)} placeholder="http://site.com/imagem.png" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                </div>
                <button onClick={handleAdicionarSetor} disabled={isSavingSetor} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                  {isSavingSetor ? "A adicionar..." : "Adicionar Setor"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO DE NOTIFICAÇÕES (PUSH) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Alerta de Emergência (Push)</h2>
              <p className="text-sm text-gray-500">Esta mensagem fará todos os celulares da cidade receberem a notificação.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título do Alerta</label>
                <input id="pushTitulo" type="text" placeholder="Ex: Alerta de Tempestade" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea id="pushMensagem" rows={3} placeholder="Ex: Evite sair de casa nas próximas 2 horas..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"></textarea>
              </div>
              <button onClick={async () => {
                const titulo = (document.getElementById("pushTitulo") as HTMLInputElement).value;
                const mensagem = (document.getElementById("pushMensagem") as HTMLTextAreaElement).value;
                if (!titulo || !mensagem) return alert("Preencha o título e a mensagem!");
                if (window.confirm("ATENÇÃO: Isto vai apitar no celular de todos os cidadãos. Confirmar?")) {
                  try {
                    await axios.post(`https://tailorkz-production-eu-amo.up.railway.app/api/configuracoes/enviar-alerta?titulo=${titulo}&mensagem=${mensagem}&cidade=${cidadeAdmin}`);
                    alert("Alertas disparados com sucesso!");
                    (document.getElementById("pushTitulo") as HTMLInputElement).value = "";
                    (document.getElementById("pushMensagem") as HTMLTextAreaElement).value = "";
                  } catch (error) { console.error(error); alert("Erro ao disparar alertas."); }
                }
              }} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-300 shadow-md shadow-red-200">
                Disparar Alerta para a Cidade
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}