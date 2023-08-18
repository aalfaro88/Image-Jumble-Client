// src/pages/SignupPage.jsx

import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.context";
import { post } from "../services/authService";

function SignupPage() {
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  const [errorMessage, setErrorMessage] = useState(undefined);

  const { storeToken, authenticateUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleTextChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleSignupSubmit = (e) => {
  e.preventDefault();
  
  console.log("Signup form submitted. User object:", user);

  post("/auth/signup", user)
    .then((response) => {
      console.log("Response from the server:", response.data);
      storeToken(response.data.authToken);
      authenticateUser();
      navigate("/");
    })
    .catch((error) => {
      console.log("Error", error);
      const errorDescription = error.response.data.message;
      setErrorMessage(errorDescription);
    });
};


  return (
    <div className="SignupPage">
      <h1>Sign Up</h1>

      <form onSubmit={handleSignupSubmit}>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={user.email}
          onChange={handleTextChange}
        />

        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={user.password}
          onChange={handleTextChange}
        />

        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={user.username}
          onChange={handleTextChange}
        />

        <button type="submit">Sign Up</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <p>Already have an account?</p>
      <Link to="/login"> Login</Link>
    </div>
  );
}

export default SignupPage;
