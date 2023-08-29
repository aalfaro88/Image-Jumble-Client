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
  
 
  // const handleAddClonedLayers = async (clonedPathId, selectedPath) => {
  //   console.log("Adding layers to Cloned Path ID:", clonedPathId);
  //   try {
  //     const clonedLayers = selectedPath.layers.map((layer) => ({
  //       name: layer.name,
  //       images: layer.images,
  //     }));
  
  //     // Create cloned layers for the cloned path
  //     await Promise.all(
  //       clonedLayers.map(async (clonedLayer) => {
  //         const clonedLayerResponse = await post(`/projects/${projectId}/paths/${clonedPathId}/layers`, clonedLayer);
  //         console.log("Cloned Layer ID:", clonedLayerResponse.data._id);
  //       })
  //     );
  
  //     // Fetch the updated project data
  //     const updatedProjectResponse = await get(`/projects/${projectId}`);
  //     setProject(updatedProjectResponse.data);
  //   } catch (error) {
  //     console.error("Error adding cloned layers:", error);
  //   }
  // };
  
  const handleClonePath = async (pathId) => {
    console.log(pathId)
    // try {
    //   // Clone the path
    //   const response = await post(`/projects/${projectId}/paths/${pathId}/clone`);
    //   const clonedPath = response.data;

    //   // Update project state
    //   setProject(prevProject => {
    //     const updatedPaths = [...prevProject.paths, clonedPath];
    //     return { ...prevProject, paths: updatedPaths };
    //   });

    //   // Select the cloned path by setting its ID
    //   setSelectedPathId(clonedPath._id);
    // } catch (error) {
    //   console.error("Error cloning path:", error);
    // }
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
    </div>
  );
  
}

export default ProjectPage;

