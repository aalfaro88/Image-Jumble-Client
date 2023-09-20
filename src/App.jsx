import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ProjectPage from "./pages/ProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import RandomizePage from './pages/RandomizePage';
import UserProfile from "./pages/UserProfile";

function App() {
  const getToken = () => {
    return localStorage.getItem("authToken");
  };

  const LoggedIn = () => {
    return getToken() ? <Outlet /> : <Navigate to="/login" />;
  };

  const NotLoggedIn = () => {
    return !getToken() ? <Outlet /> : <Navigate to="/" />;
  };

  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-project" element={<CreateProjectPage />} />
        <Route path="/projects" element={<ProjectsPage />} /> 
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/randomize" element={<RandomizePage />} />
        <Route path="/user-profile/:userId" element={<UserProfile />} />
        <Route element={<LoggedIn />}>
        </Route>

        <Route element={<NotLoggedIn />}>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Routes>

      <footer>
        <div className="footer">
          Copyright © 2023 Image Jumble
        </div>
      </footer>
    </div>
  );
}

export default App;
