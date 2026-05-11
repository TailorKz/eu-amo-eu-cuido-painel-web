import React, { useState, useEffect } from "react"; // <-- Adicionado useEffect aqui
import { Lock, Phone, MapPin } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [cidade, setCidade] = useState(""); // <-- Agora começa vazio para forçar a escolha
  const [isLoading, setIsLoading] = useState(false);

  // ESTADOS DINÂMICOS
  const [cidadesAtendidas, setCidadesAtendidas] = useState<string[]>([]);
  const [logoDinamica, setLogoDinamica] = useState<string | null>(null);

  // 1. Efeito para carregar a lista de cidades do Java
  useEffect(() => {
    const carregarCidades = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || "https://tailorkz-production-eu-amo.up.railway.app"}/api/configuracoes/todas`
        );
        if (response.data && response.data.length > 0) {
          // --- FILTRO CIRÚRGICO ---
          // Remove cidades que venham vazias ou apenas com espaços
          const cidadesLimpas = response.data.filter((c: string) => c && c.trim() !== "");
          setCidadesAtendidas(cidadesLimpas.length > 0 ? cidadesLimpas : ["Iporã do Oeste"]);
        } else {
          setCidadesAtendidas(["Iporã do Oeste"]); // Fallback
        }
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        setCidadesAtendidas(["Iporã do Oeste"]); // Fallback de segurança
      }
    };
    carregarCidades();
  }, []);

  // 2. Efeito para carregar o Logo da cidade assim que ela for selecionada
  useEffect(() => {
    const buscarLogoCidade = async () => {
      if (!cidade) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || "https://tailorkz-production-eu-amo.up.railway.app"}/api/configuracoes?cidade=${encodeURIComponent(cidade)}`
        );
        if (response.data && response.data.logoUrl) {
          setLogoDinamica(response.data.logoUrl);
        } else {
          setLogoDinamica(null); 
        }
      } catch (error) {
        console.error("Erro ao carregar logo:", error);
        setLogoDinamica(null);
      }
    };
    buscarLogoCidade();
  }, [cidade]);

  // verifica se já está logado e entrar direto!
  useEffect(() => {
    const storageUser = localStorage.getItem("user_ipora");
    if (storageUser) {
      const user = JSON.parse(storageUser);
      // Se existir um token válido na memória, vai para o painel
      if (user && user.token) {
        navigate("/solicitacoes");
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://tailorkz-production-eu-amo.up.railway.app/api/cidadaos/login",
        {
          telefone: phone.replace(/\D/g, ""),
          senha: password,
          cidade: cidade,
        },
      );

      const usuarioLogado = response.data;

      // BARREIRA DE SEGURANÇA
      if (!usuarioLogado.perfil || usuarioLogado.perfil === "CIDADAO") {
        alert(
          "Acesso negado. Apenas funcionários e gestores podem acessar este painel.",
        );
        setIsLoading(false);
        return;
      }

      // Guarda os dados dele na memória do navegador
      localStorage.setItem("user_ipora", JSON.stringify(usuarioLogado));

      // Entra no sistema!
      navigate("/solicitacoes");
    } catch (error) {
      console.error(error);
      alert(
        "Login falhou! Verifique a cidade, o seu número e a palavra-passe.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função que formata o número enquanto o utilizador escreve
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (val.length > 11) val = val.slice(0, 11); // Limita a 11 dígitos

    // Aplica a máscara
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;

    setPhone(val);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-4xl overflow-hidden">
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-100 to-primary p-12 text-white">
          
          <img 
            // <-- AQUI: Usa a logo da cidade escolhida, ou a padrão se não tiver
            src={logoDinamica || "/logos/logoeuamo.png"} 
            alt="Logo Eu Amo Eu Cuido" 
            className="w-64 mb-6 drop-shadow-md object-contain max-h-48"
          />
          
          <h1 className="text-4xl font-bold mb-4 text-center">
            Painel de Gestão
          </h1>
          <p className="text-center text-blue-50 text-lg">
            O cuidado com a cidade na palma da sua mão. Central de
            administração e controle.
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800">Bem-vindo</h2>
            <p className="text-gray-500 mt-2">
              Acesso restrito a gestores e administração
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* SELEÇÃO DA CIDADE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prefeitura / Cidade
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Selecione sua cidade</option>
                  {cidadesAtendidas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {/* Ícone de setinha para baixo nativo do select */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Telemóvel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-3 px-4 rounded-xl transition-colors duration-300 mt-2 shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {isLoading ? "A verificar..." : "Entrar no Sistema"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}