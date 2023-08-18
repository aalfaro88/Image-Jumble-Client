// pages/HomePage.jsx


import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const InfiniteLooper = ({
  speed,
  direction,
  children,
}) => {
  const [looperInstances, setLooperInstances] = useState(1);
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const setupInstances = () => {
    if (!innerRef.current || !outerRef.current) return;

    const { width } = innerRef.current.getBoundingClientRect();
    const { width: parentWidth } = outerRef.current.getBoundingClientRect();
    const instanceWidth = width / innerRef.current.children.length;

    if (width < parentWidth + instanceWidth) {
      setLooperInstances(looperInstances + Math.ceil(parentWidth / width));
    }
  };

  useEffect(() => {
    setupInstances();
    window.addEventListener("resize", setupInstances);

    return () => {
      window.removeEventListener("resize", setupInstances);
    };
  }, []);

  return (
    <div className="looper" ref={outerRef}>
      <div className="looper__innerList" ref={innerRef} data-animate="true">
        {[...Array(looperInstances)].map((_, ind) => (
          <div
            key={ind}
            className="looper__listInstance"
            style={{
              animationDuration: `${speed}s`,
              animationDirection: direction === "right" ? "reverse" : "normal",
            }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const isLoggedIn = !!localStorage.getItem("authToken");

  const imageUrls = [
    "https://i.seadn.io/gae/FgUKEYguVmTwDHyoks-KICXPz-xlgISWl733wqKxHLjWOSTeWvsgddtktBmRmngd2XOyyGSBgG3XL8uXjmCgUVQB-kuQOW8vOaCp9w?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/34db8783565ad9496660a109d714c91d.png?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/29dffb9b4357745584fc0508594e4f01.png?auto=format&dpr=1&w=384",
    "https://i.seadn.io/gcs/files/93dfe3825b724462497d09fb57cc79ca.png?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/e4f8c7574bf861c8e5e7d387d618d72e.png?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/80f04b91b1f2c9b192ebc4934f371041.png?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/ae0fc06714ff7fb40217340d8a242c0e.gif?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/8566bea8cb6b66fdc925487c5f6033d5.png?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gae/k737mWNoojEvEXZH46khJ8rAyTJwZS7P21CjTbwcH47xKtPSmbZIi65bNRZgaF8YotS45QzJ8VReUbHjdoiGDXB5UEE8UYgY7wU61nM?auto=format&dpr=1&w=1000",
    "https://i.seadn.io/gcs/files/5f461cec9827ce9673b07b8c1edb6402.png?auto=format&dpr=1&w=1000",
  ];

  return (
    <div>
      <h1 className="main-title">Welcome to Image Jumble</h1>
      <p className="subtitle">Unveil the Unexpected: Your Creations, Transformed</p>
      <div className="get-started">
      <Link to={isLoggedIn ? "/create-project" : "/login"}>
        <button>Get Started</button>
      </Link>
      </div>
      <div className="image-section">
        <InfiniteLooper speed={25} direction="left">
          {imageUrls.map((imageUrl, index) => (
            <div key={index} className="image-wrapper">
              <img src={imageUrl} alt={`Moving Image ${index + 1}`} className="image" />
            </div>
          ))}
        </InfiniteLooper>
      </div>
      <div className="about-section">
        <h2>About Image Jumble</h2>
        <p>
          Watch as your images come together in unique arrangements, creating surprising new visuals with Image Jumble.
        </p>
      </div>
    </div>
  );
};

export default HomePage;