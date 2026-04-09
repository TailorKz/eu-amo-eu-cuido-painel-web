import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  LogOut,
  Building2,
  Search,
  X,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface Chamado {
  id: number;
  categoria: string;
  localizacao: string;
  status: string;
  dataCriacao: string;
  observacao?: string;
  urlImagem?: string;
  urlImagemResolvida?: string;
  resposta?: string;
  protocolo?: string;
  cidadao?: {
    nome: string;
    telefone: string;
  };
}
interface Setor {
  id: number;
  nome: string;
  icone: string;
}

export default function Solicitacoes() {
  const navigate = useNavigate();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LÊ O CRACHÁ DO UTILIZADOR LOGADO
  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const cidadeAdmin = usuarioLogado.cidade;
  const [setoresDaCidade] = useState<Setor[]>([]);
  // Estados da Modal
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(
    null,
  );
  const [novoStatus, setNovoStatus] = useState("");
  const [novoSetor, setNovoSetor] = useState("");
  const [novaResposta, setNovaResposta] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Se por acaso alguém tentar entrar na página sem fazer login, é chutado para fora!
    if (!usuarioLogado.id) {
      navigate("/");
      return;
    }
    carregarChamados();
  }, []);

  const carregarChamados = async () => {
    try {
      //  SE FOR ADMIN, PUXA TUDO. SE NÃO, PUXA SÓ O SETOR DELE!
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;

      if (!isSuperAdmin && usuarioLogado.setorAtuacao) {
        // Se for funcionário, pega do setor DELE, na cidade DELE
        url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
      }

      const response = await axios.get(url);

// Organiza matematicamente do mais recente para o mais antigo
const chamadosOrdenados = response.data.sort((a: Chamado, b: Chamado) => {
  return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
});

setChamados(chamadosOrdenados);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    const dataCorrigida = dataString.endsWith('Z') ? dataString : `${dataString}Z`;
    
    const data = new Date(dataCorrigida);
    
    return data.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(",", " às");
  };

  const getImagemUrl = (urlOriginal?: string) => {
    if (!urlOriginal) return null;
    return urlOriginal.replace(
      "file:///C:/ipora_imagens/",
      "https://tailorkz-production-eu-amo.up.railway.app/imagens/",
    );
  };

  const abrirDetalhes = (chamado: Chamado) => {
    setChamadoSelecionado(chamado);
    setNovoStatus(chamado.status);
    setNovoSetor(chamado.categoria);
    setNovaResposta(chamado.resposta || "");
  };

  const handleSalvarAtualizacao = async () => {
    if (!chamadoSelecionado) return;
    setIsSaving(true);
    try {
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}`;
      await axios.put(url, {
        status: novoStatus.replace(" ", "_"),
        categoria: novoSetor,
        resposta: novaResposta,
      });
      alert("Solicitação atualizada com sucesso!");
      setChamadoSelecionado(null);
      carregarChamados();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_ipora"); // Apaga o crachá ao sair
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* MENU LATERAL */}
      <aside className="w-64 bg-white shadow-md flex flex-col z-10">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Building2 size={32} />
            <span className="text-xl font-bold">Iporã Gestão</span>
          </div>
          {/* 🔴 MOSTRA QUEM ESTÁ LOGADO E O SETOR DELE */}
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isSuperAdmin
              ? "ADMINISTRAÇÃO GERAL"
              : `SETOR: ${usuarioLogado.setorAtuacao}`}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            Olá, {usuarioLogado.nome}
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/solicitacoes");
            }}
            className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors"
          >
            <MapPin size={20} /> Solicitações
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
            className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LayoutDashboard size={20} /> Dashboard
          </a>

          {/* 🔴 3. ESCONDE O MENU DE PERFIS SE NÃO FOR ADMIN */}
          {isSuperAdmin && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/perfis");
              }}
              className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users size={20} /> Gestão de Perfis
            </a>
          )}

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: TABELA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isSuperAdmin
                ? "Todas as Solicitações"
                : `Chamados: ${usuarioLogado.setorAtuacao}`}
            </h1>
            <p className="text-gray-500">
              Administre e responda aos chamados da população.
            </p>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por rua ou setor..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Protocolo</th>
                  <th className="p-4 font-semibold">Data e Hora</th>
                  <th className="p-4 font-semibold">Setor</th>
                  <th className="p-4 font-semibold">Localização</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      A carregar dados...
                    </td>
                  </tr>
                ) : chamados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  chamados.map((chamado) => (
                    <tr
                      key={chamado.id}
                      onClick={() => abrirDetalhes(chamado)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Clique na linha para ver os detalhes"
                    >
                      <td className="p-4 text-gray-500 font-bold whitespace-nowrap">
                        {chamado.protocolo || `#${chamado.id}`}
                      </td>
                      <td className="p-4 text-gray-800">
                        {formatarData(chamado.dataCriacao)}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {chamado.categoria}
                      </td>
                      <td className="p-4 text-gray-600 truncate max-w-xs">
                        {chamado.localizacao}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            chamado.status === "RESOLVIDO"
                              ? "bg-green-100 text-green-700"
                              : chamado.status === "EM_ANDAMENTO"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {chamado.status
                            ? chamado.status.replace("_", " ")
                            : "PENDENTE"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* SUPER MODAL (MANTIDA IGUAL) */}
      {chamadoSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {chamadoSelecionado.protocolo
                    ? `Protocolo ${chamadoSelecionado.protocolo}`
                    : `Solicitação #${chamadoSelecionado.id}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enviado em: {formatarData(chamadoSelecionado.dataCriacao)}
                </p>
              </div>
              <button
                onClick={() => setChamadoSelecionado(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ImageIcon size={16} /> Foto do Local
                    </h3>
                    <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                      {getImagemUrl(chamadoSelecionado.urlImagem) ? (
                        <Zoom>
                          <img
                            src={
                              getImagemUrl(
                                chamadoSelecionado.urlImagem,
                              ) as string
                            }
                            alt="Foto do Problema"
                            className="w-full h-64 object-cover"
                          />
                        </Zoom>
                      ) : (
                        <span className="text-gray-400 flex flex-col items-center py-20">
                          <ImageIcon size={32} className="mb-2" />
                          Sem imagem anexada
                        </span>
                      )}
                    </div>
                  </div>
                  {/* MOSTRA A FOTO DA RESOLUÇÃO PARA O GESTOR/ADMIN COM ZOOM */}
                  {chamadoSelecionado.urlImagemResolvida && (
                    <div className="mt-6">
                      <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ImageIcon size={16} /> Foto da Resolução (Funcionário)
                      </h3>
                      <div className="w-full bg-green-50 rounded-xl overflow-hidden border border-green-200 flex items-center justify-center">
                        <Zoom>
                          <img
                            src={
                              getImagemUrl(
                                chamadoSelecionado.urlImagemResolvida,
                              ) as string
                            }
                            alt="Foto da Resolução"
                            className="w-full h-64 object-cover"
                          />
                        </Zoom>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin size={16} /> Localização Informada
                    </h3>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                      {chamadoSelecionado.localizacao}
                    </p>
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        // Agora usa HTTPS e pega a cidade dinâmica do Admin logado!
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(chamadoSelecionado.localizacao + ", " + usuarioLogado.cidade)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare size={16} /> Observação do Cidadão
                    </h3>
                    <p className="text-gray-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100 italic">
                      "
                      {chamadoSelecionado.observacao ||
                        "Nenhuma observação informada."}
                      "
                    </p>
                  </div>

                  {/* 🔴 NOVO: Bloco com os dados de quem reportou */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users size={16} /> Dados do Solicitante
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-bold text-lg">
                        {chamadoSelecionado.cidadao?.nome ||
                          "Cidadão não identificado"}
                      </p>
                      <p className="text-gray-600">
                        {chamadoSelecionado.cidadao?.telefone || "Sem contato"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Ações do Setor
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status da Solicitação
                        </label>
                        <select
                          value={novoStatus}
                          onChange={(e) => setNovoStatus(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="EM ANDAMENTO">Em Andamento</option>
                          <option value="RESOLVIDO">Resolvido</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transferir Setor
                        </label>
                        <select
                          value={novoSetor}
                          onChange={(e) => setNovoSetor(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        >
                          {/* A MÁGICA ACONTECE AQUI: Ele cria as opções com base na base de dados */}
                          {setoresDaCidade.map((setor) => (
                            <option key={setor.id} value={setor.nome}>
                              {setor.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resposta Oficial
                      </label>
                      <textarea
                        rows={4}
                        value={novaResposta}
                        onChange={(e) => setNovaResposta(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setChamadoSelecionado(null)}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvarAtualizacao}
                      disabled={isSaving}
                      className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "A guardar..." : "Salvar Alterações"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
