import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { get, post, uploadImage, deleteCloudinaryFolder, del } from "../services/authService";

function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [newPathName, setNewPathName] = useState("");
  const [newLayerNames, setNewLayerNames] = useState({});
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [layerImages, setLayerImages] = useState({});
  const [selectedLayer, setSelectedLayer] = useState(null); 
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    get(`/projects/${projectId}`)
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });
  }, [projectId]);


// PATH FUNCTIONALITIES:
  const selectPath = (pathId) => {
    setSelectedPathId(pathId);
  };

  const getNextPathName = () => {
    const lastPath = project.paths[project.paths.length - 1];
    if (!lastPath) {
      return 'Path 1';
    }
    const lastPathNumber = parseInt(lastPath.name.split(' ')[1]);
    return `Path ${isNaN(lastPathNumber) ? project.paths.length + 1 : lastPathNumber + 1}`;
  };

  const handleAddPath = () => {
    const pathName = newPathName.trim() || getNextPathName();

    post(`/projects/${projectId}/paths`, { name: pathName })
      .then(() => {
        get(`/projects/${projectId}`)
          .then((response) => {
            setProject(response.data);
          })
          .catch((error) => {
            console.error("Error fetching updated project data:", error);
          });
        setNewPathName("");
      })
      .catch((error) => {
        console.error("Error adding path:", error);
      });
  };

// LAYERS FUNCTIONALITIES:
  const getNextLayerName = (pathId) => {
    const path = project.paths.find((p) => p._id === pathId);
    if (!path) {
      return 'Layer 1';
    }
    const lastLayer = path.layers[path.layers.length - 1];
    if (!lastLayer) {
      return 'Layer 1';
    }
    const lastLayerNumber = parseInt(lastLayer.name.split(' ')[1]);
    return `Layer ${isNaN(lastLayerNumber) ? path.layers.length + 1 : lastLayerNumber + 1}`;
  };

  const handleAddLayer = (pathId) => {
    const layerName = newLayerNames[pathId]?.trim() || getNextLayerName(pathId);

    const newLayer = { name: layerName, images: [] };

    post(`/projects/${projectId}/paths/${pathId}/layers`, newLayer)
      .then(() => {
        get(`/projects/${projectId}`)
          .then((response) => {
            setProject(response.data);
            setNewLayerNames((prevLayerNames) => ({
              ...prevLayerNames,
              [pathId]: "",
            }));
          })
          .catch((error) => {
            console.error("Error fetching updated project data:", error);
          });
      })
      .catch((error) => {
        console.error("Error adding layer:", error);
      });
  };

  const handleClick = (layerId) => {
    setSelectedLayer(layerId);
  };
  
  const handlePathClick = () => {
    setSelectedLayer(null); 
  };
  

  // IMAGE FUNCTIONALITIES:
  
  const fetchImagesForLayers = async (pathId, layers, selectedLayerId) => {
    const newLayerImages = {};
  
    if (selectedLayerId) {
      await Promise.all(
        layers.map(async (layer) => {
          if (layer._id === selectedLayerId) {
            try {
              const response = await get(`/projects/${projectId}/paths/${pathId}/layers/${layer._id}/images`);
              newLayerImages[layer._id] = response.data.images;
            } catch (error) {
              console.error("Error fetching images for layer:", layer._id, error);
            }
          }
        })
      );
  
      setLayerImages(newLayerImages);
    }
  };
 
  const deleteImage = async (pathId, layerId, imageId) => {
    try {
      // Delete image from Cloudinary
      await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
  
      // Update MongoDB data to remove the image
      await post(`/projects/${projectId}/paths/${pathId}/layers/${layerId}/deleteImage`, { imageId });
  
      // Fetch updated images and update the state
      const selectedPath = project.paths.find((path) => path._id === selectedPathId);
      fetchImagesForLayers(selectedPath._id, selectedPath.layers, selectedLayer);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

useEffect(() => {
  if (selectedPathId && selectedLayer) {
    const selectedPath = project.paths.find((path) => path._id === selectedPathId);
    fetchImagesForLayers(selectedPath._id, selectedPath.layers, selectedLayer);
  }
}, [selectedPathId, selectedLayer]);


    
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
    imageGalleryRef.current.style.background = "transparent"; 
  }
};
  
  
const handleDrop = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  imageGalleryRef.current.style.background = "transparent";
  
  const droppedFiles = Array.from(e.dataTransfer.files);
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
  
        post(`/projects/${projectId}/paths/${selectedPathId}/layers/${selectedLayer}/images`, { names: uniqueNames }) 
          .then((response) => {
            console.log("Image names added to MongoDB:", response.data);
          })
          .catch((error) => {
            console.error("Error adding image names to MongoDB:", error);
          });
  
          const imageIds = await Promise.all(
            uniqueNames.map((name) => uploadImage(droppedFiles.find(file => file.name === name), projectId, selectedPathId, selectedLayer)) 
          );

          setLayerImages((prevLayerImages) => ({
            ...prevLayerImages,
            [selectedLayer]: [...(prevLayerImages[selectedLayer] || []), ...imageIds],
          }));

        fetchImagesForLayers(selectedPathId, project.paths.find((path) => path._id === selectedPathId).layers, selectedLayer);

        setLoadingImages(false);
  
        const updatedProject = {
          ...project,
          paths: project.paths.map((path) =>
            path._id === selectedPathId
              ? {
                  ...path,
                  layers: path.layers.map((layer) =>
                    layer._id === selectedLayer
                      ? {
                          ...layer,
                          images: [...layer.images, ...imageIds],
                        }
                      : layer
                  ),
                }
              : path
          ),
        };
  
        setProject(updatedProject);
      } catch (error) {
        console.error("Error uploading images:", error);
      }
    }
  };

  const handleDeletePath = async (pathId) => {
    try {
      await deleteCloudinaryFolder(projectId, pathId);
      
      await del(`/projects/${projectId}/paths/${pathId}`);
      
      setProject((prevProject) => {
        const updatedPaths = prevProject.paths.filter((path) => path._id !== pathId);
        return { ...prevProject, paths: updatedPaths };
      });
  
      if (selectedPathId === pathId) {
        setSelectedPathId(null);
        setSelectedLayer(null);
        setLayerImages({});
      }
    } catch (error) {
      console.error("Error deleting path:", error);
    }
  };
  

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{project.name}</h2>
      <div>
        <input
          type="text"
          placeholder="Add Path name"
          value={newPathName}
          onChange={(e) => setNewPathName(e.target.value)}
        />
        <button onClick={handleAddPath}>Add Path</button>
      </div>
      <h3>Paths:</h3>
      <ul>
      {project.paths.map((path) => (
        <li key={path._id}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h4 onClick={() => { selectPath(path._id); handlePathClick(); }} style={{ cursor: 'pointer', marginRight: '1rem' }}>
              {path.name}
            </h4>
            <button onClick={() => handleDeletePath(path._id)}>Delete Path</button>

          </div>
        </li>
      ))}

      </ul>
      {selectedPathId && (
        <div>
          <h3>Selected Path Layers:</h3>
          <ul>
          {project.paths
            .find((path) => path._id === selectedPathId)
            .layers.map((layer) => (
              <li key={layer._id}>
                <h4
                  onClick={() => handleClick(layer._id)} 
                  style={{ cursor: 'pointer' }}
                >
                  {layer.name}
                </h4>
              </li>
            ))}

          </ul>
          <div>
            <input
              type="text"
              placeholder="Add Layer name"
              value={newLayerNames[selectedPathId] || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNewLayerNames((prevLayerNames) => ({
                  ...prevLayerNames,
                  [selectedPathId]: value,
                }));
              }}
            />
            <button
              onClick={() => {
                handleAddLayer(selectedPathId);
              }}
            >
              Add Layer
            </button>
            <button onClick={() => console.log('PathID:', selectedPathId)}>Check</button>
          </div>
        </div>
      )}
<div className="layer-images"
    ref={imageGalleryRef}
     onDragOver={handleDragOver} 
     onDragLeave={handleDragLeave} 
     onDrop={handleDrop}>
  {loadingImages ? (
    <div className="loading-overlay2">
      <div className="loading-spinner2"></div>
      <p>Uploading images. Please wait...</p>
    </div>
 ) : selectedLayer && layerImages[selectedLayer] ? ( 
    <div ref={imageGalleryRef} className="gallery-support">
<h1>
  {project.paths
    .find((path) => path._id === selectedPathId)
    .layers.find((layer) => layer._id === selectedLayer)?.name}
</h1>
<div className="image-gallery">
{layerImages[selectedLayer]?.map((imageName, idx) => (
  <div key={idx} className="image-wrapper">
    <img
      src={`https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/image-jumble/${project._id}/${selectedPathId}/${selectedLayer}/${imageName}`}
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

  );
}

export default ProjectPage;

