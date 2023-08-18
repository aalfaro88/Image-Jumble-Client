// src/pages/ProjectsPage.js

import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { get, del, put, deleteCloudinaryFolder } from "../services/authService"; 
import { AuthContext } from "../context/auth.context";

function ProjectsPage() {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const isLoggedIn = !!localStorage.getItem("authToken");

  useEffect(() => {
    if (user) {
      get(`/projects?creator=${user._id}`)
        .then((response) => {
          setProjects(response.data);
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
        });
    }
  }, [user]);

  const handleRename = (projectId, currentName) => {
    const newName = prompt("Enter the new name:", currentName);
    if (!newName) return; 

    const updatedProject = {
      name: newName,
    };

    put(`/projects/${projectId}`, updatedProject)
      .then((response) => {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project._id === projectId ? { ...project, name: newName } : project
          )
        );
      })
      .catch((error) => {
        console.error("Error renaming project:", error);
      });
  };

  const handleDelete = async (projectId) => {
    try {

      await deleteCloudinaryFolder(projectId);

      await del(`/projects/${projectId}`);


      setProjects((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      );
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };
  

  return (
    <div className="project-container">
          <h1 className="project-heading">My Projects</h1>
          {projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <ul className="project-list">
              {projects.map((project) => (
                <li key={project._id} className="project-item">
                  <Link to={`/projects/${project._id}`} className="project-link">
                    {project.name}
                  <div>
                    </div>  
                  </Link>
                  <div className="project-buttons">
                  <button
                    onClick={() => handleRename(project._id, project.name)}
                    className="project-button"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="project-button"
                  >
                    Delete
                  </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
              <Link to={isLoggedIn ? "/create-project" : "/login"}>
                Create a New Project
              </Link>
        </div>
      );
    }


export default ProjectsPage;
