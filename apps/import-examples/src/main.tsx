import { createRoot } from "react-dom/client";
import { createApp } from "vue";
import { ReactImport } from "./ReactImport";
import VueImport from "./VueImport.vue";
import "./style.css";
createRoot(document.getElementById("react")!).render(<ReactImport />);
createApp(VueImport).mount("#vue");
