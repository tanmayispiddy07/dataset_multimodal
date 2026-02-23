import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
    target1: '',
    target2: '',
    justification: '',
    stance1: '',
    confidence1: 0.5,
    stance2: '',
    confidence2: 0.5,
    ocr_correct: 'yes',   // 'yes' | 'no'
    corrected_text: '',
    domain: '',
    custom_domain: '',
};

const DOMAIN_OPTIONS = [
    'Politics',
    'Education',
    'Sports',
    'Entertainment',
    'Tollywood',
    'Religion',
    'Social Issues',
    'Economy',
    'Technology',
    'Healthcare'
];

const AnnotationForm = ({ onSubmit, onBack, isFirst, initialData }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [showCustomDomain, setShowCustomDomain] = useState(false);

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

        // Handle domain dropdown change
        if (name === 'domain') {
            if (value === 'None') {
                setShowCustomDomain(true);
                setFormData(prev => ({ ...prev, domain: '', custom_domain: '' }));
            } else {
                setShowCustomDomain(false);
                setFormData(prev => ({ ...prev, custom_domain: '' }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Don't send corrected_text if the user said OCR is correct
        const payload = { ...formData };
        if (payload.ocr_correct === 'yes') {
            payload.corrected_text = '';
        }

        // If custom domain is selected, use custom_domain as domain
        if (showCustomDomain && payload.custom_domain) {
            payload.domain = payload.custom_domain;
            delete payload.custom_domain;
        } else if (showCustomDomain) {
            alert('Please enter a custom domain');
            return;
        } else {
            delete payload.custom_domain;
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

            {/* ── Target 1 ───────────────────────────────────────── */}
            <div className="form-group">
                <label>Target 1</label>
                <input
                    type="text"
                    name="target1"
                    value={formData.target1}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Individual, Group"
                />
            </div>

            {/* ── Target 2 ───────────────────────────────────────── */}
            <div className="form-group">
                <label>Target 2</label>
                <input
                    type="text"
                    name="target2"
                    value={formData.target2}
                    onChange={handleChange}
                    placeholder="e.g., Politicians, Celebrities"
                />
            </div>

            {/* ── Justification ─────────────────────────────────── */}
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

            {/* ── Stance 1 ──────────────────────────────────────── */}
            <div className="form-group">
                <label>Stance 1</label>
                <select name="stance1" value={formData.stance1} onChange={handleChange} required>
                    <option value="">Select Stance 1</option>
                    <option value="support">Support</option>
                    <option value="against">Against</option>
                    <option value="neutral">Neutral</option>
                </select>
            </div>

            {/* ── Confidence 1 ──────────────────────────────────── */}
            <div className="form-group">
                <label>Confidence 1 (0.0 - 1.0)</label>
                <input
                    type="number"
                    name="confidence1"
                    value={formData.confidence1}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="1"
                    required
                />
            </div>

            {/* ── Stance 2 ──────────────────────────────────────── */}
            <div className="form-group">
                <label>Stance 2</label>
                <select name="stance2" value={formData.stance2} onChange={handleChange} required>
                    <option value="">Select Stance 2</option>
                    <option value="support">Support</option>
                    <option value="against">Against</option>
                    <option value="neutral">Neutral</option>
                </select>
            </div>

            {/* ── Confidence 2 ──────────────────────────────────── */}
            <div className="form-group">
                <label>Confidence 2 (0.0 - 1.0)</label>
                <input
                    type="number"
                    name="confidence2"
                    value={formData.confidence2}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="1"
                    required
                />
            </div>

            {/* ── Domain ────────────────────────────────────────── */}
            <div className="form-group">
                <label>Domain</label>
                <select name="domain" value={formData.domain} onChange={handleChange} required={!showCustomDomain}>
                    <option value="">Select Domain</option>
                    <option value="None">None</option>
                    {DOMAIN_OPTIONS.map(domain => (
                        <option key={domain} value={domain}>{domain}</option>
                    ))}
                </select>
            </div>

            {/* ── Custom Domain Input — shown only when "None" is selected ── */}
            {showCustomDomain && (
                <div className="form-group">
                    <label>Enter Custom Domain</label>
                    <input
                        type="text"
                        name="custom_domain"
                        value={formData.custom_domain}
                        onChange={handleChange}
                        placeholder="Enter domain name..."
                        required
                    />
                </div>
            )}

            <div className="button-group">
                <button type="button" className="btn-secondary" onClick={onBack} disabled={isFirst}>Back</button>
                <button type="submit" className="btn-primary">Next</button>
            </div>
        </form>
    );
};

export default AnnotationForm;
