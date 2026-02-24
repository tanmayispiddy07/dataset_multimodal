import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemeViewer from './components/MemeViewer';
import AnnotationForm from './components/AnnotationForm';
import UsernameForm from './components/UsernameForm';
import './index.css';

const API_BASE = 'http://127.0.0.1:8000';

function App() {
  const [username, setUsername] = useState(null);
  const [batchId, setBatchId] = useState(1);
  const [memeIndex, setMemeIndex] = useState(0);
  const [currentMeme, setCurrentMeme] = useState(null);
  const [totalInBatch, setTotalInBatch] = useState(null); // from meme response
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restoringProgress, setRestoringProgress] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [previousResponse, setPreviousResponse] = useState(null);

  // ─── Restore progress when username or batch changes ──────────
  useEffect(() => {
    if (!username) return;

    const restoreProgress = async () => {
      setRestoringProgress(true);
      setIsBatchComplete(false);
      setTotalInBatch(null);
      try {
        const res = await axios.get(`${API_BASE}/api/progress`, {
          params: { user_id: username, batch_id: batchId }
        });
        const answered = res.data.answered_count;
        setMemeIndex(answered);
        setSubmitCount(answered);
      } catch (err) {
        console.error("Could not fetch progress:", err);
        setMemeIndex(0);
        setSubmitCount(0);
      } finally {
        setRestoringProgress(false);
      }
    };

    restoreProgress();
  }, [username, batchId]);

  // ─── Fetch the meme for current index ─────────────────────────
  useEffect(() => {
    if (!username || restoringProgress) return;
    fetchMeme();
  }, [memeIndex, restoringProgress]);

  // ─── Fetch previous response when meme changes ────────────────
  useEffect(() => {
    if (!currentMeme || !username) {
      setPreviousResponse(null);
      return;
    }
    axios.get(`${API_BASE}/api/response`, {
      params: { user_id: username, image_name: currentMeme.image_name }
    })
      .then(res => setPreviousResponse(res.data))
      .catch(() => setPreviousResponse(null));
  }, [currentMeme, username]);

  const fetchMeme = async () => {
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
      // Grab total_in_batch from the response so we can show % progress
      if (response.data.total_in_batch) {
        setTotalInBatch(response.data.total_in_batch);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setIsBatchComplete(true);
      } else {
        setError("Failed to load meme. Please check your connection.");
      }
      setCurrentMeme(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit on Next click ──────────────────────────────────────
  const handleSubmit = async (formData) => {
    if (!currentMeme || !username) return;

    const responseData = {
      ...formData,
      confidence: parseFloat(formData.confidence1 ?? formData.confidence ?? 0.5),
      image_name: currentMeme.image_name,
      batch_id: batchId,
      user_id: username,
      session_id: sessionId
    };

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/submit`, responseData);
      setSubmitCount(prev => prev + 1);
    } catch (err) {
      console.error("Error saving response:", err);
      if (err.response && err.response.status === 409) {
        setSubmitting(false);
        setMemeIndex(prev => prev + 1);
        return;
      }
      alert("Failed to save response. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setMemeIndex(prev => prev + 1);
  };

  const handleBack = () => setMemeIndex(prev => Math.max(0, prev - 1));
  const handleUsernameSubmit = (enteredUsername) => setUsername(enteredUsername);
  const handleBatchChange = (newBatchId) => setBatchId(newBatchId);
  const handleRestart = () => window.location.reload();

  // ─── Progress Calculation ──────────────────────────────────────
  // Use memeIndex + 1 (current position) so the bar stays in sync
  // with the "Meme #N of M" counter shown above it.
  const progressPct = totalInBatch
    ? Math.min(100, Math.round(((memeIndex + 1) / totalInBatch) * 100))
    : null;

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <h1>Meme Ground Truth Collection</h1>

          {username && (
            <div className="controls">
              <span className="username-badge">👤 {username}</span>
              <div className="batch-selector">
                <span>Batch:</span>
                <select value={batchId} onChange={(e) => handleBatchChange(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>Batch {n}</option>
                  ))}
                </select>
              </div>
              <span className="meme-counter">
                📷 Meme #{memeIndex + 1}{totalInBatch ? ` of ${totalInBatch}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {username && !isBatchComplete && (
          <div className="progress-wrapper">
            <div className="progress-meta">
              <span>Meme {memeIndex + 1}{totalInBatch ? ` of ${totalInBatch}` : ''}</span>
              {progressPct !== null && (
                <span className="progress-pct">{progressPct}%</span>
              )}
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: progressPct !== null ? `${progressPct}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Step 1: Username */}
        {!username ? (
          <UsernameForm onSubmit={handleUsernameSubmit} isStart={true} />
        ) : restoringProgress ? (
          <div className="state-message">
            ⏳ Restoring your progress for Batch {batchId}...
          </div>
        ) : isBatchComplete ? (
          <div className="batch-complete-container">
            <h2>🎉 Batch Complete!</h2>
            <p>
              You submitted <strong>{submitCount}</strong> responses
              {totalInBatch ? ` out of ${totalInBatch}` : ''} as <strong>{username}</strong>.
            </p>
            <button className="btn-primary" onClick={handleRestart}>
              Start a New Session
            </button>
          </div>
        ) : (
          <>
            {loading && <div className="state-message">⏳ Loading meme...</div>}
            {submitting && <div className="state-message">💾 Saving response...</div>}
            {error && <p className="error">{error}</p>}
            {currentMeme && !loading && !submitting && (
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
