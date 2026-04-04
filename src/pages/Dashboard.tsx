import { useState, useEffect } from "react";
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
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Chamado {
  id: number;
  categoria: string;
  status: string;
}

interface ChartItem {
  name: string;
  value?: number;
  chamados?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  //  LÊ O CRACHÁ DO UTILIZADOR
  const usuarioLogado = JSON.parse(localStorage.getItem("user_ipora") || "{}");
  const isSuperAdmin = usuarioLogado.perfil === "SUPER_ADMIN";
  const cidadeAdmin = usuarioLogado.cidade;
  const [kpis, setKpis] = useState({ total: 0, resolvidos: 0 });
  const [graficoSetores, setGraficoSetores] = useState<ChartItem[]>([]);
  const [graficoStatus, setGraficoStatus] = useState<ChartItem[]>([]);

  const carregarEstatisticas = async () => {
    try {
      //DECIDE QUAL ROTA CHAMAR BASEADO NO CARGO
      let url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/cidade/${cidadeAdmin}`;

  if (!isSuperAdmin && usuarioLogado.setorAtuacao) {
    // Se for funcionário, pega do setor DELE, na cidade DELE
    url = `https://tailorkz-production-eu-amo.up.railway.app/api/solicitacoes/setor/${usuarioLogado.setorAtuacao}?cidade=${cidadeAdmin}`;
  }

      const response = await axios.get(url);
      const chamados: Chamado[] = response.data;

      const totalChamados = chamados.length;
      const totalResolvidos = chamados.filter(
        (c) => c.status === "RESOLVIDO",
      ).length;
      setKpis({ total: totalChamados, resolvidos: totalResolvidos });

      const contagemSetores: Record<string, number> = {};
      const contagemStatus: Record<string, number> = {};

      chamados.forEach((chamado) => {
        const setor = chamado.categoria || "Sem Categoria";
        contagemSetores[setor] = (contagemSetores[setor] || 0) + 1;

        const status = chamado.status
          ? chamado.status.replace("_", " ")
          : "PENDENTE";
        contagemStatus[status] = (contagemStatus[status] || 0) + 1;
      });

      const formatadoSetores = Object.keys(contagemSetores).map((key) => ({
        name: key,
        chamados: contagemSetores[key],
      }));

      const formatadoStatus = Object.keys(contagemStatus).map((key) => ({
        name: key,
        value: contagemStatus[key],
      }));

      setGraficoSetores(formatadoSetores);
      setGraficoStatus(formatadoStatus);
    } catch (error) {
      console.error("Erro ao buscar estatísticas do Java:", error);
    }
  };

  useEffect(() => {
    // 🔴 SEGURANÇA: Chuta quem não tem login
    if (!usuarioLogado.id) {
      navigate("/");
      return;
    }
    // eslint-disable-next-line
    carregarEstatisticas();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_ipora");
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
            className="flex items-center gap-3 p-3 bg-blue-50 text-primary rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard size={20} /> Dashboard
          </a>

          {/*  ESCONDE O MENU SE NÃO FOR ADMIN */}
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

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
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
          <button
            onClick={carregarEstatisticas}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50"
          >
            Atualizar Gráficos
          </button>
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

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              Volume por Setor
            </h3>
            <div className="h-72">
              {graficoSetores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoSetores}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: "#f4f7f8" }} />
                    <Bar
                      dataKey="chamados"
                      fill="var(--color-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </div>

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
                  Sem dados para exibir
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
