import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
    target: '',
    target_specified: '',
    justification: '',
    stance: '',
    confidence: 0.5,
    ocr_correct: 'yes',   // 'yes' | 'no'
    corrected_text: '',
};

const AnnotationForm = ({ onSubmit, onBack, isFirst, initialData }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...EMPTY_FORM, ...initialData });
        } else {
            setFormData(EMPTY_FORM);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Don't send corrected_text if the user said OCR is correct
        const payload = { ...formData };
        if (payload.ocr_correct === 'yes') {
            payload.corrected_text = '';
        }
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="annotation-form">

            {/* ── OCR Verification ─────────────────────────────── */}
            <div className="form-group">
                <label>Is the extracted text above correct?</label>
                <div className="ocr-toggle">
                    <label className={`ocr-option ${formData.ocr_correct === 'yes' ? 'ocr-selected-yes' : ''}`}>
                        <input
                            type="radio"
                            name="ocr_correct"
                            value="yes"
                            checked={formData.ocr_correct === 'yes'}
                            onChange={handleChange}
                        />
                        Yes, it's correct
                    </label>
                    <label className={`ocr-option ${formData.ocr_correct === 'no' ? 'ocr-selected-no' : ''}`}>
                        <input
                            type="radio"
                            name="ocr_correct"
                            value="no"
                            checked={formData.ocr_correct === 'no'}
                            onChange={handleChange}
                        />
                        No, it's wrong
                    </label>
                </div>
            </div>

            {/* ── Corrected text — shown only when OCR is wrong ── */}
            {formData.ocr_correct === 'no' && (
                <div className="form-group">
                    <label>Enter the correct text from the meme</label>
                    <textarea
                        name="corrected_text"
                        value={formData.corrected_text}
                        onChange={handleChange}
                        required
                        placeholder="Type the actual text visible in the meme..."
                        rows={3}
                    />
                </div>
            )}

            {/* ── Existing fields ───────────────────────────────── */}
            <div className="form-group">
                <label>Target</label>
                <input
                    type="text"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Individual, Group"
                />
            </div>

            <div className="form-group">
                <label>Target Specified</label>
                <input
                    type="text"
                    name="target_specified"
                    value={formData.target_specified}
                    onChange={handleChange}
                    placeholder="e.g., Politicians, Celebrities"
                />
            </div>

            <div className="form-group">
                <label>Justification</label>
                <textarea
                    name="justification"
                    value={formData.justification}
                    onChange={handleChange}
                    required
                    placeholder="Why do you think so?"
                />
            </div>

            <div className="form-group">
                <label>Stance</label>
                <select name="stance" value={formData.stance} onChange={handleChange} required>
                    <option value="">Select Stance</option>
                    <option value="support">Support</option>
                    <option value="against">Against</option>
                    <option value="neutral">Neutral</option>
                </select>
            </div>

            <div className="form-group">
                <label>Confidence (0.0 - 1.0)</label>
                <input
                    type="number"
                    name="confidence"
                    value={formData.confidence}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="1"
                    required
                />
            </div>

            <div className="button-group">
                <button type="button" className="btn-secondary" onClick={onBack} disabled={isFirst}>Back</button>
                <button type="submit" className="btn-primary">Next</button>
            </div>
        </form>
    );
};

export default AnnotationForm;
