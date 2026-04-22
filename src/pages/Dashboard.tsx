import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Chamado {
  id: number;
  categoria: string;
  status: string;
  dataCriacao: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // LÊ O CRACHÁ DO UTILIZADOR
  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const isPrefeito = usuarioLogado.perfil === "PREFEITO";
  const cidadeAdmin = usuarioLogado.cidade;

  const logosPorCidade: Record<string, string> = {
    "Iporã do Oeste": "/logos/logoeuamoipora.png",
    Itapiranga: "/logos/logoeuamoipora.png",
    "São Miguel do Oeste": "/logos/logoeuamoipora.png",
    Tunápolis: "/logos/logoeuamoipora.png",
  };

  // Se a cidade não tiver logo mapeada, ele pode carregar uma genérica
  const logoAtual = logosPorCidade[cidadeAdmin] || "/logos/logoeuamoipora.png";

  const [todosChamados, setTodosChamados] = useState<Chamado[]>([]);
  const [filtroTempo, setFiltroTempo] = useState("TOTAL"); // "TOTAL", "MES", "ANO"
  const [isLoading, setIsLoading] = useState(true);

  const carregarEstatisticas = async () => {
    setIsLoading(true);
    try {
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;

      // Se NÃO for Super Admin e NÃO for Prefeito, então puxa só do setor dele
      if (!isSuperAdmin && !isPrefeito && usuarioLogado.setorAtuacao) {
        url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
      }

      const response = await axios.get(url);
      setTodosChamados(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas do Java:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!usuarioLogado.id) {
      navigate("/");
      return;
    }
    carregarEstatisticas();
  }, []);

  const { kpis, graficoSetores, graficoStatus } = useMemo(() => {
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    // Filtrar pelo tempo selecionado
    const chamadosFiltrados = todosChamados.filter((c) => {
      if (filtroTempo === "TOTAL") return true;
      if (!c.dataCriacao) return false;

      const dataCorrigida = c.dataCriacao.endsWith("Z")
        ? c.dataCriacao
        : `${c.dataCriacao}Z`;
      const dataChamado = new Date(dataCorrigida);

      if (filtroTempo === "MES") {
        return (
          dataChamado.getMonth() === mesAtual &&
          dataChamado.getFullYear() === anoAtual
        );
      }
      if (filtroTempo === "ANO") {
        return dataChamado.getFullYear() === anoAtual;
      }
      return true;
    });

    // 2. Calcular KPIs
    const totalChamados = chamadosFiltrados.length;
    const totalResolvidos = chamadosFiltrados.filter(
      (c) => c.status === "RESOLVIDO",
    ).length;

    // 3. Separar para os Gráficos
    const contagemSetores: Record<string, number> = {};
    const contagemStatus: Record<string, number> = {};

    chamadosFiltrados.forEach((chamado) => {
      const setor = chamado.categoria || "Sem Categoria";
      contagemSetores[setor] = (contagemSetores[setor] || 0) + 1;

      const status = chamado.status
        ? chamado.status.replace("_", " ")
        : "PENDENTE";
      contagemStatus[status] = (contagemStatus[status] || 0) + 1;
    });

    // Formata e ordena os Setores do MAIOR para o MENOR
    const formatadoSetores = Object.keys(contagemSetores)
      .map((key) => ({ name: key, chamados: contagemSetores[key] }))
      .sort((a, b) => b.chamados - a.chamados);

    const formatadoStatus = Object.keys(contagemStatus).map((key) => ({
      name: key,
      value: contagemStatus[key],
    }));

    return {
      kpis: { total: totalChamados, resolvidos: totalResolvidos },
      graficoSetores: formatadoSetores,
      graficoStatus: formatadoStatus,
    };
  }, [todosChamados, filtroTempo]); // Só roda de novo se a lista ou o filtro mudar!

  const handleLogout = () => {
    localStorage.removeItem("user_ipora");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* MENU LATERAL COM LOGO DINÂMICA */}
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
            className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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
          {isSuperAdmin && (
            <>
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
            </>
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

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isSuperAdmin
                ? "Visão Geral da Cidade"
                : `Gráficos: ${usuarioLogado.setorAtuacao}`}
            </h1>
            <p className="text-gray-500">
              Dados processados em tempo real diretamente da base de dados.
            </p>
          </div>

          {/* 🔴 CONTROLOS: Filtro + Atualizar */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <CalendarDays size={20} className="text-gray-400 ml-2" />
            <select
              value={filtroTempo}
              onChange={(e) => setFiltroTempo(e.target.value)}
              className="bg-transparent border-none text-gray-700 font-bold outline-none cursor-pointer pr-4 py-2"
            >
              <option value="TOTAL">Desde o Início (Total)</option>
              <option value="ANO">Este Ano</option>
              <option value="MES">Este Mês</option>
            </select>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={carregarEstatisticas}
              disabled={isLoading}
              className="text-primary hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "A carregar..." : "Atualizar"}
            </button>
          </div>
        </header>

        {/* CARDS DE RESUMO (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">
              Total de Solicitações
            </h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {kpis.total}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">
              Chamados Resolvidos
            </h3>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {kpis.resolvidos}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">
              Taxa de Resolução
            </h3>
            <p className="text-3xl font-bold text-blue-500 mt-2">
              {kpis.total > 0
                ? Math.round((kpis.resolvidos / kpis.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* 🔴 GRÁFICO 1: VOLUME POR SETOR (AGORA EM LINHA PRÓPRIA, 100% LARGURA) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Volume por Setor
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Comparação do número de chamados abertos por departamento.
          </p>
          <div className="h-[350px]">
            {graficoSetores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {/* Adicionada margem na base para os textos rodados caberem sem cortar */}
                <BarChart
                  data={graficoSetores}
                  margin={{ bottom: 80, top: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* 🔴 O PULO DO GATO: angle={-45} inclina o texto, textAnchor="end" alinha */}
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip cursor={{ fill: "#f4f7f8" }} />
                  <Bar
                    dataKey="chamados"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sem dados no período selecionado
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              Status dos Chamados
            </h3>
            <div className="h-72 flex justify-center items-center">
              {graficoStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graficoStatus}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graficoStatus.map((entry, index) => {
                        let color = "#999";
                        if (entry.name === "RESOLVIDO") color = "#4CAF50";
                        if (entry.name === "EM ANDAMENTO") color = "#FFC107";
                        if (entry.name === "PENDENTE") color = "#F44336";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Sem dados no período selecionado
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
