import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, Users, MapPin, Settings, LogOut,
  CalendarDays, TrendingUp, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, RefreshCw, ChevronRight, X, Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { FiltroData, ModoData } from "../utils/filtroData";
import { filtroDataInicial, labelFiltroData } from "../utils/filtroData";


interface Chamado {
  id: number;
  categoria: string;
  status: string;
  dataCriacao: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDENTE:     { label: "Pendente",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  RESOLVIDO:    { label: "Resolvido",    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
};

const PIE_COLORS = ["#EF4444", "#F59E0B", "#10B981"];

const logosPorCidade: Record<string, string> = {
  "Iporã do Oeste":      "/logos/logoeuamoipora.png",
  Itapiranga:            "/logos/logoeuamoipora.png",
  "São Miguel do Oeste": "/logos/logoeuamoipora.png",
  Tunápolis:             "/logos/logoeuamoipora.png",
};

function toLocalDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function hoje(): string { return toLocalDateString(new Date()); }


// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, color, icon, onClick }: {
  title: string; value: number | string; sub?: string;
  color: string; icon: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-left w-full
        transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-2.5 rounded-xl" style={{ backgroundColor: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-300 mt-1" />}
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1 hidden sm:block">{sub}</p>}
    </button>
  );
}

// ─── Célula da Matriz ─────────────────────────────────────────────────────────
function MatrizCell({ valor, setor, status, total, onClick }: {
  valor: number; setor: string; status: string; total: number; onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  if (valor === 0) return <td className="p-1 sm:p-2 text-center"><span className="text-gray-300 text-sm">—</span></td>;
  return (
    <td className="p-1 sm:p-2 text-center">
      <button onClick={onClick}
        title={`${valor} chamado(s) ${cfg.label} em ${setor}`}
        className="group inline-flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border
          transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-w-[48px] sm:min-w-[64px]"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <span className="text-base sm:text-lg font-bold leading-none" style={{ color: cfg.color }}>{valor}</span>
        <span className="text-[10px] font-medium text-gray-400">{pct}%</span>
        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cfg.color }} />
      </button>
    </td>
  );
}

// ─── Painel flutuante de filtro de data ───────────────────────────────────────
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
    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5 w-72 sm:w-80">
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

// ─── Dashboard Principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const isPrefeito   = usuarioLogado.perfil === "PREFEITO";
  const cidadeAdmin  = usuarioLogado.cidade;
  const logoAtual    = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [todosChamados, setTodosChamados] = useState<Chamado[]>([]);
  const [filtroData, setFiltroData]       = useState<FiltroData>(filtroDataInicial());
  const [painelAberto, setPainelAberto]   = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  // NOVO: controla o menu lateral mobile
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const carregarEstatisticas = async () => {
    setIsLoading(true);
    try {
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;
      if (!isSuperAdmin && !isPrefeito && usuarioLogado.setorAtuacao) {
        url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
      }
      const res = await axios.get(url);
      setTodosChamados(res.data);
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!usuarioLogado.id) { navigate("/"); return; }
    carregarEstatisticas();
  }, []);

  const { chamadosFiltrados, kpis, graficoSetores, graficoStatus, setoresUnicos, matriz } =
    useMemo(() => {
      const filtrados = todosChamados.filter((c) => {
        if (filtroData.modo === "TOTAL") return true;
        if (!c.dataCriacao) return false;
        const d    = new Date(c.dataCriacao.endsWith("Z") ? c.dataCriacao : `${c.dataCriacao}Z`);
        const dStr = toLocalDateString(d);
        const dMes = dStr.slice(0, 7);
        if (filtroData.modo === "DIA")       return dStr === filtroData.diaEspecifico;
        if (filtroData.modo === "MES_ANO")   return dMes === filtroData.mesAno;
        if (filtroData.modo === "INTERVALO") return dStr >= filtroData.intervaloInicio && dStr <= filtroData.intervaloFim;
        return true;
      });

      const total      = filtrados.length;
      const resolvidos = filtrados.filter((c) => c.status === "RESOLVIDO").length;
      const pendentes  = filtrados.filter((c) => c.status === "PENDENTE").length;
      const andamento  = filtrados.filter((c) => c.status === "EM_ANDAMENTO").length;
      const taxa       = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

      const porSetor:   Record<string, number> = {};
      const porStatus:  Record<string, number> = {};
      const matrizData: Record<string, Record<string, number>> = {};

      filtrados.forEach((c) => {
        const setor  = c.categoria || "Sem Categoria";
        const status = c.status    || "PENDENTE";
        porSetor[setor]   = (porSetor[setor]   || 0) + 1;
        porStatus[status] = (porStatus[status] || 0) + 1;
        if (!matrizData[setor]) matrizData[setor] = {};
        matrizData[setor][status] = (matrizData[setor][status] || 0) + 1;
      });

      const setoresOrdenados   = Object.keys(porSetor).sort((a, b) => porSetor[b] - porSetor[a]);
      const graficoSetoresData = setoresOrdenados.map((s) => ({ name: s, chamados: porSetor[s] }));
      const graficoStatusData  = Object.keys(porStatus).map((s) => ({
        name: STATUS_CONFIG[s]?.label || s,
        value: porStatus[s],
      }));

      return {
        chamadosFiltrados: filtrados,
        kpis: { total, resolvidos, pendentes, andamento, taxa },
        graficoSetores: graficoSetoresData,
        graficoStatus:  graficoStatusData,
        setoresUnicos:  setoresOrdenados,
        matriz:         matrizData,
      };
    }, [todosChamados, filtroData]);

  const irParaSolicitacoes = (filtros: { status?: string; setor?: string }) => {
    navigate("/solicitacoes", {
      state: {
        filtroStatus: filtros.status || "TODOS",
        filtroSetor:  filtros.setor  || "",
        filtroData,
      },
    });
  };

  const handleLogout = () => { localStorage.removeItem("user_ipora"); navigate("/"); };
  const statusOrdem: string[] = ["PENDENTE", "EM_ANDAMENTO", "RESOLVIDO"];
  const filtroAtivo = filtroData.modo !== "TOTAL";

  interface NavItem { label: string; icon: React.ReactNode; path: string; active?: boolean; }
  const navItems: NavItem[] = [
    { label: "Solicitações",    icon: <MapPin size={20} />,          path: "/solicitacoes" },
    { label: "Dashboard",       icon: <LayoutDashboard size={20} />, path: "/dashboard", active: true },
    ...(isSuperAdmin ? [
      { label: "Gestão de Perfis", icon: <Users    size={20} />, path: "/perfis"    },
      { label: "Definições",       icon: <Settings size={20} />, path: "/definicoes" },
    ] : []),
  ];

  // ─── Sidebar — reutilizado em desktop (fixed aside) e mobile (drawer) ───────
  const SidebarContent = () => (
    <>
      <div className="p-6 flex flex-col items-center gap-1 border-b border-gray-100">
        <img src={logoAtual} alt="Logo" className="h-16 w-auto object-contain mb-2" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
          {isSuperAdmin ? "ADMINISTRAÇÃO GERAL" : `SETOR: ${usuarioLogado.setorAtuacao}`}
        </span>
        <span className="text-sm text-gray-600 font-medium">Olá, {usuarioLogado.nome}</span>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <a key={item.path} href="#"
            onClick={(e) => { e.preventDefault(); setMenuMobileAberto(false); navigate(item.path); }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium
              ${item.active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {item.icon} {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full text-sm font-medium"
        >
          <LogOut size={20} /> Terminar Sessão
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── SIDEBAR DESKTOP (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-col z-10 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── DRAWER MOBILE (<md) ───────────────────────────────────────────── */}
      {menuMobileAberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuMobileAberto(false)}
          />
          {/* Painel */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto">

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Botão hamburger — só mobile */}
              <button
                className="md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600"
                onClick={() => setMenuMobileAberto(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isSuperAdmin ? "Visão Geral da Cidade" : `Dashboard — ${usuarioLogado.setorAtuacao}`}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Dados em tempo real · {chamadosFiltrados.length} solicitações no período
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Botão de filtro de data */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setPainelAberto((v) => !v)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold
                    transition-all shadow-sm w-full sm:w-auto justify-center
                    ${filtroAtivo
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}
                >
                  <CalendarDays size={15} />
                  <span className="truncate max-w-[120px] sm:max-w-none">{labelFiltroData(filtroData)}</span>
                  {filtroAtivo && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setFiltroData(filtroDataInicial()); }}
                      className="ml-1 hover:opacity-70 transition-opacity"
                    >
                      <X size={13} />
                    </span>
                  )}
                </button>

                {painelAberto && (
                  <PainelFiltroData
                    filtro={filtroData}
                    onChange={setFiltroData}
                    onClose={() => setPainelAberto(false)}
                  />
                )}
              </div>

              <button onClick={carregarEstatisticas} disabled={isLoading}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl
                  text-xs sm:text-sm font-semibold text-blue-600 hover:border-blue-300 shadow-sm transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{isLoading ? "Carregando…" : "Atualizar"}</span>
              </button>
            </div>
          </div>

          {/* ── KPI CARDS — 2 colunas em mobile, 4 em lg ─────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <KpiCard title="Total" value={kpis.total} icon={<TrendingUp size={18} />} color="#6366F1" onClick={() => irParaSolicitacoes({})} />
            <KpiCard title="Pendentes" value={kpis.pendentes} sub="Aguardando atendimento" icon={<AlertCircle size={18} />} color="#EF4444" onClick={() => irParaSolicitacoes({ status: "PENDENTE" })} />
            <KpiCard title="Andamento" value={kpis.andamento} sub="Em execução" icon={<Clock size={18} />} color="#F59E0B" onClick={() => irParaSolicitacoes({ status: "EM_ANDAMENTO" })} />
            <KpiCard title="Resolução" value={`${kpis.taxa}%`} sub={`${kpis.resolvidos} resolvidos`} icon={<CheckCircle2 size={18} />} color="#10B981" onClick={() => irParaSolicitacoes({ status: "RESOLVIDO" })} />
          </div>

          {/* ── MATRIZ ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-800">Matriz de Chamados por Setor</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Clique em qualquer célula para filtrar os chamados diretamente</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 mt-1">
                {statusOrdem.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <span key={s} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium" style={{ color: cfg.color }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {setoresUnicos.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Sem dados no período selecionado</div>
            ) : (
              <div className="overflow-x-auto mt-4 -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full border-separate border-spacing-y-1 min-w-[360px]">
                  <thead>
                    <tr>
                      <th className="text-left p-1 sm:p-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider w-32 sm:w-48">Setor</th>
                      {statusOrdem.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <th key={s} className="text-center p-1 sm:p-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                            <span className="hidden sm:inline">{cfg.label}</span>
                            <span className="sm:hidden">{cfg.label.split(" ")[0]}</span>
                          </th>
                        );
                      })}
                      <th className="text-center p-1 sm:p-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setoresUnicos.map((setor) => {
                      const totalSetor = Object.values(matriz[setor] || {}).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={setor} className="group hover:bg-gray-50 rounded-xl transition-colors">
                          <td className="p-1 sm:p-2">
                            <button onClick={() => irParaSolicitacoes({ setor })}
                              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group/btn"
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-200 group-hover/btn:bg-blue-500 transition-colors flex-shrink-0" />
                              <span className="truncate max-w-[90px] sm:max-w-[160px]">{setor}</span>
                            </button>
                          </td>
                          {statusOrdem.map((status) => (
                            <MatrizCell key={status} valor={matriz[setor]?.[status] || 0}
                              setor={setor} status={status} total={totalSetor}
                              onClick={() => irParaSolicitacoes({ setor, status })}
                            />
                          ))}
                          <td className="p-1 sm:p-2 text-center">
                            <button onClick={() => irParaSolicitacoes({ setor })}
                              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-blue-50"
                            >
                              {totalSetor}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-gray-100">
                      <td className="p-1 sm:p-2">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider pl-2 sm:pl-4">Total geral</span>
                      </td>
                      {statusOrdem.map((status) => {
                        const total = setoresUnicos.reduce((acc, setor) => acc + (matriz[setor]?.[status] || 0), 0);
                        const cfg   = STATUS_CONFIG[status];
                        return (
                          <td key={status} className="p-1 sm:p-2 text-center">
                            <button onClick={() => irParaSolicitacoes({ status })}
                              className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            >
                              {total}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-1 sm:p-2 text-center">
                        <span className="text-xs sm:text-sm font-bold text-gray-800">{kpis.total}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── GRÁFICOS — empilhados em mobile, lado a lado em lg ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">Volume por Setor</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Chamados abertos por departamento</p>
              <div className="h-56 sm:h-72">
                {graficoSetores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graficoSetores} margin={{ bottom: 60, top: 10, left: -10, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} angle={-40} textAnchor="end" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 12 }} cursor={{ fill: "#F9FAFB" }} />
                      <Bar dataKey="chamados" fill="#6366F1" radius={[6, 6, 0, 0]}
                        onClick={(data) => irParaSolicitacoes({ setor: data.name })}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sem dados no período</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">Status dos Chamados</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Distribuição atual</p>
              <div className="h-56 sm:h-72 flex items-center justify-center">
                {graficoStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={graficoStatus} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                        {graficoStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sem dados no período</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}