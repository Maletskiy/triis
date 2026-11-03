import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Privacy from "./pages/Privacy";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app">
      <header className="topbar">
        <a className="topbar__brand" href="/" aria-label="ТРИИС — на главную">
          <img className="topbar__mark" src="/logo.svg" alt="" aria-hidden="true" />
          <div>
            <h1>ТРИИС</h1>
            <p>Калькулятор ИИС: вычеты, налоги, доходность</p>
          </div>
        </a>
      </header>
      <Privacy />
    </div>
  </StrictMode>,
);
