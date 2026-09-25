import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { worker } from "./mocks/browser";

async function enableMocking() {
  return worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}

await enableMocking().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
