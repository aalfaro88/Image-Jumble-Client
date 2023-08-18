import React, { useState } from 'react';

const MatrixPage = () => {
    const [rectangles, setRectangles] = useState([]);
    const [zoom, setZoom] = useState(1);
    const [activeConnector, setActiveConnector] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [lines, setLines] = useState([]);

  
  const addRectangle = () => {
    setRectangles(prevRectangles => [...prevRectangles, { x: 0, y: 0 }]);
  };

  const handleMouseMove = (event, index) => {
    if (!isDown) return;
    event.preventDefault();

    const deltaX = event.movementX;
    const deltaY = event.movementY;

    setRectangles(prevRectangles => {
      const updatedRectangles = [...prevRectangles];
      const rect = updatedRectangles[index];
      const newPosX = rect.x + deltaX;
      const newPosY = rect.y + deltaY;

      return updatedRectangles.map((r, i) =>
        i === index ? { ...r, x: newPosX, y: newPosY } : r
      );
    });
  };

  let isDown = false;

  const handleMouseDown = (e, index) => {
    e.preventDefault();
    isDown = true;

    const offset = [
      rectangles[index].x - e.clientX,
      rectangles[index].y - e.clientY,
    ];

    const handleMouseUp = () => {
      isDown = false;
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', event =>
      handleMouseMove(event, index, offset)
    );
  };

  const handleConnectorMouseDown = (e, rectIndex, connector) => {
    e.stopPropagation();
    setActiveConnector({ rectIndex, connector });
    const rect = rectangles[rectIndex];
    setLines([...lines, { start: rect[connector], end: mousePosition }]);
  };

  const handleWorkAreaMouseMove = e => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    if (activeConnector) {
      const { rectIndex, connector } = activeConnector;
      const newLines = [...lines];
      newLines[newLines.length - 1] = {
        start: rectangles[rectIndex][connector],
        end: mousePosition
      };
      setLines(newLines);
    }
  };
  
  const handleWorkAreaMouseUp = () => {
    if (activeConnector) {
      setActiveConnector(null);
    }
  };

  const Line = ({ start, end }) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.sqrt((end.y - start.y) ** 2 + (end.x - start.x) ** 2);
    return (
      <div
        className="line"
        style={{
          left: start.x,
          top: start.y,
          width: length,
          transform: `rotate(${angle}rad)`
        }}
      />
    );
  };
  
  
  

  return (
    <div className="matrix-page">
      <h2>WorkArea</h2>
      <button onClick={addRectangle}>Add Rectangle</button>
      <div className="work-area" style={{ transform: `scale(${zoom})` }} onMouseMove={handleWorkAreaMouseMove} onMouseUp={handleWorkAreaMouseUp}>
        <div className="zoom-controls">
          <button onClick={() => setZoom(zoom + 0.1)}>Zoom In</button>
          <button onClick={() => setZoom(zoom - 0.1)}>Zoom Out</button>
        </div>
        {rectangles.map((rect, index) => (
          <div
            key={index}
            className="rectangle"
            style={{ left: rect.x, top: rect.y }}
            onMouseDown={e => handleMouseDown(e, index)}
          >
            <div
              className="connector-dot left-dot"
              onMouseDown={e => handleConnectorMouseDown(e, index, "left")}
            />
            <div
              className="connector-dot right-dot"
              onMouseDown={e => handleConnectorMouseDown(e, index, "right")}
            />
          </div>
        ))}
        {lines.map((line, index) => (
          <Line key={index} start={line.start} end={line.end} />
        ))}
      </div>
    </div>
  );
};

export default MatrixPage;
