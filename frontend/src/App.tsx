import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from "./pages/landingpage";
import Register from "./auth/register";
import Login from "./auth/login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;