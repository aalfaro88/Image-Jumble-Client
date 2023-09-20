// pages/RandomizePage.jsx
//WORKING CODE!!! RETURN HERE IF NEEDED!!! CMD Z
import React, { useContext, useEffect, useState } from "react";
import JSZip from "jszip";
import { useLocation, Link } from "react-router-dom";
import { get, post, put } from "../services/authService";
import { loadStripe } from "@stripe/stripe-js";
import { SERVER_URL } from "../services/SERVER_URL";
import { AuthContext } from "../context/auth.context";
import * as XLSX from 'xlsx';


function RandomizePage() {
  const [project, setProject] = useState({ id: "", layers: [] });
  const [transformedImages, setTransformedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get("projectId");
  const [stripe, setStripe] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activePath, setActivePath] = useState(null);
  const [activeLayer, setActiveLayer] = useState(null);
  const [imageValues, setImageValues] = useState({});
  const [activeLayerImages, setActiveLayerImages] = useState([]);
  const [activeLayerImagesForColumn, setActiveLayerImagesForColumn] = useState([]);
  const [pathCollectionSizes, setPathCollectionSizes] = useState({});
  const [imageRarityValues, setImageRarityValues] = useState({});
  const [serverResponse, setServerResponse] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [displayData, setDisplayData] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [imagePreview, setImagePreview] = useState([]);
  const currentURL = window.location.href;
  const sessionIdIndex = currentURL.indexOf("session_id=");
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [imageName, setImageName] = useState("");

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const res = await get(`/projects/${projectId}`); // replace projectId with the actual project ID
        setCollectionName(res.data.collectionName || '');
        setCollectionDescription(res.data.collectionDescription || '');
        setImageName(res.data.imageName || '');
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
  
    fetchProjectData();
  }, []); // The empty dependency array means this useEffect runs once when the component mounts
  


  // Event handler functions to update the state variables
  const handleCollectionNameChange = (e) => {
    setCollectionName(e.target.value);
  };

  const handleCollectionDescriptionChange = (e) => {
    setCollectionDescription(e.target.value);
  };

  const handleImageNameChange = (e) => {
    setImageName(e.target.value);
  };

  useEffect(() => {
    const updateCollectionName = async () => {
      if (collectionName !== '') {
        try {
          await put(`/projects/collectionName/${projectId}`, { collectionName });
          console.log('Collection name updated successfully.');
        } catch (error) {
          console.error('Error updating collection name:', error);
        }
      }
    };
  
    updateCollectionName();
  }, [collectionName]);
  
  useEffect(() => {
    const updateCollectionDescription = async () => {
      if (collectionDescription !== '') {
        try {
          await put(`/projects/collectionDescription/${projectId}`, { collectionDescription });
          console.log('Collection description updated successfully.');
        } catch (error) {
          console.error('Error updating collection description:', error);
        }
      }
    };
  
    updateCollectionDescription();
  }, [collectionDescription]);
  
  useEffect(() => {
    const updateImageName = async () => {
      if (imageName !== '') {
        try {
          await put(`/projects/imageName/${projectId}`, { imageName });
          console.log('Image name updated successfully.');
        } catch (error) {
          console.error('Error updating image name:', error);
        }
      }
    };
  
    updateImageName();
  }, [imageName]);
  
  


  useEffect(() => {
    setActiveLayerImagesForColumn([]);
    setImageRarityValues([]); // Reset to empty array
  }, [activePath, projectId, activeLayer]);
  
  useEffect(() => {
    if (serverResponse && serverResponse.logOutputArray) {
      const newDisplayData = serverResponse.logOutputArray; // Display data remains the same
      const newExcelData = convertToExcelFormat(serverResponse); // Convert to Excel format
  
      setDisplayData(newDisplayData);
      setExcelData(newExcelData);
    }
  }, [serverResponse]);
  
  useEffect(() => {
    if (projectId) {
      get(`/projects/${projectId}`)
        .then((response) => {
          const projectDetails = {
            id: response.data._id,
            name: response.data.name,
            collectionName: response.data.collectionName,
            collectionDescription: response.data.collectionDescription,
            imageName: response.data.imageName,
            paths: response.data.paths.map((path) => ({
              pathId: path._id,
              name: path.name,
              pathSize: path.pathSize,
              layers: path.layers.map((layer) => ({
                layerId: layer._id,
                name: layer.name,
                images: layer.images.map((image) => ({
                  ...image,
                  rarity: image.rarity,
                })),
              })),
            })),
          };
          
          // Extract additional info in the desired format
          const additionalInfo = projectDetails.paths.map((path) => {
            return path.layers.map((layer) => {
              const layerName = layer.name;
              return layer.images.reduce((layerInfo, image) => {
                layerInfo[layerName] = image.name;
                return layerInfo;
              }, {});
            });
          });
          
          // Set both project details and additional info in state
          setProject(projectDetails);
          setAdditionalInfo(additionalInfo);
  
          const initialPathCollectionSizes = projectDetails.paths.reduce((acc, path) => {
            acc[path.pathId] = path.pathSize;
            return acc;
          }, {});
          setPathCollectionSizes(initialPathCollectionSizes);
        })
        .catch((error) => {
          console.error("Error fetching project:", error);
        });
    }
  }, [projectId]);
  

  useEffect(() => {
    setActiveLayerImagesForColumn([]);
    setImageRarityValues([]);
  }, [activePath]);
  

const setActiveLayerImagesForPath = (layerId) => {
  const pathWithActiveLayer = project.paths.find(
    (path) =>
      path.pathId === activePath &&
      path.layers.some((layer) => layer.layerId === layerId)
  );
  
  if (pathWithActiveLayer) {
    const activeLayer = pathWithActiveLayer.layers.find(
      (layer) => layer.layerId === layerId
    );
  
    const imageRarities = activeLayer.images.map(image => image.rarity);
    setActiveLayerImagesForColumn(activeLayer.images);
    setImageRarityValues(imageRarities); // Set with rarities fetched from MongoDB
  } else {
    setActiveLayerImagesForColumn([]); 
    setImageRarityValues([]); 
  }
};

useEffect(() => {
  if (activeLayer !== null) {
    setActiveLayerImagesForPath(activeLayer);
  }
}, [activeLayer, project]); 
   
const handleRandomize = () => {
  console.log("Starting handleRandomize...");
  // setIsLoading(true);

  console.log("Creating EventSource...");
  const eventSource = new EventSource(`${SERVER_URL}/overlay-images-progress`);

  eventSource.onopen = () => {
    console.log("EventSource connection opened.");
  };

  eventSource.onmessage = (event) => {
    console.log("Received message from EventSource:", event.data);
    const data = JSON.parse(event.data);
    const progress = data.progress;
    console.log(`Processing progress: ${progress}%`);
    setProcessingProgress(progress);
  };

  eventSource.onerror = (error) => {
    console.error("Error with SSE:", error);
  };

  // Extracting image URLs from project's paths and layers
  const pathSizes = [];
  const projectInfo = project
  console.log("PROJECTID",projectId)

  // Extracting image URLs from project's paths and layers
  const imageUrlsWithRarity = project.paths.map((path) => {
    const pathId = path.pathId;
  
    // Collect path size
    pathSizes.push(path.pathSize);
  
    return {
      pathId,
      layers: path.layers.map((layer) => {
        const layerId = layer.layerId;
        const totalRarity = layer.images.reduce((sum, imageObj) => sum + imageObj.rarity, 0);
  
        // Handle the "None" image separately
        const noneImage = layer.images.find((imageObj) => imageObj.name === "None");
        if (noneImage) {
          // If the "None" image exists in the layer, calculate its rarity ratio
          const rarityRatio = noneImage.rarity / totalRarity;
  
          return {
            layerId,
            images: [
              ...layer.images.map((imageObj) => {
                // Replace the "None" image with its rarity, but with the name "None"
                if (imageObj.name === "None") {
                  return { url: "None", rarity: rarityRatio };
                }
  
                const url = `https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/image-jumble/${projectId}/${pathId}/${layerId}/${imageObj.name}`;
  
                // Calculate the new rarity ratio for each image
                const imageRarityRatio = imageObj.rarity / totalRarity;
  
                return { url, rarity: imageRarityRatio };
              }),
            ],
          };
        } else {
          // If there is no "None" image, proceed with the regular images
          return {
            layerId,
            images: layer.images.map((imageObj) => {
              const url = `https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/image-jumble/${projectId}/${pathId}/${layerId}/${imageObj.name}`;
  
              // Calculate the new rarity ratio for each image
              const rarityRatio = imageObj.rarity / totalRarity;
  
              return { url, rarity: rarityRatio };
            }),
          };
        }
      }),
    };
  });

  console.log("Image URLs to be sent to the server:", imageUrlsWithRarity);
  console.log("Path Sizes to be sent to the server:", pathSizes); // Log path sizes

  const numImages = totalCollectionSize;

  // Include pathSizes in the data sent to the server
  post("/overlay-images", { imageUrlsWithRarity, pathSizes, numImages, projectInfo })
    .then((response) => {
      console.log("Image processing completed.");
      console.log("Response from server:", response.data.allSelectedUrls);
      setServerResponse(response.data);
      setTransformedImages(response.data.imageUrlsWithRarity);
      setResponseData(response.data);

      // Log additionalInfo
      console.log("Additional Info from server:", response.data.additionalInfo);
    })
    .catch((error) => {
      console.error("Error sending image URLs to the server:", error);
    })
    .finally(() => {
      console.log("Finishing handleRandomize...");
      setIsLoading(false);
      eventSource.close();
    });
};

const totalCollectionSize = Object.values(pathCollectionSizes).reduce(
  (total, size) => total + (isNaN(size) ? 0 : size),
  0
);


const updatePathSizeInDB = async (projectId, pathId, newSize) => {
  const url = `/projects/${projectId}/paths/${pathId}/size`; 
  console.log("Attempting to PUT to:", url, { pathSize: newSize });

  try {
    const response = await put(url, { pathSize: newSize });
    console.log("Path size updated:", response.data);

    // Update pathCollectionSizes state
    setPathCollectionSizes(prev => ({ ...prev, [pathId]: newSize }));

    // Update project state
    setProject(prev => {
      const updatedPaths = prev.paths.map(path => 
        path.pathId === pathId ? {...path, pathSize: newSize} : path
      );
      return { ...prev, paths: updatedPaths };
    });

  } catch (error) {
    console.log("Error updating path size:", error);
  }
};


const updateImageRarityInDB = async (projectId, pathId, layerId, imageId, newRarity) => {
  const url = `/projects/${projectId}/paths/${pathId}/layers/${layerId}/images/${imageId}/rarity`;
  console.log("Attempting to PUT to:", url, { newRarity });

  try {
    const response = await put(url, { newRarity });
    console.log("Image rarity updated:", response.data);
  } catch (error) {
    console.log("Error updating image rarity:", error);
  }
};

const updateRarity = (index, newRarityValue) => {
  const updatedImages = [...activeLayerImagesForColumn];
  updatedImages[index].rarity = newRarityValue;
  setActiveLayerImagesForColumn(updatedImages);
};

const totalRarity = activeLayerImagesForColumn.reduce((sum, imageObj) => sum + imageObj.rarity, 0);
const collectionSize = pathCollectionSizes[activePath] || 0;

const handleGenerateCollection = async () => {
  try {
    // Log project information
    console.log('Project Information:', project);
    console.log(serverResponse.logOutputArray);

    // Extract the allSelectedUrls from responseData
    const allSelectedUrls = responseData?.allSelectedUrls;

    // Make a POST request to the server with the allSelectedUrls data
    const response = await fetch(`${SERVER_URL}/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ allSelectedUrls }), // Convert data to JSON and send it in the request body
    });

    if (!response.ok) {
      console.error('Failed to generate the image collection.');
      return;
    }

    // Parse the response to get the generated image URLs
    const { imageUrls } = await response.json();

    // Create metadata for each generated image
    const metadataArray = imageUrls.map((url, idx) => {
      const attributes = serverResponse.logOutputArray[idx];
      const attributeEntries = Object.entries(attributes).map(([trait_type, value]) => ({ trait_type, value }));
      
      return {
        name: `${project.imageName} #${idx + 1}`,
        description: project.collectionDescription,
        image: "",  // URL left empty for now
        external_url:"",
        attributes: attributeEntries,
      };
    });

    // Handle the download of the generated collection
    handleDownloadCollection(imageUrls, metadataArray);  // Pass the metadataArray to the next function

  } catch (error) {
    console.error('Error sending data to the server or handling the response:', error);
  }
};



const handleDownloadCollection = (imageUrls, metadataArray) => {
  // Create a zip file with the generated images
  const zip = new JSZip();
  const imageDownloadPromises = [];

  // Create an assets folder in the zip file
  const assetsFolder = zip.folder('assets');

  // Download each image and add it to the assets folder in the zip file
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    imageDownloadPromises.push(
      fetch(imageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const imageName = `${i + 1}.png`;
          assetsFolder.file(imageName, blob);  // Adding files to the assets folder instead of the root of the zip file
        })
    );
  }

  // Create a metadata folder in the zip file
  const metadataFolder = zip.folder('metadata');
  // Construct consolidated metadata object
  const consolidatedMetadata = {
    name: project.collectionName, // Assuming 'project.collectionName' contains the collection name
    description: project.collectionDescription, // Assuming 'project.collectionDescription' contains the collection description
    collection: metadataArray,
  };

  // Add consolidated metadata file to the metadata folder
  metadataFolder.file("metadata.json", JSON.stringify(consolidatedMetadata, null, 2));


  // Add each metadata object as a JSON file in the metadata folder
  metadataArray.forEach((metadata, idx) => {
    metadataFolder.file(`${idx + 1}.json`, JSON.stringify(metadata, null, 2));
  });
  

  // Wait for all image downloads to complete
  Promise.all(imageDownloadPromises)
    .then(() => {
      // Generate the zip file and initiate the download
      zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
        const zipFileName = 'image_collection.zip';
        const zipUrl = URL.createObjectURL(zipBlob);

        // Create a download link and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = zipUrl;
        downloadLink.download = zipFileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Clean up the temporary URL and link
        URL.revokeObjectURL(zipUrl);
        document.body.removeChild(downloadLink);
      });
    })
    .catch((error) => {
      console.error('Error handling image downloads:', error);
    });
};



const downloadXLS = () => {
  if (serverResponse && serverResponse.logOutputArray) {
    const excelData = convertToExcelFormat(serverResponse); // Use the full data

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'selected_images');
    XLSX.writeFile(wb, 'selected_images.xlsx');
  }
};


// Define a function to convert server response data to Excel format
const convertToExcelFormat = (data) => {
  const excelData = [
    ['Collection ID', 'Layer Name', 'Image Name'],
    ...data.logOutputArray.flatMap((logOutput, collectionIdx) =>
      Object.keys(logOutput).map((layerName, layerIdx) => [
        `#${collectionIdx + 1}`,
        layerName,
        Object.values(logOutput)[layerIdx],
      ])
    ),
  ];

  return excelData;
};

const handleInputChange = (e) => {
  setInputValue(e.target.value);
};

const handlePreviewImage = () => {
  const imageIndex = parseInt(inputValue, 10) - 1;
  if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= serverResponse.allSelectedUrls.length) {
    console.log("Invalid Image ID");
    return;
  }

  const selectedImageUrl = serverResponse.allSelectedUrls[imageIndex];
  console.log("Entered Image ID:", imageIndex);
  console.log("imagePreview:", selectedImageUrl);

  // Set the selected image URL in the state
  setImagePreview(selectedImageUrl);
};
  
  return (
  <div>
    <div className="randomize-header">
      {project ? (
        <h1>{project.name}</h1>
      ) : (
        <h1>Loading...</h1>
      )}
      <div className="random-selection">
        <label className="collection-label">
          Collection size:
          <div className="input-container">
            <input
              type="number"
              value={totalCollectionSize}
              readOnly
              className="collection-input"
            />
          </div>
        </label>
        <button className="randomize-button" onClick={handleRandomize}>
          Randomize
        </button>

        <div>
      <h2>Update Values</h2>
      <form>
        <div>
          <label htmlFor="collectionName">Collection Name:</label>
          <input
            type="text"
            id="collectionName"
            value={collectionName}
            onChange={handleCollectionNameChange}
          />
        </div>
        <div>
          <label htmlFor="collectionDescription">Collection Description:</label>
          <textarea
            id="collectionDescription"
            value={collectionDescription}
            onChange={handleCollectionDescriptionChange}
          ></textarea>
        </div>
        <div>
          <label htmlFor="imageName">Image Name:</label>
          <input
            type="text"
            id="imageName"
            value={imageName}
            onChange={handleImageNameChange}
          />
        </div>
      </form>
    </div>



        <button className="randomize-button" onClick={handleGenerateCollection}>
          Generate Collection
        </button>
      </div>
    </div>
    {/* DONT CHANGE ANYTHING ABOVE HERE */}
    {project && project.paths ? (
      <div className="randomize-container">
        <div className="summary-section">
          <Link to={`/projects/${projectId}`} className="back-link">
            Go Back
          </Link>
          <h1>Summary</h1>
          {project.paths && project.paths.length > 0 && (
            <p className="layer-name-num">
              Number of Paths: {project.paths.length}
            </p>
          )}
          <div className="custom-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Path Name</th>
                  <th>Path Collection Size</th>
                  <th>Layer</th>
                  <th>Image Names</th>
                  <th>Rarity (0 = Won't Appear, 0.1 Rarest to 100 Least Rare)</th>
                  <th>Expected Times in Collection</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {project.paths.map((path) => (
                      <button
                        key={path.pathId}
                        className={`path-button ${
                          activePath === path.pathId ? "active" : ""
                        }`}
                        onClick={() => setActivePath(path.pathId)}
                      >
                        {path.name}
                      </button>
                    ))}
                  </td>
                  <td>
                    {project.paths.map((path) => (
                      <input
                        key={path.pathId}
                        type="text"
                        value={
                          pathCollectionSizes[path.pathId] !== undefined
                            ? pathCollectionSizes[path.pathId]
                            : ""
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === "" || /^\d+$/.test(inputValue)) {
                            const newSize =
                              inputValue !== "" ? parseInt(inputValue) : undefined;
                            setPathCollectionSizes({
                              ...pathCollectionSizes,
                              [path.pathId]: newSize,
                            });

                            updatePathSizeInDB(projectId, path.pathId, newSize);
                          }
                        }}
                      />
                    ))}
                  </td>
                  <td>
                    {activePath &&
                      project.paths
                        .find((path) => path.pathId === activePath)
                        ?.layers.map((layer) => (
                          <button
                            key={layer.layerId}
                            className={`layer-button ${
                              activeLayer === layer.layerId ? "active" : ""
                            }`}
                            onClick={() => {
                              setActiveLayer(layer.layerId);
                              setActiveLayerImagesForPath(layer.layerId);
                            }}
                          >
                            {layer.name}
                          </button>
                        ))}
                  </td>
                  <td>
                    {activeLayerImagesForColumn.map((imageObj, imageIdx) => (
                      <p key={imageIdx}>{imageObj.name}</p>
                    ))}
                  </td>
                  <td>
                    {activeLayerImagesForColumn.map((imageObj, imageIdx) => (
                      <input
                        key={imageIdx}
                        type="number"
                        value={imageObj.rarity}
                        onChange={(e) => {
                          let newValue = parseFloat(e.target.value);
                          newValue = Math.max(0, Math.min(100, newValue));
                          updateRarity(imageIdx, newValue);
                          updateImageRarityInDB(
                            projectId,
                            activePath,
                            activeLayer,
                            imageObj._id,
                            newValue
                          );
                        }}
                      />
                    ))}
                  </td>
                  <td>
                    {activeLayerImagesForColumn.map((imageObj) => {
                      const expectedTimes = Math.ceil(
                        (imageObj.rarity / totalRarity) * collectionSize
                      );
                      return <div key={imageObj._id}>{expectedTimes}</div>;
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="collection-generated">
        <h2>Collection Generated</h2>
        {serverResponse && serverResponse.logOutputArray && (
  <div>
     {console.log('serverResponse:', serverResponse)}
    <p>Selected Images:</p>
    <table>
      <thead>
        <tr>
          <th>Collection ID</th>
          <th>Layer Names</th>
          <th>Image Names</th>
        </tr>
      </thead>
      <tbody>
        {serverResponse.logOutputArray.slice(0, 25).map((logOutput, collectionIdx) => (
          <tr key={collectionIdx}>
            <td>{`#${collectionIdx + 1}`}</td>
            <td>
              <ul>
                {Object.keys(logOutput).map((layerName, layerIdx) => (
                  <li key={layerIdx}>{layerName}</li>
                ))}
              </ul>
            </td>
            <td>
              <ul>
                {Object.values(logOutput).map((imageName, imageIdx) => (
                  <li key={imageIdx}>{imageName}</li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div>
      <button onClick={downloadXLS}>Download Full Output as XLS</button>
      <p>To see the full output, click the "Download Full Output as XLS" button.</p>
    </div>
    <div className="preview-section">
      <h3>Preview</h3>
      <div>
        <label htmlFor="imageIdInput">Enter Image ID:</label>
        <input
          type="text"
          id="imageIdInput"
          placeholder="Image ID"
          value={inputValue}
          onChange={handleInputChange} // Attach the event handler to capture input changes
        />
        <button onClick={handlePreviewImage}>Preview</button>
      </div>

      <div className="preview-image-box">

      {imagePreview && imagePreview.length > 0 ? (
        <div className="stacked-images">
          {imagePreview
            .filter(url => url !== "None") // Filter out "None" URLs
            .map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Image ${index + 1}`}
                className="preview-image"
              />
            ))}
        </div>
      ) : (
        <p>No images to display.</p>
      )}
    </div>




    </div>
  </div>
)}


      </div>
        </div>
      </div>
    ) : (
      <div>Loading...</div>
    )}
  </div>
);

}

export default RandomizePage;
