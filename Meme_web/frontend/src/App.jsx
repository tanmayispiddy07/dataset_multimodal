import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemeViewer from './components/MemeViewer';
import AnnotationForm from './components/AnnotationForm';
import UsernameForm from './components/UsernameForm';
import './index.css';

const API_BASE = 'https://dataset-multimodal.onrender.com';

function App() {
  const [username, setUsername] = useState(null);
  const [batchId, setBatchId] = useState(1);
  const [memeIndex, setMemeIndex] = useState(0);
  const [currentMeme, setCurrentMeme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restoringProgress, setRestoringProgress] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [previousResponse, setPreviousResponse] = useState(null); // pre-fill form

  // ─── Restore progress when username or batch changes ───────────────────────
  useEffect(() => {
    if (!username) return;

    const restoreProgress = async () => {
      setRestoringProgress(true);
      setIsBatchComplete(false);
      try {
        const res = await axios.get(`${API_BASE}/api/progress`, {
          params: { user_id: username, batch_id: batchId }
        });
        const answered = res.data.answered_count;
        setMemeIndex(answered);  // resume from where they left off
        setSubmitCount(answered); // initialize count to already-answered so batch-complete shows correct total
      } catch (err) {
        console.error("Could not fetch progress:", err);
        // Network/server error — start from scratch for this session
        setMemeIndex(0);
        setSubmitCount(0);
      } finally {
        setRestoringProgress(false);
      }
    };

    restoreProgress();
  }, [username, batchId]);

  // ─── Fetch the meme for current index ──────────────────────────────────────
  useEffect(() => {
    if (!username || restoringProgress) return;
    fetchMeme();
  }, [memeIndex, restoringProgress]);

  // ─── Fetch previous response when meme changes ──────────────────────────────
  useEffect(() => {
    if (!currentMeme || !username) {
      setPreviousResponse(null);
      return;
    }
    axios.get(`${API_BASE}/api/response`, {
      params: { user_id: username, image_name: currentMeme.image_name }
    })
      .then(res => setPreviousResponse(res.data))
      .catch(() => setPreviousResponse(null)); // 404 = no prior answer, that's fine
  }, [currentMeme, username]);

  const fetchMeme = async () => {
    // Test Mode Logic
    if (window.location.pathname === '/test' && memeIndex >= 5) {
      setIsBatchComplete(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/meme`, {
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

  // ─── Submit immediately to DB on Next click ─────────────────────────────────
  const handleSubmit = async (formData) => {
    if (!currentMeme || !username) return;

    const responseData = {
      ...formData,
      confidence: parseFloat(formData.confidence),
      image_name: currentMeme.image_name,
      batch_id: batchId,
      user_id: username,
      session_id: sessionId
    };

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/submit`, responseData);
      // Only increment submitCount for NEW submissions in this session
      // (restored ones are already counted via setSubmitCount(answered) on restore)
      setSubmitCount(prev => prev + 1);
    } catch (err) {
      console.error("Error saving response:", err);
      // Check if it's a duplicate (409) — still advance but don't double-count
      if (err.response && err.response.status === 409) {
        setSubmitting(false);
        setMemeIndex(prev => prev + 1);
        return;
      }
      alert("Failed to save response. Please try again.");
      setSubmitting(false);
      return; // Don't advance if save failed
    }
    setSubmitting(false);
    setMemeIndex(prev => prev + 1);
  };

  const handleBack = () => {
    setMemeIndex(prev => Math.max(0, prev - 1));
  };

  const handleUsernameSubmit = (enteredUsername) => {
    setUsername(enteredUsername);
  };

  const handleBatchChange = (newBatchId) => {
    setBatchId(newBatchId);
    // progress restore is triggered by the useEffect above
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="app-container">
      <header>
        <h1>Meme Ground Truth Collection</h1>
        {username && (
          <div className="controls">
            <span className="username-badge">👤 {username}</span>
            <label>
              Batch:
              <select value={batchId} onChange={(e) => handleBatchChange(Number(e.target.value))}>
                <option value={1}>Batch 1</option>
                <option value={2}>Batch 2</option>
                <option value={3}>Batch 3</option>
                <option value={4}>Batch 4</option>
                <option value={5}>Batch 5</option>
                <option value={6}>Batch 6</option>
                <option value={7}>Batch 7</option>
                <option value={8}>Batch 8</option>
              </select>
            </label>
            <span>Index: {memeIndex}</span>
          </div>
        )}
      </header>

      <main>
        {/* Step 1: Ask for username */}
        {!username ? (
          <UsernameForm onSubmit={handleUsernameSubmit} isStart={true} />
        ) : restoringProgress ? (
          <p className="restoring-msg">⏳ Restoring your progress for Batch {batchId}...</p>
        ) : isBatchComplete ? (
          /* Batch done */
          <div className="batch-complete-container">
            <h2>🎉 Batch Complete!</h2>
            <p>You submitted <strong>{submitCount}</strong> responses as <strong>{username}</strong>.</p>
            <button className="btn-primary" onClick={handleRestart}>Start a New Session</button>
          </div>
        ) : (
          /* Annotate memes */
          <>
            {loading && <p>Loading...</p>}
            {submitting && <p>Saving response...</p>}
            {error && <p className="error">{error}</p>}
            {currentMeme && !submitting && (
              <div className="content-wrapper">
                <MemeViewer meme={currentMeme} />
                <AnnotationForm
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isFirst={memeIndex === 0}
                  key={currentMeme.image_name}
                  initialData={previousResponse}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
