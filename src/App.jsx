import { useState, useEffect, useMemo } from 'react';

const CLASS_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

function App() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch('predictions.json')
      .then((response) => response.json())
      .then((jsonData) => {
        setItems(jsonData);
      })
      .catch((error) => {
        console.error('Error loading JSON file:', error);
      });

  }, []);

  const selectedItem = useMemo(() => {
    if (selectedId === null) return null;
    return items.find(item => item.id === selectedId) || null;
  }, [items, selectedId]);

  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (items.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    return {
      minX: Math.min(...items.map(d => d.x)),
      maxX: Math.max(...items.map(d => d.x)),
      minY: Math.min(...items.map(d => d.y)),
      maxY: Math.max(...items.map(d => d.y)),
    };
  }, [items]);

  const projWidth = 500;
  const projHeight = 500;
  const projPadding = 30;

  const scaleX = (x) => projPadding + ((x - minX) / (maxX - minX || 1)) * (projWidth - projPadding * 2);
  const scaleY = (y) => projPadding + ((maxY - y) / (maxY - minY || 1)) * (projHeight - projPadding * 2);

  const numClasses = 10;
  const scoreWidth = 800;
  const scoreHeight = 800;
  const rowHeight = scoreHeight / numClasses;
  const scorePaddingX = 140;
  const scorePaddingRight = 40;

  const scaleConfidence = (conf) => scorePaddingX + conf * (scoreWidth - scorePaddingX - scorePaddingRight);

  const itemsWithJitter = useMemo(() => {
    return items.map(item => ({
      ...item,
      jitterY: (Math.random() - 0.5) * 16
    }));
  }, [items]);


  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background-color: #f4f7f9; margin: 0; color: #333; }
        h1 { text-align: center; padding: 15px 0; background: white; margin: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: relative; z-index: 10; font-size: 24px; color: #1a1a2e; }
        #container { display: flex; height: calc(100vh - 65px); padding: 20px; gap: 20px; width: 100vw; }
        #sidebar { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 380px; max-width: 450px; }
        #main-section { flex: 2; display: flex; flex-direction: column; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .view-panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .view-title { font-weight: 600; font-size: 18px; border-bottom: 2px solid #f0f0f5; padding-bottom: 12px; margin-bottom: 15px; color: #2b2d42; display: flex; align-items: center; }
        .view-title::before { content: ''; display: inline-block; width: 6px; height: 18px; background: #4361ee; border-radius: 4px; margin-right: 10px; }
        
        svg.projection-svg { width: 100%; height: 100%; min-height: 350px; background: transparent; border: none; }
        svg.score-svg { width: 100%; height: 100%; background: transparent; border: none; }
        
        #selected-image-info-content { flex: 1; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 24px; color: #333; padding: 10px; }
        .selected-image-wrapper { width: 110px; height: 110px; background: #fff; display: flex; justify-content: center; align-items: center; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); flex-shrink: 0; }
        .selected-image-wrapper img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
        .selected-details { display: flex; flex-direction: column; gap: 8px; font-size: 15px; }

        .placeholder-text { color: #888; font-size: 15px; text-align: center; width: 100%; padding: 30px; border: 1px dashed #ccc; border-radius: 8px; background: #fafafa; }
      `}</style>

      <h1>Data Visualization HW 3 Sample</h1>

      <div id="container">
        <div id="sidebar">
          <div id="projection-view" className="view-panel" style={{ flex: 1.6 }}>
            <div className="view-title">Projection View</div>
            <svg className="projection-svg" viewBox={`0 0 ${projWidth} ${projHeight}`} preserveAspectRatio="xMidYMid meet">
              {items.map(item => {
                const cx = scaleX(item.x);
                const cy = scaleY(item.y);
                const isSelected = selectedId === item.id;
                const isOtherSelected = selectedId !== null && !isSelected;

                return (
                  <circle
                    key={item.id}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 10 : 5}
                    fill={CLASS_COLORS[item.predicted]}
                    opacity={isSelected ? 1 : (isOtherSelected ? 0.1 : 0.6)}
                    stroke={isSelected ? "#333" : "white"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{ cursor: 'pointer', transition: 'r 0.2s, opacity 0.2s' }}
                    onMouseEnter={() => setSelectedId(item.id)}
                    onMouseLeave={() => setSelectedId(null)}
                  />
                );
              })}
            </svg>
          </div>











          <div id="selected-image-info" className="view-panel" style={{ flex: 1, minHeight: '180px' }}>
            <div className="view-title">Selected Image</div>
            <div id="selected-image-info-content">
              {selectedItem ? (
                <>
                  <div className="selected-image-wrapper">
                    <img src={`images/image-${selectedItem.id}.png`} alt={`ID: ${selectedItem.id}`} />
                  </div>
                  <div className="selected-details">
                    <div><strong>ID:</strong> {selectedItem.id}</div>
                    <div><strong>Labeled as:</strong> {selectedItem.label}</div>
                    <div><strong>Predicted as:</strong> {selectedItem.predicted} (Confidence: {selectedItem.confidence.toFixed(3)})</div>
                  </div>
                </>

              ) : (
                <div className="placeholder-text">Hover over a dot in the Projection View</div>


















              )}
            </div>
          </div>
        </div>


        <div id="main-section">
          <div style={{ padding: '20px 20px 0 20px' }}>
            <div className="view-title">Score Distributions</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
            <svg className="score-svg" viewBox={`0 0 ${scoreWidth} ${scoreHeight}`} preserveAspectRatio="xMidYMid meet" style={{ minHeight: '600px' }}>
              {/* X-Axis labels for confidence */}
              <g transform="translate(0, 25)">
                {[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(val => (
                  <g key={val} transform={`translate(${scaleConfidence(val)}, 0)`}>
                    <line y2="8" stroke="#ccc" />
                    <text y="22" textAnchor="middle" fontSize="12" fill="#888">{val.toFixed(1)}</text>
                  </g>
                ))}
                <line x1={scaleConfidence(0)} x2={scaleConfidence(1)} y1="0" y2="0" stroke="#ccc" strokeWidth="1" />
              </g>

              {/* Rows for each class */}
              {Array.from({ length: numClasses }).map((_, classIndex) => {
                const rowY = 50 + classIndex * (rowHeight * 0.9);
                const isSelectedRow = selectedItem && selectedItem.label === classIndex;

                return (
                  <g key={classIndex} transform={`translate(0, ${rowY})`}>

                    {/* Bounding box if this row corresponds to selected item's true label */}
                    {isSelectedRow && (
                      <rect
                        x="0"
                        y="5"
                        width={scoreWidth}
                        height={rowHeight * 0.9 - 10}
                        fill="rgba(67, 97, 238, 0.03)"
                        stroke="#333"
                        strokeWidth="1.5"
                        rx="4"
                      />
                    )}

                    {/* Row Label Area */}
                    <g transform={`translate(10, ${(rowHeight * 0.9) / 2 - 12})`}>
                      <rect x="0" y="-14" width="55" height="22" rx="4" fill={CLASS_COLORS[classIndex]} />
                      <text x="27.5" y="2" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Class {classIndex}</text>

                      <text x="0" y="20" fontSize="11" fill="#666">Labeled as {classIndex}</text>
                      <text x="0" y="34" fontSize="11" fill="#666">Predicted as {classIndex}</text>
                    </g>

                    {/* Strip plot line for the row */}
                    <line x1={scorePaddingX} x2={scaleConfidence(1)} y1={(rowHeight * 0.9) / 2} y2={(rowHeight * 0.9) / 2} stroke="#f0f0f5" strokeWidth="2" />

                    {/* Data points (squares) */}
                    {itemsWithJitter.filter(d => d.label === classIndex).map(d => {
                      const isSelectedPoint = selectedItem && selectedItem.id === d.id;
                      const cx = scaleConfidence(d.confidence);
                      const cy = (rowHeight * 0.9) / 2 + d.jitterY;

                      return (
                        <rect
                          key={d.id}
                          x={cx - (isSelectedPoint ? 6 : 3)}
                          y={cy - (isSelectedPoint ? 6 : 3)}
                          width={isSelectedPoint ? 12 : 6}
                          height={isSelectedPoint ? 12 : 6}
                          fill={CLASS_COLORS[d.predicted]}
                          opacity={isSelectedPoint ? 1 : 0.3}
                          stroke={isSelectedPoint ? "#000" : "none"}
                          strokeWidth={isSelectedPoint ? 2 : 0}
                          style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                          onMouseEnter={() => setSelectedId(d.id)}
                          onMouseLeave={() => setSelectedId(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
