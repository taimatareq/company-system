import ItemsPage from "./pages/ItemsPage.jsx";

import { Toaster } from "react-hot-toast";

import "./styles/app.css";

function App() {
  return (
    <>
      <Toaster position="top-right" />

      <ItemsPage />
    </>
  );
}

export default App;