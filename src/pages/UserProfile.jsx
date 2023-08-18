// pages/UserProfile.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { get } from "../services/authService";

function UserProfile() {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await get(`/users/${userId}`); 
        const userData = response.data;
        setUserProfile(userData);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error fetching user profile: {error.message}</p>;
  }

  return (
    <div className="userbox">
        <div className="user-profile-container">
        <h1>User Profile</h1>
        <p><strong>Email:</strong> {userProfile.email}</p>
        <p><strong>Username:</strong> {userProfile.username}</p>
        <p><strong>Randomize Tokens:</strong> {userProfile.randomize_tokens}</p>
        </div>
    </div>

  );
}

export default UserProfile;
