import React from 'react';

const MemeViewer = ({ meme }) => {
  if (!meme) return <div>Loading meme...</div>;

  return (
    <div className="meme-viewer">
      <div className="image-container">
        <img
          src={`https://dataset-multimodal.onrender.com/api/image/${meme.image_name}`}
          alt="Meme"
          className="meme-image"
        />
      </div>
      <div className="text-container">
        <h3>Text in Image</h3>
        <p className="ocr-text">{meme.ocr_text}</p>

        {meme.metadata && meme.metadata.category && (
          <div className="metadata-container">
            <h3>Category</h3>
            <p>{meme.metadata.category}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeViewer;
