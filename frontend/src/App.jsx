import { BrowserRouter as Router } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import ThemeProvider from "./context/ThemeContext";
import { MessageProvider } from "./context/MessageContext";
import CallProvider from "./context/CallContext";
import AppRoutes from "./routes/AppRoutes";
import GlobalSocketListener from "./components/GlobalSocketListener";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <CallProvider>
            <GlobalSocketListener />
            <MessageProvider>
              <AppRoutes />
            </MessageProvider>
          </CallProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;