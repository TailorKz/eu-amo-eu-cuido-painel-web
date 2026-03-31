import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Solicitacoes from "./pages/Solicitacoes";
import GestaoPerfis from "./pages/GestaoPerfis"; // 🔴 Importou aqui

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitacoes" element={<Solicitacoes />} />
        <Route path="/perfis" element={<GestaoPerfis />} />{" "}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
