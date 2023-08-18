// src/services/authService.js

import axios from "axios";
import { SERVER_URL } from "./SERVER_URL";

export const get = (route) => {
  const token = localStorage.getItem("authToken");

  return axios.get(SERVER_URL + route, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const post = (route, body) => {
  const token = localStorage.getItem("authToken");

  return axios.post(SERVER_URL + route, body, {
    headers: { Authorization: `Bearer ${token}`},
  });
};

export const put = (route, body) => {
  const token = localStorage.getItem("authToken");

  return axios.put(SERVER_URL + route, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const del = (route) => {
  const token = localStorage.getItem("authToken");

  return axios.delete(SERVER_URL + route, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadImage = async (file, projectId, layerId) => {
    console.log("Project ID:", projectId);
    console.log("Layer ID:", layerId);
    console.log("Image Name:", file.name);
  
    const formData = new FormData();
    formData.append("picture", file);
    console.log("This is file:",file)
    console.log(typeof file)
  
    const token = localStorage.getItem("authToken");
  
    return axios
      .post(SERVER_URL + `/upload-image/${projectId}/${layerId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(projectId)
        console.log(layerId)
        console.log("Response Data:", response.data);
        return response.data.imageId;
      });
  };

  export const getProjectImages = (projectId, layerId) => {
    return get(`/images/${projectId}/${layerId}`);
  };
  
  export const deleteCloudinaryFolder = (projectId) => {
    return axios.delete(`${SERVER_URL}/delete-cloudinary-folder/${projectId}`);
  };