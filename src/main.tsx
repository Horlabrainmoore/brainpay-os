import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { pingAppwrite } from "@/integrations/appwrite/client";
import "./index.css";

void pingAppwrite().catch(() => {
  // The client logs a sanitized failure; allow the rest of the app to render offline.
});

createRoot(document.getElementById("root")!).render(<App />);
