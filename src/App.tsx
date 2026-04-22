import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Solicitacoes from "./pages/Solicitacoes";
import GestaoPerfis from "./pages/GestaoPerfis";
import Definicoes from "./pages/Definicoes";

axios.interceptors.request.use(
  (config) => {
    const storageUser = localStorage.getItem("user_ipora");
    if (storageUser) {
      const user = JSON.parse(storageUser);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitacoes" element={<Solicitacoes />} />
        <Route path="/perfis" element={<GestaoPerfis />} />
        <Route path="/definicoes" element={<Definicoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;