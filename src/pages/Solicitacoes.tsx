import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  LogOut,
  Search,
  X,
  Image as ImageIcon,
  MessageSquare,
  CalendarDays,
  Filter,
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

  const [chamadosBrutos, setChamadosBrutos] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LÊ O CRACHÁ DO UTILIZADOR LOGADO
  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const cidadeAdmin = usuarioLogado.cidade;
  const [setoresDaCidade, setSetoresDaCidade] = useState<Setor[]>([]);

  // LÓGICA DAS LOGOS DINÂMICAS
  const logosPorCidade: Record<string, string> = {
    "Iporã do Oeste": "/logos/logoeuamoipora.png",
    Itapiranga: "/logos/logoeuamoipora.png",
    "São Miguel do Oeste": "/logos/logoeuamoipora.png",
    Tunápolis: "/logos/logoeuamoipora.png",
  };

  // Se a cidade não tiver logo mapeada, ele carrega uma genérica
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [termoBusca, setTermoBusca] = useState("");
  const [filtroTempo, setFiltroTempo] = useState("TOTAL"); // TOTAL, MES, ANO
  const [filtroStatus, setFiltroStatus] = useState("TODOS"); // TODOS, PENDENTE, EM_ANDAMENTO, RESOLVIDO

  // ESTADOS DA MODAL DE DETALHES
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(
    null,
  );
  const [novoStatus, setNovoStatus] = useState("");
  const [novoSetor, setNovoSetor] = useState("");
  const [novaResposta, setNovaResposta] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!usuarioLogado.id) {
      navigate("/");
      return;
    }
    carregarChamados();
    carregarSetores();
  }, []);

  const carregarChamados = async () => {
    try {
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;

      if (!isSuperAdmin && usuarioLogado.setorAtuacao) {
        url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
      }

      const response = await axios.get(url);

      const chamadosOrdenados = response.data.sort((a: Chamado, b: Chamado) => {
        return (
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        );
      });

      setChamadosBrutos(chamadosOrdenados); // Guarda a lista original aqui!
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
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
      console.error("Erro ao carregar os setores:", error);
    }
  };

  const chamadosFiltrados = useMemo(() => {
    let filtrados = [...chamadosBrutos];
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    //  FILTRA POR TEMPO
    if (filtroTempo !== "TOTAL") {
      filtrados = filtrados.filter((c) => {
        if (!c.dataCriacao) return false;
        const dataCorrigida = c.dataCriacao.endsWith("Z")
          ? c.dataCriacao
          : `${c.dataCriacao}Z`;
        const dataChamado = new Date(dataCorrigida);

        if (filtroTempo === "MES")
          return (
            dataChamado.getMonth() === mesAtual &&
            dataChamado.getFullYear() === anoAtual
          );
        if (filtroTempo === "ANO")
          return dataChamado.getFullYear() === anoAtual;
        return true;
      });
    }

    // FILTRA POR STATUS
    if (filtroStatus !== "TODOS") {
      filtrados = filtrados.filter((c) => {
        const statusNormalizado = c.status
          ? c.status.replace(" ", "_")
          : "PENDENTE";
        return statusNormalizado === filtroStatus;
      });
    }

    // Pesquisa de texto
    if (termoBusca.trim() !== "") {
      const texto = termoBusca.toLowerCase();
      filtrados = filtrados.filter((c) => {
        return (
          c.protocolo?.toLowerCase().includes(texto) ||
          c.localizacao?.toLowerCase().includes(texto) ||
          c.categoria?.toLowerCase().includes(texto)
        );
      });
    }

    return filtrados;
  }, [chamadosBrutos, termoBusca, filtroTempo, filtroStatus]);

  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    const dataCorrigida = dataString.endsWith("Z")
      ? dataString
      : `${dataString}Z`;
    const data = new Date(dataCorrigida);
    return data
      .toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " às");
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

  // transferir setores
  const handleSalvarAtualizacao = async () => {
    if (!chamadoSelecionado) return;
    setIsSaving(true);
    try {
      const url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}/atualizar-com-foto`;

      const formData = new FormData();
      formData.append("status", novoStatus.replace(" ", "_"));
      formData.append("categoria", novoSetor);
      formData.append("resposta", novaResposta);

      await axios.put(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Solicitação atualizada com sucesso!");
      setChamadoSelecionado(null);
      carregarChamados(); // Atualiza os dados brutos da API
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  // FUNÇÃO PARA O SUPER ADMIN APAGAR O CHAMADO
  const handleExcluirChamado = async () => {
    if (!chamadoSelecionado) return;

    if (
      !window.confirm(
        "PERIGO: Tem a certeza absoluta que deseja apagar este reporte? Esta ação não pode ser desfeita.",
      )
    )
      return;

    setIsSaving(true);
    try {
      await axios.delete(
        `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}`,
      );
      alert("Solicitação excluída permanentemente!");
      setChamadoSelecionado(null);
      carregarChamados(); // Recarrega a tabela
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir a solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_ipora");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* MENU LATERAL */}
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
            {isSuperAdmin
              ? "ADMINISTRAÇÃO GERAL"
              : `SETOR: ${usuarioLogado.setorAtuacao}`}
          </span>
          <span className="text-sm text-gray-600 font-medium text-center">
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
          {(isSuperAdmin || usuarioLogado.perfil === "GESTOR_SETOR") && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/perfis");
              }}
              className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* TABELA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex justify-between items-start">
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

            {/* pesquisa */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por protocolo, rua ou setor..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-72 md:w-80 shadow-sm"
              />
            </div>
          </div>

          {/* BARRA DE FILTROS AVANÇADOS */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-fit">
            <div className="flex items-center gap-2 px-2 border-r border-gray-200">
              <CalendarDays size={18} className="text-gray-400" />
              <select
                value={filtroTempo}
                onChange={(e) => setFiltroTempo(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-semibold outline-none cursor-pointer py-1"
              >
                <option value="TOTAL">Desde o Início</option>
                <option value="ANO">Este Ano</option>
                <option value="MES">Este Mês</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-semibold outline-none cursor-pointer py-1"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="RESOLVIDO">Resolvidos</option>
              </select>
            </div>
            {/* Conta quantos chamados passaram no filtro */}
            <span className="text-sm text-gray-400 ml-4 font-medium">
              {chamadosFiltrados.length} encontrados
            </span>
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
                ) : chamadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhuma solicitação encontrada para estes filtros.
                    </td>
                  </tr>
                ) : (
                  chamadosFiltrados.map((chamado) => (
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

      {/* MODAL */}
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
                          <ImageIcon size={32} className="mb-2" /> Sem imagem
                          anexada
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
                          <option value="" disabled>
                            Selecione um setor...
                          </option>
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

                  <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-gray-100">
                    <div className="flex gap-3">
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

                    {/*  BOTÃO DE EXCLUIR: APARECE APENAS PARA O SUPER ADMIN */}
                    {isSuperAdmin && (
                      <button
                        onClick={handleExcluirChamado}
                        disabled={isSaving}
                        className="w-full py-3 px-4 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 mt-2"
                      >
                        Excluir Solicitação Permanentemente
                      </button>
                    )}
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
