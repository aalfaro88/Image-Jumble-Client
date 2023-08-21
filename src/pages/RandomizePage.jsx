// pages/RandomizePage.jsx
//WORKING CODE!!! RETURN HERE IF NEEDED!!! CMD Z
import React, { useContext, useEffect, useState } from "react";
import JSZip from "jszip";
import { useLocation, Link } from "react-router-dom";
import { get, post } from "../services/authService";
import { loadStripe } from "@stripe/stripe-js";
import { SERVER_URL } from "../services/SERVER_URL";
import { AuthContext } from "../context/auth.context";

function RandomizePage() {
  const [project, setProject] = useState({ id: "", layers: [] });
  const [collectionSize, setCollectionSize] = useState(3);
  const [transformedImages, setTransformedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get("projectId");
  const [stripe, setStripe] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const [processingProgress, setProcessingProgress] = useState(0);


  const currentURL = window.location.href;
  const sessionIdIndex = currentURL.indexOf("session_id=");

  // console.log(window.location.host)
  
  let sessionId;
  
  if (sessionIdIndex !== -1) {
    sessionId = currentURL.substring(sessionIdIndex + 11); 
    console.log("Extracted session_id:", sessionId);
  } else {
    sessionId = false;
    // console.log("No session_id parameter found in the URL");
  }

  useEffect(() => {
    async function fetchStripeKey() {
      try {
        const response = await fetch(`${SERVER_URL}/get-stripe-key`);
        const data = await response.json();
        const stripeKey = data.publishableKey;
  
        const stripe = await loadStripe(stripeKey);
        setStripe(stripe);
      } catch (error) {
        console.error("Error fetching Stripe key:", error);
      }
    }
  
    fetchStripeKey();
  }, []);

  
  // useEffect(() => {
  //   console.log("Fetching user profile data...");
  //   async function fetchUserProfile() {
  //     try {
  //       if (user && user._id && setUser) { 
  //         const response = await get(`/users/${user._id}`);
  //         const userProfile = response.data;
  //         setUser(prevUser => ({ ...prevUser, randomize_tokens: userProfile.randomize_tokens }));
  //         console.log("Fetched user profile:", userProfile);
  //         console.log("Tokens:", userProfile.randomize_tokens);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user profile:", error);
  //     }
  //   }
  
  //   fetchUserProfile();
  // }, [user, setUser]);
  
 
  const handleAddinfo = async () => {
    try {
      const response = await post(`/users/${user._id}/update-tokens`, {

        randomize_tokens: 7
      });
  
      const userProfile = response.data;
      setUser(prevUser => ({ ...prevUser, randomize_tokens: userProfile.randomize_tokens }));
      console.log("Fetched user profile:", userProfile);
      console.log("Tokens:", userProfile.randomize_tokens);
    } catch (error) {
      console.error("Error updating tokens:", error.response ? error.response.data : error);
    }
  };
  
  
  useEffect(() => {
    if (projectId) {
      get(`/projects/${projectId}`)
        .then((response) => {
          const projectDetails = {
            id: response.data._id,
            name: response.data.name, 
            layers: response.data.layers.map((layer) => ({
              layerId: layer._id,
              name: layer.name,
              images: layer.images,
            })),
          };
          setProject(projectDetails);
        })
        .catch((error) => {
          console.error("Error fetching project:", error);
        });
    }
  }, [projectId]);
  
  const handleRandomize = () => {
    console.log("Starting handleRandomize...");
    setIsLoading(true);
  
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
  
    const overlayImages = project.layers;
    const imageUrls = overlayImages.map((layer) => {
      const layerId = layer.layerId;
      const images = layer.images.map((image) => {
        return `https://res.cloudinary.com/dtksvajmx/image/upload/v1691356199/image-jumble/${projectId}/${layerId}/${image}`;
      });
      return images;
    });
  
    console.log("Image URLs to be sent to the server:", imageUrls);
  
    const numImages = collectionSize;
  
    post("/overlay-images", { imageUrls, numImages })
      .then((response) => {
        console.log("Image processing completed.");
        setTransformedImages(response.data.imageUrls);
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
  
  
  
const handlePayment = async () => {
  try {
    setIsLoading(true);

    const paymentResponse = await fetch(`${SERVER_URL}/create-hello-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUrl: window.location.href }),
    });

    if (!paymentResponse.ok) {
      console.error("Error initiating payment:", paymentResponse.statusText);
      setIsLoading(false);
      return;
    }

    const paymentData = await paymentResponse.json();

    setClientSecret(paymentData.clientSecret);

    const { error } = await stripe.redirectToCheckout({
      sessionId: paymentData.clientSecret,
    });

    if (error) {
      console.error("Stripe error:", error);
      setIsLoading(false);
      return;
    }

    console.log("Stripe checkout completed.");

    const webhookResponse = await fetch(`${SERVER_URL}/get-webhook-response`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (webhookResponse.ok) {
      const responseData = await webhookResponse.json();

      console.log("Webhook response:", responseData);
    } else {
      console.error("Error getting webhook response:", webhookResponse.statusText);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    setIsLoading(false);
  }
};

  
  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();


      transformedImages.forEach((imageUrl, idx) => {
        const imageName = `${idx + 1}.png`;

        zip.file(`projectName/${imageName}`, fetch(imageUrl).then((response) => response.blob()));
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = "projectImages.zip";
      downloadLink.click();

    } catch (error) {
      console.error("Error generating ZIP file:", error);
    }
  };
  

  return (
    <div>
      <div className="randomize-header">
        <h1>{project.name}</h1>
        <div className="random-selection">
        <label className="collection-label">
            Collection size:
            <div className="input-container">
              <input
                type="number"
                value={collectionSize}
                onChange={(e) => setCollectionSize(Math.max(1, parseInt(e.target.value)))}
                min={1}
                step={1}
                className="collection-input"
              />
            </div>
          </label>
          <button className="randomize-button" onClick={handleRandomize}>
            Randomize
          </button>

        </div>
      </div>
  
      <div className="randomize-container">
        <div className="summary-section">
          <Link to={`/projects/${projectId}`} className="back-link">
            Go Back
          </Link>
          <h1>Summary</h1>
          {project.layers.length > 0 && (
            <p className="layer-name-num">Number of Layers: {project.layers.length}</p>
          )}
          {project.layers.map((layer, idx) => (
            <div key={idx} className="layer-summary">
              <p className="layer-name">{layer.name}:</p>
              <p className="num-images">{layer.images.length} images</p>
            </div>
          ))}
        </div>
        <div className="imagesAndDownload">
        {isLoading && (
          <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="progress-text">
            {isLoading && <p>Processing: {processingProgress}%</p>}
          </div>
          <p className="do-not-refresh">Do not refresh...</p>
        </div>
        )}
          <div className="layer-images-random">
            {transformedImages.map((imageUrl, idx) => (
              <div key={idx} className="image-wrapper">
                <img src={imageUrl} alt={`Transformed ${idx + 1}`} className="transformed-image" />
              </div>
            ))}
          </div>
          <button
            className={`randomize-button ${transformedImages.length === 0 ? 'disabled-button' : ''}`}
            onClick={handleDownloadAll}
            disabled={transformedImages.length === 0}
            >
            Download All
          </button>
          {/* <button className="randomize-button" onClick={handleAddinfo}>
            Info
          </button> */}
        </div>
      </div>
    
    </div>
  );
}
  

export default RandomizePage;
