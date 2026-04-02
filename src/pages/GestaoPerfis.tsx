import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, MapPin, Settings, LogOut, Building2, Search, Shield, UserCog, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Usuario {
  id: number;
  nome: string;
  telefone: string;
  perfil: string;
  setorAtuacao: string | null;
}

export default function GestaoPerfis() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados da Modal
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [novoPerfil, setNovoPerfil] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const response = await axios.get('http://192.168.1.17:8080/api/cidadaos/todos');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const abrirDetalhes = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setNovoPerfil(usuario.perfil || 'CIDADAO');
    setNovoSetor(usuario.setorAtuacao || '');
  };

  const handleSalvarPerfil = async () => {
    if (!usuarioSelecionado) return;
    setIsSaving(true);
    try {
      const url = `http://192.168.1.17:8080/api/cidadaos/${usuarioSelecionado.id}/perfil`;
      
      // Se for Cidadão ou Super Admin, não tem setor específico
      const setorFinal = (novoPerfil === 'CIDADAO' || novoPerfil === 'SUPER_ADMIN') ? null : novoSetor;

      await axios.put(url, {
        perfil: novoPerfil,
        setorAtuacao: setorFinal
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

  // Cores dinâmicas para os perfis
  const getBadgePerfil = (perfil: string) => {
    switch(perfil) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'GESTOR_SETOR': return 'bg-blue-100 text-blue-700';
      case 'FUNCIONARIO': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700'; // CIDADAO
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      
      {/* MENU LATERAL */}
      <aside className="w-64 bg-white shadow-md flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 text-primary">
          <Building2 size={32} />
          <span className="text-xl font-bold">Iporã Gestão</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="#" onClick={() => navigate('/solicitacoes')} className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <MapPin size={20} /> Solicitações
          </a>
          <a href="#" onClick={() => navigate('/dashboard')} className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          {/* 🔴 GESTÃO DE PERFIS ATIVADA */}
          <a href="#" onClick={() => navigate('/perfis')} className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors">
            <Users size={20} /> Gestão de Perfis
          </a>
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
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full">
            <LogOut size={20} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Controlo de Acessos</h1>
            <p className="text-gray-500">Defina os cargos e permissões dos utilizadores do sistema.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar por nome..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"/>
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
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">A carregar utilizadores...</td></tr>
              ) : usuarios.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => abrirDetalhes(user)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    {user.nome}
                  </td>
                  <td className="p-4 text-gray-600">{user.telefone}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgePerfil(user.perfil)}`}>
                      {user.perfil ? user.perfil.replace('_', ' ') : 'CIDADÃO'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{user.setorAtuacao || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* 🔴 MODAL DE EDIÇÃO DE PERFIL */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <UserCog className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Alterar Permissões</h2>
              </div>
              <button onClick={() => setUsuarioSelecionado(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Utilizador Selecionado</p>
                <p className="font-bold text-lg text-gray-800">{usuarioSelecionado.nome}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield size={16} /> Nível de Acesso
                </label>
                <select 
                  value={novoPerfil} 
                  onChange={(e) => setNovoPerfil(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="CIDADAO">Cidadão (Apenas abre chamados)</option>
                  <option value="FUNCIONARIO">Operário (Vê chamados do setor)</option>
                  <option value="GESTOR_SETOR">Gestor (Administra um setor)</option>
                  <option value="SUPER_ADMIN">Super Admin (Acesso Total)</option>
                </select>
              </div>

              {/* Só mostra a escolha de setor se ele for Funcionário ou Gestor */}
              {(novoPerfil === 'FUNCIONARIO' || novoPerfil === 'GESTOR_SETOR') && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setor de Atuação</label>
                  <select 
                    value={novoSetor} 
                    onChange={(e) => setNovoSetor(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value="" disabled>Selecione um setor...</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Iluminação Pública">Iluminação Pública</option>
                    <option value="Urbanismo">Urbanismo</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Saneamento e água">Saneamento e água</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setUsuarioSelecionado(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSalvarPerfil} disabled={isSaving || ((novoPerfil === 'FUNCIONARIO' || novoPerfil === 'GESTOR_SETOR') && !novoSetor)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50">
                  {isSaving ? 'A guardar...' : 'Salvar Acesso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}