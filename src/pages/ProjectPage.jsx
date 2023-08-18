// pages/projectPage

import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { get, post, uploadImage } from "../services/authService";


function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [newLayerName, setNewLayerName] = useState("");
  const [layerImages, setLayerImages] = useState({});
  const [addingLayer, setAddingLayer] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(null); 
  const [loadingImages, setLoadingImages] = useState(false);
  

  const imageGalleryRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      imageGalleryRef.current.style.background = "lightgray";
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      imageGalleryRef.current.style.background = "transparent"; // Change this to the desired background color
    }
  };
  
  
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    imageGalleryRef.current.style.background = "transparent"; 
  
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log("Dropped Files:", droppedFiles);
    setLoadingImages(true);
  
    if (droppedFiles.length > 0) {
      try {
        const names = droppedFiles.map((file) => file.name);
        const uniqueNames = names.filter((name) => !layerImages[selectedLayer]?.includes(name));
  
        if (uniqueNames.length === 0) {
          setLoadingImages(false);
          console.log("No new images to add.");
          return;
        }
  
        const uniqueIdentifiers = await Promise.all(
          droppedFiles.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const hashArray = new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer));
            return Array.from(hashArray, (byte) => byte.toString(16).padStart(2, '0')).join('');
          })
        );
  
        const existingIdentifiers = layerImages[selectedLayer] || [];
        const newIdentifiers = uniqueIdentifiers.filter((identifier) => !existingIdentifiers.includes(identifier));
  
        if (newIdentifiers.length === 0) {

          setLoadingImages(false);
          console.log("No new images to add.");
          return;
        }
  
        post(`/projects/${projectId}/layers/${selectedLayer}/images`, { names: uniqueNames })
          .then((response) => {
            console.log("Image names added to MongoDB:", response.data);
          })
          .catch((error) => {
            console.error("Error adding image names to MongoDB:", error);
          });
  
        const imageIds = await Promise.all(
          uniqueNames.map((name) => uploadImage(droppedFiles.find(file => file.name === name), projectId, selectedLayer))
        );

        fetchImagesForLayers(project.layers)
        setLoadingImages(false);
        
        const updatedProject = {
          ...project,
          layers: project.layers.map((layer) =>
            layer._id === selectedLayer
              ? {
                  ...layer,
                  images: [...layer.images, ...imageIds],
                }
              : layer
          ),
        };
  
        setProject(updatedProject);
      } catch (error) {
        console.error("Error uploading images:", error);
      }
    }
  };
  

  const fetchImagesForLayers = async (layers) => {
    const newLayerImages = {};
  
    await Promise.all(
      layers.map(async (layer) => {
        try {
          const response = await get(`/projects/${projectId}/layers/${layer._id}/images`);
          newLayerImages[layer._id] = response.data.images; 
        } catch (error) {
          console.error("Error fetching images for layer:", layer._id, error);
        }
      })
    );
  
    setLayerImages(newLayerImages);
  };
  

  useEffect(() => {
    get(`/projects/${projectId}`)
      .then((response) => {
        setProject(response.data);
        fetchImagesForLayers(response.data.layers);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });
  }, [projectId]);

  useEffect(() => {
    if (project && project.layers.length > 0) {
      const newlyAddedLayerName = project.layers[project.layers.length - 1]._id;
      console.log("Newly added layer name:", newlyAddedLayerName);
    }
  }, [project]);

  if (!project) {
    return <div>Loading...</div>;
  }

  const handleAddLayer = () => {
    setAddingLayer(true);
  
    const newLayer = {
      name: newLayerName.trim() || `Layer ${project.layers.length + 1}`,
      images: [],
    };
  
    post(`/projects/${projectId}/layers`, newLayer)
      .then((response) => {
        get(`/projects/${projectId}`)
          .then((response) => {
            setProject(response.data);
            setNewLayerName("");
            setAddingLayer(false);
  
            console.log("Newly added layer ID:", response.data.layers[response.data.layers.length - 1]._id);
          })
          .catch((error) => {
            console.error("Error fetching project:", error);
            setAddingLayer(false);
          });
      })
      .catch((error) => {
        console.error("Error adding layer:", error);
        setAddingLayer(false);
      });
  };
  

  const handleLayerClick = (layerId) => {
    setSelectedLayer(layerId);
  };

  return (
    <div>
      <div className="project-page-head">
        <h2>{project.name}</h2>
        <Link to={`/randomize?projectId=${projectId}`}>
          <button className="randomize-button">Ready to Randomize</button>
        </Link>
      </div>
      <div className="project-layout">
      <div className="layer-list">
          <h2>Layers</h2>
           {project.layers.map((layer) => (
           <div
             key={layer._id}
             className={`layer ${selectedLayer === layer._id ? "active" : ""}`}
             onClick={() => handleLayerClick(layer._id)}
           >
             {layer.name}
           </div>
       ))}
        <div className="add-layer">
          <div className="input-container">
            <input
              type="text"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="Layer Name"
            />
          </div>
          <img
            src="/images/addButton.png"
            alt="Add New Layer"
            onClick={handleAddLayer}
            style={{ cursor: 'pointer' }}
            className="add-button"
          />
        </div>

       </div>
       <div className="layer-images" 
     onDragOver={handleDragOver} 
     onDragLeave={handleDragLeave} 
     onDrop={handleDrop}>
  {loadingImages ? (
    <div className="loading-overlay2">
      <div className="loading-spinner2"></div>
      <p>Uploading images. Please wait...</p>
    </div>
  ) : selectedLayer ? (
    <div ref={imageGalleryRef} className="gallery-support">
      <h1>{project.layers.find(layer => layer._id === selectedLayer)?.name}</h1>
      <div className="image-gallery">
        {layerImages[selectedLayer]?.map((imageName, idx) => (
          <div key={idx} className="image-wrapper">
            <img
              src={`https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/Image-randomizer/${project._id}/${selectedLayer}/${imageName}`}
              alt={imageName}
              className="image"
            />
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div>
      <p className="no-layer">No layer selected.</p>
    </div>

  )}
</div>

    </div>
    </div>
  );
}




export default ProjectPage;
