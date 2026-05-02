import { useState, useEffect, useMemo, useRef } from "react";
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
  Send,
  Menu,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import type { FiltroData } from "../utils/filtroData";
import { filtroDataInicial, labelFiltroData } from "../utils/filtroData";

interface Chamado {
  id: number;
  categoria: string;
  localizacao: string;
  latitude?: number;
  longitude?: number;
  status: string;
  dataCriacao: string;
  observacao?: string;
  urlImagem?: string;
  urlImagemResolvida?: string;
  resposta?: string;
  protocolo?: string;
  cidadao?: { nome: string; telefone: string; };
}

interface MensagemChat {
  id: number;
  texto: string;
  remetente: string;
  dataHora: string;
}

interface Setor {
  id: number;
  nome: string;
  icone: string;
}

interface LocationState {
  filtroStatus?: string;
  filtroSetor?: string;
  filtroData?: FiltroData;
}

function toLocalDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function hoje(): string { return toLocalDateString(new Date()); }

type ModoData = "TOTAL" | "DIA" | "INTERVALO" | "MES_ANO";

function PainelFiltroData({ filtro, onChange, onClose }: {
  filtro: FiltroData; onChange: (f: FiltroData) => void; onClose: () => void;
}) {
  const [local, setLocal] = useState<FiltroData>(filtro);

  const modos: { value: ModoData; label: string }[] = [
    { value: "TOTAL",     label: "Desde o início" },
    { value: "DIA",       label: "Dia específico" },
    { value: "MES_ANO",   label: "Mês / Ano" },
    { value: "INTERVALO", label: "Intervalo" },
  ];

  return (
    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5 w-72 sm:w-80">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-700">Filtrar por período</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modos.map((m) => (
          <button key={m.value}
            onClick={() => setLocal((l) => ({ ...l, modo: m.value }))}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all
              ${local.modo === m.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {local.modo === "DIA" && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Selecione o dia</label>
          <input type="date" max={hoje()} value={local.diaEspecifico}
            onChange={(e) => setLocal((l) => ({ ...l, diaEspecifico: e.target.value }))}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}
      {local.modo === "MES_ANO" && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Mês e ano</label>
          <input type="month" max={hoje().slice(0, 7)} value={local.mesAno}
            onChange={(e) => setLocal((l) => ({ ...l, mesAno: e.target.value }))}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}
      {local.modo === "INTERVALO" && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Data início</label>
            <input type="date" max={local.intervaloFim || hoje()} value={local.intervaloInicio}
              onChange={(e) => setLocal((l) => ({ ...l, intervaloInicio: e.target.value }))}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Data fim</label>
            <input type="date" min={local.intervaloInicio} max={hoje()} value={local.intervaloFim}
              onChange={(e) => setLocal((l) => ({ ...l, intervaloFim: e.target.value }))}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}
      <button onClick={() => { onChange(local); onClose(); }}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
      >
        Aplicar filtro
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Solicitacoes() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const locationState = (location.state as LocationState) ?? {};

  const [chamadosBrutos, setChamadosBrutos] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading]           = useState(true);

  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin  = usuarioLogado.perfil === "SUPER_ADMIN";
  const isPrefeito    = usuarioLogado.perfil === "PREFEITO";
  const cidadeAdmin   = usuarioLogado.cidade;
  const [setoresDaCidade, setSetoresDaCidade] = useState<Setor[]>([]);

  const [mensagens, setMensagens]         = useState<MensagemChat[]>([]);
  const [novaMensagem, setNovaMensagem]   = useState("");
  const [isEnviandoMsg, setIsEnviandoMsg] = useState(false);

  const logosPorCidade: Record<string, string> = {
    "Iporã do Oeste":      "/logos/logoeuamoipora.png",
    Itapiranga:            "/logos/logoeuamoipora.png",
    "São Miguel do Oeste": "/logos/logoeuamoipora.png",
    Tunápolis:             "/logos/logoeuamoipora.png",
  };
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [termoBusca,   setTermoBusca]   = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>(locationState.filtroStatus ?? "TODOS");
  const [filtroSetor,  setFiltroSetor]  = useState<string>(locationState.filtroSetor  ?? "");
  const [filtroData,   setFiltroData]   = useState<FiltroData>(locationState.filtroData ?? filtroDataInicial());
  const [painelDataAberto, setPainelDataAberto] = useState(false);
  // NOVO: menu drawer mobile
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  const [novoStatus,  setNovoStatus]  = useState("");
  const [novoSetor,   setNovoSetor]   = useState("");
  const [novaResposta, setNovaResposta] = useState("");
  const [isSaving,    setIsSaving]    = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    if (!usuarioLogado.id) { navigate("/"); return; }
    carregarChamados();
    carregarSetores();
  }, []);

  useEffect(() => {
    if (!location.state) {
      setFiltroStatus("TODOS");
      setFiltroSetor("");
      setFiltroData(filtroDataInicial());
      setTermoBusca("");
    }
  }, [location.key]);

  const carregarChamados = async () => {
    try {
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;
      if (!isSuperAdmin && !isPrefeito && usuarioLogado.setorAtuacao) {
        url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
      }
      const response = await axios.get(url);
      const ordenados = response.data.sort((a: Chamado, b: Chamado) =>
        new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );
      setChamadosBrutos(ordenados);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarSetores = async () => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/setores?cidade=${cidadeAdmin}`
      );
      setSetoresDaCidade(response.data);
    } catch (error) {
      console.error("Erro ao carregar os setores:", error);
    }
  };

  const chamadosFiltrados = useMemo(() => {
    let filtrados = [...chamadosBrutos];
    if (filtroData.modo !== "TOTAL") {
      filtrados = filtrados.filter((c) => {
        if (!c.dataCriacao) return false;
        const d    = new Date(c.dataCriacao.endsWith("Z") ? c.dataCriacao : `${c.dataCriacao}Z`);
        const dStr = toLocalDateString(d);
        const dMes = dStr.slice(0, 7);
        if (filtroData.modo === "DIA")       return dStr === filtroData.diaEspecifico;
        if (filtroData.modo === "MES_ANO")   return dMes === filtroData.mesAno;
        if (filtroData.modo === "INTERVALO") return dStr >= filtroData.intervaloInicio && dStr <= filtroData.intervaloFim;
        return true;
      });
    }
    if (filtroStatus !== "TODOS") {
      filtrados = filtrados.filter((c) => {
        const s = c.status ? c.status.replace(" ", "_") : "PENDENTE";
        return s === filtroStatus;
      });
    }
    if (filtroSetor.trim() !== "") {
      filtrados = filtrados.filter(
        (c) => c.categoria?.toLowerCase() === filtroSetor.toLowerCase()
      );
    }
    if (termoBusca.trim() !== "") {
      const texto = termoBusca.toLowerCase();
      filtrados = filtrados.filter((c) =>
        c.protocolo?.toLowerCase().includes(texto) ||
        c.localizacao?.toLowerCase().includes(texto) ||
        c.categoria?.toLowerCase().includes(texto)
      );
    }
    return filtrados;
  }, [chamadosBrutos, termoBusca, filtroData, filtroStatus, filtroSetor]);

  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    const d = new Date(dataString.endsWith("Z") ? dataString : `${dataString}Z`);
    return d.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).replace(",", " às");
  };

  const getImagemUrl = (urlOriginal?: string) => {
    if (!urlOriginal) return null;
    return urlOriginal.replace("file:///C:/ipora_imagens/", "https://tailorkz-production-eu-amo.up.railway.app/imagens/");
  };

  const abrirDetalhes = (chamado: Chamado) => {
    setChamadoSelecionado(chamado);
    setNovoStatus(chamado.status);
    setNovoSetor(chamado.categoria);
    setNovaResposta(chamado.resposta || "");
    carregarMensagens(chamado.id);
  };

  const carregarMensagens = async (solicitacaoId: number) => {
    try {
      const response = await axios.get(
        `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${solicitacaoId}/mensagens`
      );
      setMensagens(response.data);
    } catch (error) {
      console.error("Erro ao carregar chat:", error);
    }
  };

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (chamadoSelecionado?.id) {
      intervalo = setInterval(() => carregarMensagens(chamadoSelecionado.id), 5000);
    }
    return () => clearInterval(intervalo);
  }, [chamadoSelecionado]);

  const handleEnviarMensagemChat = async () => {
    if (!novaMensagem.trim() || !chamadoSelecionado) return;
    setIsEnviandoMsg(true);
    try {
      await axios.post(
        `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}/mensagens`,
        null,
        { params: { texto: novaMensagem, remetente: "PREFEITURA" } }
      );
      setNovaMensagem("");
      carregarMensagens(chamadoSelecionado.id);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar mensagem para o cidadão.");
    } finally {
      setIsEnviandoMsg(false);
    }
  };

  const handleSalvarAtualizacao = async () => {
    if (!chamadoSelecionado) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("status", novoStatus.replace(" ", "_"));
      formData.append("categoria", novoSetor);
      formData.append("resposta", novaResposta);
      await axios.put(
        `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}/atualizar-com-foto`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
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

  const handleExcluirChamado = async () => {
    if (!chamadoSelecionado) return;
    if (!window.confirm("PERIGO: Tem a certeza absoluta que deseja apagar este reporte?")) return;
    setIsSaving(true);
    try {
      await axios.delete(`https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/${chamadoSelecionado.id}`);
      alert("Solicitação excluída permanentemente!");
      setChamadoSelecionado(null);
      carregarChamados();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir a solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem("user_ipora"); navigate("/"); };

  const limparTodosFiltros = () => {
    setFiltroStatus("TODOS");
    setFiltroSetor("");
    setFiltroData(filtroDataInicial());
    setTermoBusca("");
  };

  const temFiltroAtivo =
    filtroStatus !== "TODOS" ||
    filtroSetor !== "" ||
    filtroData.modo !== "TOTAL" ||
    termoBusca !== "";

  const filtroDataAtivo = filtroData.modo !== "TOTAL";

  // ─── Sidebar compartilhado ────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="p-6 flex flex-col gap-1">
        <div className="flex justify-center items-center mb-4 mt-2">
          <img src={logoAtual} alt={`Eu amo ${cidadeAdmin} eu cuido`} className="h-16 w-auto object-contain" />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
          {isSuperAdmin ? "ADMINISTRAÇÃO GERAL" : `SETOR: ${usuarioLogado.setorAtuacao}`}
        </span>
        <span className="text-sm text-gray-600 font-medium text-center">Olá, {usuarioLogado.nome}</span>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-2">
        <a href="#"
          onClick={(e) => { e.preventDefault(); limparTodosFiltros(); setMenuMobileAberto(false); navigate("/solicitacoes", { replace: true }); }}
          className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors"
        >
          <MapPin size={20} /> Solicitações
        </a>
        <a href="#"
          onClick={(e) => { e.preventDefault(); setMenuMobileAberto(false); navigate("/dashboard"); }}
          className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LayoutDashboard size={20} /> Dashboard
        </a>
        {isSuperAdmin && (
          <>
            <a href="#"
              onClick={(e) => { e.preventDefault(); setMenuMobileAberto(false); navigate("/perfis"); }}
              className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users size={20} /> Gestão de Perfis
            </a>
            <a href="#"
              onClick={(e) => { e.preventDefault(); setMenuMobileAberto(false); navigate("/definicoes"); }}
              className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings size={20} /> Definições
            </a>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
        >
          <LogOut size={20} /> Terminar Sessão
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* ── SIDEBAR DESKTOP ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-col z-10">
        <SidebarContent />
      </aside>

      {/* ── DRAWER MOBILE ────────────────────────────────────────────────── */}
      {menuMobileAberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuMobileAberto(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── TABELA PRINCIPAL ─────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <header className="mb-5 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3">
              {/* Hamburger — só mobile */}
              <button
                className="md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600 flex-shrink-0"
                onClick={() => setMenuMobileAberto(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold text-gray-800">
                  {isSuperAdmin ? "Todas as Solicitações" : `Chamados: ${usuarioLogado.setorAtuacao}`}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Administre e responda aos chamados da população.</p>
              </div>
            </div>

            {/* Busca — só desktop (md+) */}
            <div className="hidden md:flex items-center gap-3">
              {temFiltroAtivo && (
                <button onClick={limparTodosFiltros}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-colors border border-gray-200"
                >
                  <X size={15} /> Limpar filtros
                </button>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por protocolo, rua ou setor..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-72 md:w-80 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Busca mobile — linha separada abaixo do header */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full shadow-sm text-sm"
              />
            </div>
            {temFiltroAtivo && (
              <button onClick={limparTodosFiltros}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors border border-gray-200 whitespace-nowrap"
              >
                <X size={13} /> Limpar
              </button>
            )}
          </div>

          {/* BARRA DE FILTROS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filtro de data */}
            <div className="relative">
              <button
                onClick={() => setPainelDataAberto((v) => !v)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold
                  transition-all shadow-sm
                  ${filtroDataAtivo
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}
              >
                <CalendarDays size={14} />
                <span className="max-w-[100px] sm:max-w-none truncate">{labelFiltroData(filtroData)}</span>
                {filtroDataAtivo && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setFiltroData(filtroDataInicial()); }}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    <X size={13} />
                  </span>
                )}
              </button>
              {painelDataAberto && (
                <PainelFiltroData
                  filtro={filtroData}
                  onChange={setFiltroData}
                  onClose={() => setPainelDataAberto(false)}
                />
              )}
            </div>

            {/* Filtro de status */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <Filter size={14} className="text-gray-400 flex-shrink-0" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-semibold outline-none cursor-pointer text-xs sm:text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="EM_ANDAMENTO">Andamento</option>
                <option value="RESOLVIDO">Resolvidos</option>
              </select>
            </div>

            {/* Banner de setor filtrado */}
            {filtroSetor && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
                <span className="text-xs sm:text-sm text-blue-700 font-semibold truncate max-w-[120px] sm:max-w-none">
                  <span className="hidden sm:inline">Setor: </span><strong>{filtroSetor}</strong>
                </span>
                <button onClick={() => setFiltroSetor("")} className="text-blue-400 hover:text-blue-700 transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Contador */}
            <span className="text-xs sm:text-sm text-gray-400 font-medium">
              {chamadosFiltrados.length} encontrados
            </span>
          </div>
        </header>

        {/* ── TABELA DESKTOP / CARDS MOBILE ────────────────────────────── */}

        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">A carregar dados...</td></tr>
                ) : chamadosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma solicitação encontrada para estes filtros.</td></tr>
                ) : (
                  chamadosFiltrados.map((chamado) => (
                    <tr key={chamado.id} onClick={() => abrirDetalhes(chamado)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-gray-500 font-bold whitespace-nowrap">{chamado.protocolo || `#${chamado.id}`}</td>
                      <td className="p-4 text-gray-800">{formatarData(chamado.dataCriacao)}</td>
                      <td className="p-4 font-medium text-gray-800">{chamado.categoria}</td>
                      <td className="p-4 text-gray-600 truncate max-w-xs">{chamado.localizacao}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          chamado.status === "RESOLVIDO"    ? "bg-green-100 text-green-700" :
                          chamado.status === "EM_ANDAMENTO" ? "bg-yellow-100 text-yellow-700" :
                                                              "bg-red-100 text-red-700"}`}>
                          {chamado.status ? chamado.status.replace("_", " ") : "PENDENTE"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow-sm border border-gray-100">A carregar dados...</div>
          ) : chamadosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow-sm border border-gray-100">Nenhuma solicitação encontrada.</div>
          ) : (
            chamadosFiltrados.map((chamado) => (
              <button
                key={chamado.id}
                onClick={() => abrirDetalhes(chamado)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left w-full hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400">{chamado.protocolo || `#${chamado.id}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${
                    chamado.status === "RESOLVIDO"    ? "bg-green-100 text-green-700" :
                    chamado.status === "EM_ANDAMENTO" ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-red-100 text-red-700"}`}>
                    {chamado.status ? chamado.status.replace("_", " ") : "PENDENTE"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{chamado.categoria}</p>
                <p className="text-xs text-gray-500 truncate mb-2">{chamado.localizacao}</p>
                <p className="text-[11px] text-gray-400">{formatarData(chamado.dataCriacao)}</p>
              </button>
            ))
          )}
        </div>
      </main>

      {chamadoSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200">

            {/* Header do modal */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {chamadoSelecionado.protocolo ? `Protocolo ${chamadoSelecionado.protocolo}` : `Solicitação #${chamadoSelecionado.id}`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Enviado em: {formatarData(chamadoSelecionado.dataCriacao)}</p>
              </div>
              <button onClick={() => setChamadoSelecionado(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Em mobile: coluna única. Em lg: 2 colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

                {/* COLUNA ESQUERDA */}
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                      <ImageIcon size={14} /> Foto do Local
                    </h3>
                    <div className="w-full h-48 sm:h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                      {getImagemUrl(chamadoSelecionado.urlImagem) ? (
                        <Zoom>
                          <img src={getImagemUrl(chamadoSelecionado.urlImagem) as string} alt="Foto do Problema" className="w-full h-48 sm:h-64 object-cover" />
                        </Zoom>
                      ) : (
                        <span className="text-gray-400 flex flex-col items-center py-12 sm:py-20">
                          <ImageIcon size={28} className="mb-2" /> Sem imagem anexada
                        </span>
                      )}
                    </div>
                  </div>
                  {chamadoSelecionado.urlImagemResolvida && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-green-600 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                        <ImageIcon size={14} /> Foto da Resolução
                      </h3>
                      <div className="w-full bg-green-50 rounded-xl overflow-hidden border border-green-200">
                        <Zoom>
                          <img src={getImagemUrl(chamadoSelecionado.urlImagemResolvida) as string} alt="Foto da Resolução" className="w-full h-48 sm:h-64 object-cover" />
                        </Zoom>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                      <MapPin size={14} /> Localização Informada
                    </h3>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3 text-sm">{chamadoSelecionado.localizacao}</p>
                    <div className="w-full h-40 sm:h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                        src={`https://maps.google.com/maps?q=${
                          chamadoSelecionado.latitude && chamadoSelecionado.longitude
                            ? `${chamadoSelecionado.latitude},${chamadoSelecionado.longitude}`
                            : encodeURIComponent(`${chamadoSelecionado.localizacao}, ${usuarioLogado.cidade}`)
                        }&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA */}
                <div className="space-y-5 sm:space-y-6 flex flex-col">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> Observação do Cidadão
                    </h3>
                    <p className="text-gray-700 bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100 italic text-sm">
                      "{chamadoSelecionado.observacao || "Nenhuma observação informada."}"
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 sm:pt-6">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                      <Users size={14} /> Dados do Solicitante
                    </h3>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-bold text-base sm:text-lg">{chamadoSelecionado.cidadao?.nome || "Cidadão não identificado"}</p>
                      <p className="text-gray-600 text-sm">{chamadoSelecionado.cidadao?.telefone || "Sem contato"}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 sm:pt-6">
                    <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> Chat com o Cidadão
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-64 sm:h-80 shadow-sm">
                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50 scroll-smooth">
                        {mensagens.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={28} className="mb-2 opacity-50" />
                            <p className="italic text-xs sm:text-sm">Nenhuma mensagem no histórico.</p>
                            <p className="text-xs">Tire dúvidas do cidadão por aqui!</p>
                          </div>
                        ) : (
                          mensagens.map((msg) => {
                            const isPrefeitura = msg.remetente === "PREFEITURA";
                            return (
                              <div key={msg.id} className={`flex flex-col w-fit max-w-[85%] ${isPrefeitura ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                <span className={`text-[11px] font-bold tracking-wide mb-1 ${isPrefeitura ? "text-primary" : "text-gray-500"}`}>
                                  {isPrefeitura ? "🏢 Você" : "👤 Cidadão"}
                                </span>
                                <div className={`p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm shadow-sm ${isPrefeitura ? "bg-primary text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"}`}>
                                  {msg.texto}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                                  {new Date(msg.dataHora).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex gap-2 sm:gap-3 items-center">
                        <input type="text" placeholder="Escreva uma mensagem..." value={novaMensagem}
                          onChange={(e) => setNovaMensagem(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEnviarMensagemChat()}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs sm:text-sm"
                        />
                        <button onClick={handleEnviarMensagemChat} disabled={isEnviandoMsg || !novaMensagem.trim()}
                          className="bg-primary hover:bg-primaryDark text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-md flex-shrink-0"
                        >
                          {isEnviandoMsg ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} className="-ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Ações do Setor</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Status</label>
                        <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}
                          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="EM ANDAMENTO">Em Andamento</option>
                          <option value="RESOLVIDO">Resolvido</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Transferir Setor</label>
                        <select value={novoSetor} onChange={(e) => setNovoSetor(e.target.value)}
                          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        >
                          <option value="" disabled>Selecione...</option>
                          {setoresDaCidade.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Resposta Oficial</label>
                      <textarea rows={3} value={novaResposta} onChange={(e) => setNovaResposta(e.target.value)}
                        className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
                    <div className="flex gap-2 sm:gap-3">
                      <button onClick={() => setChamadoSelecionado(null)}
                        className="flex-1 py-2.5 sm:py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                      <button onClick={handleSalvarAtualizacao} disabled={isSaving}
                        className="flex-1 py-2.5 sm:py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors disabled:opacity-50 text-sm"
                      >
                        {isSaving ? "A guardar..." : "Salvar"}
                      </button>
                    </div>
                    {isSuperAdmin && (
                      <button onClick={handleExcluirChamado} disabled={isSaving}
                        className="w-full py-2.5 sm:py-3 px-4 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                      >
                        Excluir Permanentemente
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