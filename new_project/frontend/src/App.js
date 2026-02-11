import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Components/Header";
import Menu from "./Components/Menu";
import FooterPage from "./Components/FooterPage";

function App() {
  return (
    <div className="App">
      <Header />
      <Menu />
      <FooterPage />
    </div>
  );
}

export default App;
