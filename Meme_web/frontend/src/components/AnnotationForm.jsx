import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
    target1: '',
    target2: '',
    justification: '',
    stance1: '',
    confidence1: 0.5,
    stance2: '',
    confidence2: 0.5,
    ocr_correct: 'yes',
    corrected_text: '',
    domain: '',
    custom_domain: '',
};

const DOMAIN_OPTIONS = [
    'Politics', 'Education', 'Sports', 'Entertainment', 'Movies',
    'Religion', 'Social Issues', 'Economy', 'Technology', 'Healthcare'
];

const STANCES = [
    { value: 'support', label: '👍 Support' },
    { value: 'against', label: '👎 Against' },
    { value: 'neutral', label: '😐 Neutral' },
];

const getConfidenceMeta = (val) => {
    const pct = Math.round(val * 100);
    if (pct < 35) return { text: `${pct}% — Low`, color: '#ef4444' };
    if (pct < 65) return { text: `${pct}% — Medium`, color: '#f59e0b' };
    return { text: `${pct}% — High`, color: '#22c55e' };
};

const AnnotationForm = ({ onSubmit, onBack, isFirst, initialData }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [showCustomDomain, setShowCustomDomain] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...EMPTY_FORM, ...initialData });
            // Detect if saved domain is a custom one
            if (initialData.domain && !DOMAIN_OPTIONS.includes(initialData.domain)) {
                setShowCustomDomain(true);
                setFormData(prev => ({ ...prev, custom_domain: initialData.domain, domain: '' }));
            }
        } else {
            setFormData(EMPTY_FORM);
            setShowCustomDomain(false);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'domain') {
            if (value === 'None') {
                setShowCustomDomain(true);
                setFormData(prev => ({ ...prev, domain: '', custom_domain: '' }));
            } else {
                setShowCustomDomain(false);
                setFormData(prev => ({ ...prev, domain: value, custom_domain: '' }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleStanceClick = (stanceKey, value) => {
        setFormData(prev => ({ ...prev, [stanceKey]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.stance1) {
            alert('Please select Stance 1.');
            return;
        }

        const payload = { ...formData };

        if (payload.ocr_correct === 'yes') {
            payload.corrected_text = '';
        }

        if (showCustomDomain && payload.custom_domain) {
            payload.domain = payload.custom_domain;
            delete payload.custom_domain;
        } else if (showCustomDomain) {
            alert('Please enter a custom domain.');
            return;
        } else {
            delete payload.custom_domain;
        }

        onSubmit(payload);
    };

    const c1Meta = getConfidenceMeta(formData.confidence1);
    const c2Meta = getConfidenceMeta(formData.confidence2);

    return (
        <form onSubmit={handleSubmit} className="annotation-form">

            {/* ── Domain (TOP) ─────────────────────────────────── */}
            <div className="form-section">
                <div className="section-header">
                    <span className="section-icon">🏷️</span>
                    <h3>Domain</h3>
                </div>
                <div className="form-group">
                    <label>Meme Domain</label>
                    <select
                        name="domain"
                        value={showCustomDomain ? 'None' : formData.domain}
                        onChange={handleChange}
                        required={!showCustomDomain}
                        className="domain-select"
                    >
                        <option value="">Select Domain</option>
                        <option value="None">Other (specify below)</option>
                        {DOMAIN_OPTIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    {showCustomDomain && (
                        <input
                            type="text"
                            name="custom_domain"
                            value={formData.custom_domain}
                            onChange={handleChange}
                            placeholder="Enter custom domain name..."
                            required
                            className="custom-domain-input"
                        />
                    )}
                </div>
            </div>

            {/* ── OCR Verification ─────────────────────────────── */}
            <div className="form-section">
                <div className="section-header">
                    <span className="section-icon">🔍</span>
                    <h3>OCR Verification</h3>
                </div>
                <div className="form-group">
                    <label>Is the extracted text correct?</label>
                    <div className="ocr-toggle">
                        <label className={`ocr-option ${formData.ocr_correct === 'yes' ? 'ocr-selected-yes' : ''}`}>
                            <input type="radio" name="ocr_correct" value="yes"
                                checked={formData.ocr_correct === 'yes'} onChange={handleChange} />
                            ✅ Yes, it's correct
                        </label>
                        <label className={`ocr-option ${formData.ocr_correct === 'no' ? 'ocr-selected-no' : ''}`}>
                            <input type="radio" name="ocr_correct" value="no"
                                checked={formData.ocr_correct === 'no'} onChange={handleChange} />
                            ❌ No, it's wrong
                        </label>
                    </div>
                </div>

                {formData.ocr_correct === 'no' && (
                    <div className="form-group">
                        <label>Correct text</label>
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
            </div>

            {/* ── Target Cards ─────────────────────────────────── */}
            <div className="targets-grid">

                {/* ── Target 1 Card ── */}
                <div className="target-card target-card-1">
                    <div className="target-card-header">
                        <span className="target-badge">1</span>
                        <h4>Primary Target</h4>
                    </div>

                    <div className="form-group">
                        <label>Target</label>
                        <input
                            type="text"
                            name="target1"
                            value={formData.target1}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Individual, Group"
                        />
                    </div>

                    <div className="form-group">
                        <label>Stance</label>
                        <div className="stance-pills">
                            {STANCES.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`stance-pill stance-${s.value} ${formData.stance1 === s.value ? 'active' : ''}`}
                                    onClick={() => handleStanceClick('stance1', s.value)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            Confidence
                            <span className="confidence-label" style={{ color: c1Meta.color }}>
                                {c1Meta.text}
                            </span>
                        </label>
                        <input
                            type="range"
                            name="confidence1"
                            value={formData.confidence1}
                            onChange={handleChange}
                            step="0.05"
                            min="0"
                            max="1"
                            className="confidence-slider"
                            style={{ '--thumb-color': c1Meta.color }}
                        />
                        <div className="slider-ticks">
                            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                    </div>
                </div>

                {/* ── Target 2 Card ── */}
                <div className="target-card target-card-2">
                    <div className="target-card-header">
                        <span className="target-badge">2</span>
                        <h4>Secondary Target <span className="optional-tag">optional</span></h4>
                    </div>

                    <div className="form-group">
                        <label>Target</label>
                        <input
                            type="text"
                            name="target2"
                            value={formData.target2}
                            onChange={handleChange}
                            placeholder="e.g., Politicians, Celebrities"
                        />
                    </div>

                    <div className="form-group">
                        <label>Stance</label>
                        <div className="stance-pills">
                            {STANCES.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`stance-pill stance-${s.value} ${formData.stance2 === s.value ? 'active' : ''}`}
                                    onClick={() => handleStanceClick('stance2', s.value)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            Confidence
                            <span className="confidence-label" style={{ color: c2Meta.color }}>
                                {c2Meta.text}
                            </span>
                        </label>
                        <input
                            type="range"
                            name="confidence2"
                            value={formData.confidence2}
                            onChange={handleChange}
                            step="0.05"
                            min="0"
                            max="1"
                            className="confidence-slider"
                            style={{ '--thumb-color': c2Meta.color }}
                        />
                        <div className="slider-ticks">
                            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Justification ────────────────────────────────── */}
            <div className="form-section">
                <div className="section-header">
                    <span className="section-icon">💬</span>
                    <h3>Justification</h3>
                </div>
                <div className="form-group">
                    <textarea
                        name="justification"
                        value={formData.justification}
                        onChange={handleChange}
                        required
                        placeholder="Why do you think so? Explain your annotation..."
                        rows={4}
                    />
                </div>
            </div>

            {/* ── Actions ──────────────────────────────────────── */}
            <div className="button-group">
                <button type="button" className="btn-secondary" onClick={onBack} disabled={isFirst}>
                    ← Back
                </button>
                <button type="submit" className="btn-primary">
                    Next →
                </button>
            </div>
        </form>
    );
};

export default AnnotationForm;
