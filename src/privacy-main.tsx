import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Privacy from "./pages/Privacy";
import Topbar from "./components/Topbar";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app">
      <Topbar variant="plain" />
      <Privacy />
    </div>
  </StrictMode>,
);
