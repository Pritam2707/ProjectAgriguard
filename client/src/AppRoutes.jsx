import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { NotFound } from "./pages/404";
import Navbar from "./components/navbar";
import { SignIn } from "./components/SignInModal";
import PestDetectionLog from './pages/Logs';
import { AuthProvider } from "./hooks/useAuth";

const AppRoutes = () => {
  return (
  <AuthProvider>
    <Router>
          <Navbar/>
      <Routes>
        <Route path="/signin" element={<SignIn/>}></Route>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path ="/log" element={<PestDetectionLog/>}/>
      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default AppRoutes;
