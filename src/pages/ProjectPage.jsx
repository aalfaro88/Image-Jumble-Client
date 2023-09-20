import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { get, post, uploadImage, del, put, deleteCloudinaryPath, deleteCloudinaryLayers} from "../services/authService";

function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [newPathName, setNewPathName] = useState("");
  const [newLayerNames, setNewLayerNames] = useState({});
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [layerImages, setLayerImages] = useState({});
  const [selectedLayer, setSelectedLayer] = useState(null); 
  const [loadingImages, setLoadingImages] = useState(false);
  const [editingPathId, setEditingPathId] = useState(null);
  const [editedPathName, setEditedPathName] = useState("");
  const [editedLayerNames, setEditedLayerNames] = useState({});
  const [paths, setPaths] = useState([]);
  


  useEffect(() => {
    get(`/projects/${projectId}`)
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });
  }, [projectId]);

  useEffect(() => {
    const fetchInitialPaths = async () => {
      try {
        const response = await get(`/projects/${projectId}/paths`);
        setPaths(response.data);
      } catch (error) {
        console.error('Failed to fetch initial paths', error);
      }
    };

    fetchInitialPaths();
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

  const startEditing = (pathId) => {
    const pathToEdit = project.paths.find((path) => path._id === pathId);
    if (pathToEdit) {
      setEditingPathId(pathId);
      setEditedPathName(pathToEdit.name);
    }
  };

  const handleRenamePath = async (pathId) => {
    try {
      const editedPath = project.paths.find((path) => path._id === pathId);
      if (editedPath) {
        // Update the path name in the backend
        await put(`/projects/${projectId}/paths/${pathId}`, {
          name: editedPathName,
        });
  
        // Update the path name in the state and clear editing state
        const updatedPaths = project.paths.map((path) =>
          path._id === pathId ? { ...path, name: editedPathName } : path
        );
  
        setProject((prevProject) => ({
          ...prevProject,
          paths: updatedPaths,
        }));
  
        // Clear the editing state
        setEditingPathId(null);
        setEditedPathName("");
      }
    } catch (error) {
      console.error('Error updating path name:', error);
    }
  };

  const handleDeletePath = async (pathId) => {
    try {
      await deleteCloudinaryPath(projectId, pathId);
        
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
  
const handleClonePath = async (pathId) => {
  // Step 1: Find the path object using the path ID
  const path = project.paths.find((p) => p._id === pathId);

  if (!path) {
    console.error("Path not found");
    return;
  }

  // Prepare data to be sent to the server
  const dataToSend = {
    pathName: path.name,
    layers: path.layers.map((layer) => {
      // Check if there are images for this layer and filter out 'None' names
      const images = layerImages[layer._id]
        ? Object.values(layerImages[layer._id]).filter((img) => img.name !== 'None').map((img) => img.name)
        : [];

      return {
        layerName: layer.name,
        images,
      };
    }),
  };

  try {
    // Assuming projectId is available in the current scope; if not, retrieve it appropriately
    const route = `/projects/${project._id}/paths/${path._id}/clone`;
    const response = await post(route, dataToSend);

    if (response.status === 201) {
      // Update the project state with the new path
      setProject((prevProject) => {
        return {
          ...prevProject,
          paths: [...prevProject.paths, response.data],
        };
      });

      // Set the selected path ID to the ID of the newly cloned path
      setSelectedPathId(response.data._id);

      // Update the layerImages state with the data for the new path
      setLayerImages((prevLayerImages) => {
        const newLayerImages = { ...prevLayerImages };
        dataToSend.layers.forEach((layer, index) => {
          console.log('Individual response data layers:', response.data.layers[index]);
          newLayerImages[response.data.layers[index]._id] = {};
          layer.images.forEach((imageName) => {
            newLayerImages[response.data.layers[index]._id][imageName] = { name: imageName };
          });
        });
        console.log('Updated layerImages:', newLayerImages);
        return newLayerImages;
      });

      // Reset the selected layer to its default value to trigger the fetching of layers
      setSelectedLayer(null);
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to clone path', error);
  }
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
  

  const handleDeleteLayer = async (pathId, layerId) => {
    try {
      await deleteCloudinaryLayers(projectId, pathId, layerId);
  
      await del(`/projects/${projectId}/paths/${pathId}/layers/${layerId}`);
  
      // Update the project state to remove the deleted layer
      setProject((prevProject) => {
        const updatedPaths = prevProject.paths.map((path) => {
          if (path._id === pathId) {
            const updatedLayers = path.layers.filter((layer) => layer._id !== layerId);
            return { ...path, layers: updatedLayers };
          }
          return path;
        });
        return { ...prevProject, paths: updatedPaths };
      });
  
      // Clear the selected layer if it was deleted
      if (selectedLayer === layerId) {
        setSelectedLayer(null);
        setLayerImages({});
      }
    } catch (error) {
      console.error("Error deleting layer:", error);
    }
  };
  
  const renameLayerInBackend = async (projectId, pathId, layerId, newName) => {
    try {
      await put(`/projects/${projectId}/paths/${pathId}/layers/${layerId}`, {
        name: newName,
      });
    } catch (error) {
      console.error("Error renaming layer in the backend:", error);
      throw error;
    }
  };

  const handleRenameLayer = async (pathId, layerId) => {
    try {
      const newName = editedLayerNames[layerId];
      if (!newName) return;
  
      await renameLayerInBackend(projectId, pathId, layerId, newName);
  
      // Update the local state
      setProject((prevProject) => {
        const updatedPaths = prevProject.paths.map((path) => {
          if (path._id === pathId) {
            const updatedLayers = path.layers.map((layer) => {
              if (layer._id === layerId) {
                return { ...layer, name: newName };
              }
              return layer;
            });
            return { ...path, layers: updatedLayers };
          }
          return path;
        });
        return { ...prevProject, paths: updatedPaths };
      });
  
      // Clear the edited layer name
      setEditedLayerNames((prevLayerNames) => ({
        ...prevLayerNames,
        [layerId]: "",
      }));
    } catch (error) {
      console.error("Error renaming layer:", error);
    }
  };

  // ProjectPage.jsx

  const reorderLayer = async (pathId, layerId, newPosition) => {
    try {
      await put(`/projects/${projectId}/paths/${pathId}/layers/${layerId}/reorder`, {
        newPosition: newPosition,
      });

      // Fetch updated project data and update the state
      const updatedProjectResponse = await get(`/projects/${projectId}`);
      setProject(updatedProjectResponse.data);
    } catch (error) {
      console.error('Error reordering layer:', error);
    }
  };

  const handleMoveLayer = async (layerId, direction) => {
    const selectedPath = project.paths.find((path) => path._id === selectedPathId);
    const currentLayerIndex = selectedPath.layers.findIndex((layer) => layer._id === layerId);
  
    if (currentLayerIndex < 0) {
      return; // Layer not found, handle error
    }
  
    const newLayerIndex = direction === 'up' ? currentLayerIndex - 1 : currentLayerIndex + 1;
  
    if (newLayerIndex < 0 || newLayerIndex >= selectedPath.layers.length) {
      return; // Already at the top or bottom, no need to reorder
    }
  
    await reorderLayer(selectedPath._id, layerId, newLayerIndex);
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
  console.log("Preparing to add image names to MongoDB and upload to Cloudinary!");

  const droppedFiles = Array.from(e.dataTransfer.files);
  setLoadingImages(true);

  if (droppedFiles.length > 0) {
    try {
      const names = droppedFiles.map((file) => file.name);
      const uniqueNames = names.filter(
        (name) =>
          !layerImages[selectedLayer]?.some((imageData) => imageData.name === name)
      );

      if (uniqueNames.length === 0) {
        setLoadingImages(false);
        console.log("No new images to add.");
        return;
      }

      const rarities = Array(uniqueNames.length).fill(100);

      // Add images to MongoDB
      const response = await post(
        `/projects/${projectId}/paths/${selectedPathId}/layers/${selectedLayer}/images`,
        {
          names: uniqueNames,
          rarities: rarities,
        }
      );
      console.log("Image names and rarities added to MongoDB:", response.data);

      // Upload images to Cloudinary
      const imageIds = await Promise.all(
        uniqueNames.map((name) =>
          uploadImage(
            droppedFiles.find((file) => file.name === name),
            projectId,
            selectedPathId,
            selectedLayer
          )
        )
      );

      // Update the layerImages state
      setLayerImages((prevLayerImages) => ({
        ...prevLayerImages,
        [selectedLayer]: [
          ...(prevLayerImages[selectedLayer] || []),
          ...imageIds.map((id, index) => ({
            name: uniqueNames[index],
            rarity: rarities[index],
            cloudinaryId: id,
          })),
        ],
      }));

      setLoadingImages(false);
    } catch (error) {
      console.error("Error adding image and uploading images:", error);
    }
  }
};

const handleDeleteImage = (imageId) => {
  // Log the received imageId
  console.log('Received imageId:', imageId);

  // Assuming you have the image data in the layerImages state
  const imageName = getImageNameFromLayerImages(imageId);
  
  // Log the name of the image
  console.log('Deleting image:', imageName);

  // Add the logic to delete the image here
  // ...
};


const getImageNameFromLayerImages = (imageId) => {
  for (const layerId in layerImages) {
    const images = Object.values(layerImages[layerId]);
    for (const imageData of images) {
      if (imageData.cloudinaryId === imageId) {
        return imageData.name;
      }
    }
  }
  return 'Image Not Found';
};



  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{project.name}</h2>
      <Link to={`/randomize?projectId=${projectId}`} className="randomize-button-link">
        <button className="randomize-button">Randomize</button>
      </Link>
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
              {editingPathId === path._id ? (
                <>
                  <input
                    type="text"
                    value={editedPathName}
                    onChange={(e) => setEditedPathName(e.target.value)}
                  />
                  <button onClick={() => handleRenamePath(path._id)}>Save</button>
                </>
              ) : (
                <>
                  <h4
                    onClick={() => {
                      selectPath(path._id);
                      handlePathClick();
                    }}
                    style={{ cursor: 'pointer', marginRight: '1rem' }}
                  >
                    {path.name}
                  </h4>
                  <button onClick={() => startEditing(path._id)}>Edit</button>
                  <button onClick={() => handleClonePath(path._id)}>Clone Path</button>
                  <button onClick={() => handleDeletePath(path._id)}>Delete Path</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {selectedPathId && (
        <div>
  <h3>Selected Path Layers:</h3>
  <ul>
    {selectedPathId &&
      project.paths
        .find((path) => path._id === selectedPathId)
        .layers.map((layer, index) => {
          const selectedPath = project.paths.find((path) => path._id === selectedPathId);
          return (
            <li key={layer._id}>
      <h4
        onClick={() => handleClick(layer._id)}
        style={{ cursor: 'pointer' }}
      >
        {editedLayerNames[layer._id] ? (
          <input
            type="text"
            value={editedLayerNames[layer._id]}
            onChange={(e) => {
              const value = e.target.value;
              setEditedLayerNames((prevLayerNames) => ({
                ...prevLayerNames,
                [layer._id]: value,
              }));
            }}
            onBlur={() => handleRenameLayer(selectedPathId, layer._id)}
          />
        ) : (
          layer.name
        )}
      </h4>
      {editedLayerNames[layer._id] ? (
        <button onClick={() => handleRenameLayer(selectedPathId, layer._id)}>
          Save
        </button>
      ) : (
        <>
          <button
            onClick={() =>
              setEditedLayerNames((prevLayerNames) => ({
                ...prevLayerNames,
                [layer._id]: layer.name,
              }))
            }
          >
            Edit
          </button>
          <button onClick={() => handleDeleteLayer(selectedPathId, layer._id)}>
            Delete Layer
          </button>
          <button
            onClick={() => handleMoveLayer(layer._id, 'up')}
            disabled={index === 0}
          >
            Move Up
          </button>
          <button
            onClick={() => handleMoveLayer(layer._id, 'down')}
            disabled={index === selectedPath.layers.length - 1}
          >
            Move Down
          </button>
        </>
      )}
    </li>
  )})}
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
            {Object.values(layerImages[selectedLayer])
              .filter((imageData) => imageData.name !== 'None') // Exclude images with the name "None"
              .map((imageData, idx) => (
                <div key={idx} className="image-wrapper">
                  <img
                    src={`https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/image-jumble/${project._id}/${selectedPathId}/${selectedLayer}/${imageData.name}`}
                    alt={imageData.name}
                    className="image"
                  />
                  {/* Display rarity or any other relevant information from imageData */}
                  <p>{imageData.name}</p>
                  {/* <button
                      onClick={() => handleDeleteImage(projectId, selectedPathId, selectedLayer, imageData.name)}
                      className="delete-button"
                    >
                      Delete
                    </button> */}
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

