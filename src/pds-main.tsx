import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Pds from "./pages/Pds";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Pds />
  </StrictMode>,
);
