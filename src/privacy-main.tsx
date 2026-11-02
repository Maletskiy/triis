import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Privacy from "./pages/Privacy";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app">
      <header className="topbar">
        <a className="topbar__brand" href="/" aria-label="Triis — на главную">
          <span className="topbar__mark" aria-hidden="true">
            3
          </span>
          <div>
            <h1>Triis</h1>
            <p>Калькулятор ИИС: вычеты, налоги, доходность</p>
          </div>
        </a>
      </header>
      <Privacy />
    </div>
  </StrictMode>,
);
