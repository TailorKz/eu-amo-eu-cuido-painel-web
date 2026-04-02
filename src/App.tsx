import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Solicitacoes from "./pages/Solicitacoes";
import GestaoPerfis from "./pages/GestaoPerfis";
import Definicoes from "./pages/Definicoes"; //

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitacoes" element={<Solicitacoes />} />
        <Route path="/perfis" element={<GestaoPerfis />} />{" "}
        <Route path="/definicoes" element={<Definicoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
