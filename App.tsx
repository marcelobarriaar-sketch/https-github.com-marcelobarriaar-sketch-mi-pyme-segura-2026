import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        Inicio – Mi Pyme Segura
      </h1>
      <p style={{ marginTop: "16px", fontSize: "18px" }}>
        Esta es la página de inicio de prueba con router.
      </p>
    </div>
  );
};

const AboutPage: React.FC = () => {
  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>Sobre Nosotros</h1>
      <p style={{ marginTop: "16px", fontSize: "18px" }}>
        Esta es una segunda página de prueba para confirmar que las rutas funcionan.
      </p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <header
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: "16px",
          fontWeight: "bold",
        }}
      >
        <Link to="/">Inicio</Link>
        <Link to="/about">Sobre Nosotros</Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </HashRouter>
  );
};

export default App;
