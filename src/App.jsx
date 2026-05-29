import { useState, useMemo } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import uiConfig from './ui.json';
import { dummyData } from './dummyData';

function App() {
  const [selectedStation, setSelectedStation] = useState(null);
  
  const [filters, setFilters] = useState({
    timePeriodStart: 0,
    timePeriodEnd: 24,
    dayType: ['weekday', 'weekend'],
    ageGroups: ['adult', 'student', 'teen', 'child', 'privileged']
  });

  const uiMap = useMemo(() => {
    const map = {};
    uiConfig.forEach(item => map[item.id] = item);
    return map;
  }, []);

  const toggleFilterArray = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) return { ...prev, [key]: current.filter(v => v !== value) };
      return { ...prev, [key]: [...current, value] };
    });
  };

  const renderUI = (id) => {
    const item = uiMap[id];
    if (!item) return null;

    if (item.id === 'time-period-range') {
      return (
        <div key={id} style={{ width: '100%', padding: '10px 5px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold', color: '#007bff' }}>
            <span>{String(filters.timePeriodStart).padStart(2, '0')}:00</span>
            <span style={{ color: '#ccc' }}>~</span>
            <span>{String(filters.timePeriodEnd).padStart(2, '0')}:00</span>
          </div>
          <Slider
            range min={0} max={24} allowCross={false}
            value={[filters.timePeriodStart, filters.timePeriodEnd]}
            onChange={(values) => setFilters(prev => ({ ...prev, timePeriodStart: values[0], timePeriodEnd: values[1] }))}
            trackStyle={[{ backgroundColor: '#007bff' }]}
            handleStyle={[{ borderColor: '#007bff', backgroundColor: '#fff' }, { borderColor: '#007bff', backgroundColor: '#fff' }]}
          />
        </div>
      );
    }

    switch (item.component) {
      case 'Column': return <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...item.style }}>{item.children?.map(renderUI)}</div>;
      case 'Row': return <div key={id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>{item.children?.map(renderUI)}</div>;
      case 'Text': 
        const isHeader = item.variant === 'h3';
        return <div key={id} style={{ fontWeight: isHeader ? 'bold' : 'normal', fontSize: isHeader ? '18px' : '14px', color: isHeader ? '#111' : '#666' }}>{item.text}</div>;
      case 'ChoicePicker':
        const stateKey = item.value.path.includes('dayType') ? 'dayType' : 'ageGroups';
        return (
          <div key={id} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {item.options?.map(opt => {
              const isChecked = filters[stateKey].includes(opt.value);
              return (
                <label key={opt.value} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: isChecked ? '#e6f2ff' : '#f0f0f0', padding: '6px 12px', borderRadius: '20px', border: isChecked ? '1px solid #007bff' : '1px solid transparent' }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleFilterArray(stateKey, opt.value)} style={{ display: 'none' }} />
                  {opt.label}
                </label>
              );
            })}
          </div>
        );
      default: return null;
    }
  };

  const currentData = selectedStation ? dummyData[selectedStation] : null;
  let totalVisitors = 0;
  let ageBreakdown = { adult: 0, student: 0, teen: 0, child: 0, privileged: 0 };

  if (currentData) {
    currentData.hourlyData.forEach(row => {
      if (row.hour >= filters.timePeriodStart && row.hour < filters.timePeriodEnd) {
        filters.dayType.forEach(day => {
          filters.ageGroups.forEach(age => {
            const count = row[day][age] || 0;
            totalVisitors += count;
            ageBreakdown[age] += count;
          });
        });
      }
    });
  }

  const getKoreanAge = (age) => ({ adult: '일반', student: '중고생', teen: '청소년', child: '아동', privileged: '우대권' }[age]);
  
  // 파이 차트용 데이터 배열 생성 (선택된 연령대만, 0명인 것 제외)
  const chartData = filters.ageGroups
    .map(age => ({ name: getKoreanAge(age), value: ageBreakdown[age] }))
    .filter(data => data.value > 0);

  // 연령대별 차트 색상 지정
  const COLORS = { '일반': '#0088FE', '중고생': '#00C49F', '청소년': '#FFBB28', '아동': '#FF8042', '우대권': '#A28DFF' };

  const renderMarker = (id, label, cx, cy) => {
    const isSelected = selectedStation === id;
    const isNone = selectedStation === null;
    const fill = isNone ? '#333' : (isSelected ? '#ff4d4f' : '#aaa');
    const radius = isNone ? '18' : (isSelected ? '24' : '15');
    const opacity = isNone ? '0.8' : (isSelected ? '1' : '0.5');

    return (
      <g key={id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedStation(id); }}>
        <circle cx={cx} cy={cy} r={radius} fill={fill} opacity={opacity} stroke="#fff" strokeWidth="2" style={{ transition: 'all 0.3s' }} />
        <text x={cx} y={cy} dy="40" textAnchor="middle" fill={isNone || isSelected ? '#fff' : '#666'} style={{ fontWeight: 'bold', fontSize: '15px', textShadow: isNone || isSelected ? 'none' : '1px 1px 2px #fff' }}>{label}</text>
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, fontFamily: 'sans-serif' }}>
      
      <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #ddd', minWidth: '280px', backgroundColor: '#fff', overflowY: 'auto' }}>
        {renderUI('options-column')}
      </div>

      <div style={{ flex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 20, backgroundColor: '#fff', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontWeight: 'bold', zIndex: 10 }}>
          {selectedStation ? `📍 ${currentData.name}` : '지도에서 역을 선택해주세요'}
        </div>
        
        <div style={{ position: 'relative', width: '90%', height: '90%' }}>
          <img src="https://www.jiraksil.com/files/service_meta/quiz_20240402_660bcf51735f7.jpg" alt="Map" onClick={() => setSelectedStation(null)} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', cursor: 'default' }} />
          
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {renderMarker('stationA', '강남역', '60%', '65%')}
            {renderMarker('stationB', '홍대입구역', '35%', '45%')}
            {renderMarker('stationC', '잠실역', '75%', '60%')}
            {renderMarker('stationD', '성수역', '60%', '45%')}
            {renderMarker('stationE', '이태원역', '50%', '55%')}
          </svg>
        </div>
      </div>

      <div style={{ flex: 2, padding: '30px', borderLeft: '1px solid #ddd', minWidth: '360px', backgroundColor: '#fff', overflowY: 'auto' }}>
        {!selectedStation ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📍</div>
            <h3 style={{ margin: 0 }}>역을 선택해주세요</h3>
          </div>
        ) : (
          <>
            <h2 style={{ borderBottom: '3px solid #333', paddingBottom: '15px', marginTop: 0 }}>{currentData.name}</h2>
            
            <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>조건 반영 합산 방문객</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '36px', fontWeight: 'bold', color: '#007bff' }}>
                {totalVisitors.toLocaleString()} <span style={{ fontSize: '18px', color: '#333' }}>명</span>
              </p>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#444' }}>유사 패턴 역</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentData.similar.map(simId => (
                  <span key={simId} style={{ padding: '6px 10px', backgroundColor: '#e9ecef', borderRadius: '6px', fontSize: '13px', color: '#333', cursor: 'pointer' }} onClick={() => setSelectedStation(simId)}>
                    {dummyData[simId].name}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '30px', height: '300px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '5px', color: '#444' }}>연령대 구성비 (선택 시간대 기준)</h3>
              {chartData.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>데이터가 없습니다.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toLocaleString()}명`, '방문객']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

export default App;
