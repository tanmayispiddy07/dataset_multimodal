import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemeViewer from './components/MemeViewer';
import AnnotationForm from './components/AnnotationForm';
import UsernameForm from './components/UsernameForm';
import './index.css';

function App() {
  const [batchId, setBatchId] = useState(1);
  const [memeIndex, setMemeIndex] = useState(0);
  const [currentMeme, setCurrentMeme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [collectedResponses, setCollectedResponses] = useState([]);

  const fetchMeme = async () => {
    // Test Mode Logic
    if (window.location.pathname === '/test' && memeIndex >= 5) {
      setIsBatchComplete(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/meme`, {
        params: { batch_id: batchId, index: memeIndex }
      });
      setCurrentMeme(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setIsBatchComplete(true);
      } else {
        setError("Failed to load meme.");
      }
      setCurrentMeme(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeme();
  }, [batchId, memeIndex]);

  const handleSubmit = (formData) => {
    if (!currentMeme) return;

    const responseData = {
      ...formData,
      confidence: parseFloat(formData.confidence),
      image_name: currentMeme.image_name,
      batch_id: batchId,
      user_id: "anonymous",
      session_id: sessionId
    };

    setCollectedResponses(prev => [...prev, responseData]);
    setMemeIndex(prev => prev + 1);
  };

  const handleSkip = () => {
    setMemeIndex(prev => prev + 1);
  };

  const handleUsernameSubmit = async (username) => {
    try {
      // Update all responses with the username
      if (collectedResponses.length === 0) {
        alert("No responses collected. Did you skip all images?");
        return;
      }

      const finalResponses = collectedResponses.map(response => ({
        ...response,
        user_id: username
      }));

      await axios.post('http://localhost:8000/api/submit_batch', finalResponses);

      alert("Thank you! All your responses have been submitted.");
      // Reset or redirect logic here if needed
      window.location.reload();
    } catch (err) {
      console.error("Error submitting batch:", err);
      alert("Failed to save responses. Please try again.");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Meme Ground Truth Collection</h1>
        <div className="controls">
          <label>
            Batch:
            <select value={batchId} onChange={(e) => {
              setBatchId(Number(e.target.value));
              setMemeIndex(0);
            }}>
              <option value={1}>Batch 1</option>
              <option value={2}>Batch 2</option>
              <option value={3}>Batch 3</option>
              <option value={4}>Batch 4</option>
            </select>
          </label>
          <span>Index: {memeIndex}</span>
        </div>
      </header>

      <main>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {isBatchComplete ? (
          <UsernameForm onSubmit={handleUsernameSubmit} />
        ) : (
          currentMeme && (
            <div className="content-wrapper">
              <MemeViewer meme={currentMeme} />
              <AnnotationForm
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                key={currentMeme.image_name}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
