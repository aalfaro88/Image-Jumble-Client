import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth.context";

function Navbar() {
  const { user, logOutUser } = useContext(AuthContext);

  const getToken = () => {
    return localStorage.getItem("authToken");
  };

  return (
    <nav className="navbar">
      <div className="left-buttons">
        <Link to="/">
          <button>Home</button>
        </Link>
      </div>

      <div className="right-buttons">
        {getToken() ? (
          <>
            <Link to="/projects">
              <button>Projects</button>
            </Link>
            {user && <Link to={`/user-profile/${user._id}`} className="profile-button">Profile</Link>}
            <button onClick={logOutUser}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/signup">
              <button>Sign Up</button>
            </Link>
            <Link to="/login">
              <button>Login</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
