// pages/CreateProjectPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../services/authService";

function CreateProjectPage() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");

  const handleCreateProject = () => {
    post("/projects", { name: projectName })
      .then((response) => {
        const projectId = response.data._id;
        navigate(`/projects/${projectId}`);
      })
      .catch((error) => {
        console.error("Error creating project:", error);
      });
  };

  return (
    <div className="project-container">
      <h1 className="project-heading">Create a New Project</h1>
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="Enter project name"
        className="project-input"
      />
      <button onClick={handleCreateProject} className="project-button">
        Create
      </button>
    </div>
  );
}

export default CreateProjectPage;