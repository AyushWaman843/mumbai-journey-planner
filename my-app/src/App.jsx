import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Autosuggest from 'react-autosuggest';
import './App.css';
import MapView from './MapView';

function Home({
  stations, setStations,
  routeType, setRouteType,
  error, setError,
  loading, setLoading,
  routeResult, setRouteResult,
  allRoutes, setAllRoutes
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/stations')
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(err => console.error('Failed to load stations:', err));
  }, [setStations]);

  function getSuggestions(value) {
    const input = value.trim().toLowerCase();
    return input.length === 0
      ? []
      : stations.filter(station =>
          station.toLowerCase().includes(input)
        ).slice(0, 8);
  }

  // Autosuggest handlers for FROM
  const onFromChange = (e, { newValue }) => setFrom(newValue);
  const onFromSuggestionsFetchRequested = ({ value }) => setFromSuggestions(getSuggestions(value));
  const onFromSuggestionsClearRequested = () => setFromSuggestions([]);
  // Autosuggest handlers for TO
  const onToChange = (e, { newValue }) => setTo(newValue);
  const onToSuggestionsFetchRequested = ({ value }) => setToSuggestions(getSuggestions(value));
  const onToSuggestionsClearRequested = () => setToSuggestions([]);

  function handleFindRoute() {
    if (!from || !to) {
      setError('Please enter both stations!');
      setRouteResult(null);
      return;
    }
    setError('');
    setRouteResult(null);
    setAllRoutes(null);
    setLoading(true);

    fetch('http://127.0.0.1:5000/api/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, routeType })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setRouteResult(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Could not connect to server. Please make sure backend is running on port 5000.');
        setLoading(false);
      });

    fetch('http://127.0.0.1:5000/api/journey/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setAllRoutes(data);
        }
      })
      .catch(err => console.error('Failed to load alternatives:', err));
  }

  function swapStations() {
    const temp = from;
    setFrom(to);
    setTo(temp);
  }

  return (
    <div className="mumbai-card">
      {/* Train Image */}
      <img
        src="src/assets/train.png"
        alt="Mumbai Local Train"
        className="mumbai-train-img"
      />
      {/* Header */}
      <div className="mumbai-title">Mumbai Journey Planner</div>
      <div className="mumbai-desc">
        Find the best route across Mumbai Local & Metro
      </div>
      {/* Input Section */}
      <div className="mumbai-input-row">
        <Autosuggest
          suggestions={fromSuggestions}
          onSuggestionsFetchRequested={onFromSuggestionsFetchRequested}
          onSuggestionsClearRequested={onFromSuggestionsClearRequested}
          getSuggestionValue={suggestion => suggestion}
          renderSuggestion={suggestion => <span>{suggestion}</span>}
          inputProps={{
            placeholder: 'From station',
            value: from,
            onChange: onFromChange
          }}
        />
        <div style={{ textAlign: 'center', margin: '-8px 0' }}>
          <button
            onClick={swapStations}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              color: '#3b82f6'
            }}
            title="Swap stations"
          >
            ⇅
          </button>
        </div>
        <Autosuggest
          suggestions={toSuggestions}
          onSuggestionsFetchRequested={onToSuggestionsFetchRequested}
          onSuggestionsClearRequested={onToSuggestionsClearRequested}
          getSuggestionValue={suggestion => suggestion}
          renderSuggestion={suggestion => <span>{suggestion}</span>}
          inputProps={{
            placeholder: 'To station',
            value: to,
            onChange: onToChange
          }}
        />
      </div>
      {/* Route Type Selection */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { value: 'fastest', label: '⚡ Fastest', color: '#3b82f6' },
          { value: 'cheapest', label: '💰 Cheapest', color: '#10b981' },
          { value: 'comfortable', label: '🪑 Comfort', color: '#8b5cf6' }
        ].map(option => (
          <label
            key={option.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: routeType === option.value ? option.color : '#f1f5f9',
              color: routeType === option.value ? 'white' : '#475569',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              border: '2px solid transparent'
            }}
          >
            <input
              type="radio"
              name="routeType"
              value={option.value}
              checked={routeType === option.value}
              onChange={e => setRouteType(e.target.value)}
              style={{ display: 'none' }}
            />
            {option.label}
          </label>
        ))}
      </div>
      <button
        className="mumbai-btn"
        onClick={handleFindRoute}
        disabled={loading}
        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? '🔍 Finding Best Route...' : '🚀 Find Route'}
      </button>
      {error && (
        <div className="mumbai-error">
          ⚠️ {error}
        </div>
      )}
      {routeResult && (
        <div className="mumbai-route-result">
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>⏱️ Time</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0ea5e9' }}>
                {routeResult.time}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>💰 Cost</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                {routeResult.cost}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>📍 Distance</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                {routeResult.distance}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>🔄 Changes</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                {routeResult.transfers}
              </div>
            </div>
          </div>
          {/* Detailed Instructions */}
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#1e293b',
            border: '1px solid #bfdbfe'
          }}>
            {routeResult.route.map((line, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: line === '' ? '8px' : '4px',
                  fontWeight: line.startsWith('🚆') || line.startsWith('⏱️') || line.startsWith('💰') ? '600' : '400',
                  color: line.startsWith('🔄') ? '#6366f1' : '#1e293b'
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <button
            className="mumbai-btn"
            style={{ marginTop: '16px', width: '100%' }}
            onClick={() => navigate('/map')}
          >
            View Map
          </button>
        </div>
      )}
      {allRoutes && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            📊 Compare All Routes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(allRoutes).map(([type, data]) => (
              <div
                key={type}
                onClick={() => {
                  setRouteType(type);
                  handleFindRoute();
                }}
                style={{
                  padding: '14px',
                  background: routeType === type ? '#dbeafe' : '#f8fafc',
                  border: routeType === type ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', textTransform: 'capitalize', color: '#1e40af' }}>
                    {type === 'fastest' ? '⚡ Fastest' : type === 'cheapest' ? '💰 Cheapest' : '🪑 Comfortable'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                    {data.time} min
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#64748b'
                }}>
                  <span>₹{data.cost}</span>
                  <span>•</span>
                  <span>{data.distance} km</span>
                  <span>•</span>
                  <span>{data.transfers} changes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        Covers {stations.length}+ stations • Local Trains + Metro
      </div>
    </div>
  );
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [routeType, setRouteType] = useState('fastest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [allRoutes, setAllRoutes] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              stations={stations}
              setStations={setStations}
              routeType={routeType}
              setRouteType={setRouteType}
              error={error}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
              routeResult={routeResult}
              setRouteResult={setRouteResult}
              allRoutes={allRoutes}
              setAllRoutes={setAllRoutes}
            />
          }
        />
        <Route
          path="/map"
          element={
            <MapView
              stations={stations}
              allRoutes={allRoutes}
              routeResult={routeResult}
              onClose={() => window.history.back()}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
