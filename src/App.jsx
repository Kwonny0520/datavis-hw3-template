import { useState, useMemo } from 'react';
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

              <g transform="translate(0, 25)">
                {[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(val => (
                  <g key={val} transform={`translate(${scaleConfidence(val)}, 0)`}>
                    <line y2="8" stroke="#ccc" />
                    <text y="22" textAnchor="middle" fontSize="12" fill="#888">{val.toFixed(1)}</text>
                  </g>
                ))}
                <line x1={scaleConfidence(0)} x2={scaleConfidence(1)} y1="0" y2="0" stroke="#ccc" strokeWidth="1" />
              </g>


              {Array.from({ length: numClasses }).map((_, classIndex) => {
                const rowY = 50 + classIndex * (rowHeight * 0.9);
                const isSelectedRow = selectedItem && selectedItem.label === classIndex;

                return (
                  <g key={classIndex} transform={`translate(0, ${rowY})`}>


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


                    <g transform={`translate(10, ${(rowHeight * 0.9) / 2 - 12})`}>
                      <rect x="0" y="-14" width="55" height="22" rx="4" fill={CLASS_COLORS[classIndex]} />
                      <text x="27.5" y="2" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Class {classIndex}</text>

                      <text x="0" y="20" fontSize="11" fill="#666">Labeled as {classIndex}</text>
                      <text x="0" y="34" fontSize="11" fill="#666">Predicted as {classIndex}</text>
                    </g>

                    <line x1={scorePaddingX} x2={scaleConfidence(1)} y1={(rowHeight * 0.9) / 2} y2={(rowHeight * 0.9) / 2} stroke="#f0f0f5" strokeWidth="2" />


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

export default App;
