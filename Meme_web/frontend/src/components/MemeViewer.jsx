import React from 'react';

const API_BASE = 'http://127.0.0.1:8000';

const MemeViewer = ({ meme }) => {
  if (!meme) return (
    <div className="meme-viewer">
      <div className="meme-viewer-card">
        <div className="image-container" style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>⏳ Loading meme...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="meme-viewer">
      <div className="meme-viewer-card">
        <div className="image-container">
          <img
            src={`${API_BASE}/api/image/${meme.image_name}`}
            alt="Meme"
            className="meme-image"
          />
        </div>

        <div className="meme-info">
          {meme.metadata && meme.metadata.category && (
            <>
              <div className="meme-info-label">Category</div>
              <span className="category-badge">🗂 {meme.metadata.category}</span>
            </>
          )}

          <div className="meme-info-label" style={{ marginTop: 14 }}>Extracted Text (OCR)</div>
          <p className="ocr-text">
            {meme.ocr_text || 'No text detected in this meme.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemeViewer;
