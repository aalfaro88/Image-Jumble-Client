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

export const uploadImage = async (file, projectId, pathId, layerId) => {
  const formData = new FormData();
  formData.append("picture", file);

  const token = localStorage.getItem("authToken");

  return axios
    .post(
      `${SERVER_URL}/upload-image/${projectId}/${pathId}/${layerId}/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    )
    .then((response) => {
      return response.data.imageId;
    });
};


export const getProjectImages = (projectId, pathId, layerId) => {
  return get(
    `/images/${projectId}/${pathId}/${layerId}`
  );
};

export const deleteCloudinaryFolder = (projectId) => {
  return axios.delete(`${SERVER_URL}/delete-cloudinary-folder/${projectId}`);
};


export const deleteCloudinaryPath = (projectId, pathId) => {
  return axios.delete(`${SERVER_URL}/delete-cloudinary-folder/paths/${projectId}/${pathId}`);
};


export const deleteCloudinaryLayers = (projectId, pathId, layerId) => {
  return axios.delete(`${SERVER_URL}/delete-cloudinary-folder/layers/${projectId}/${pathId}/${layerId}`);
};

 