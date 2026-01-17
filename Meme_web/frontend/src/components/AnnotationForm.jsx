import React, { useState, useEffect } from 'react';

const AnnotationForm = ({ onSubmit, onBack, isFirst, initialData }) => {
    const [formData, setFormData] = useState({
        target: '',
        target_specified: '',
        justification: '',
        stance: '',
        confidence: 0.5,
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                target: '',
                target_specified: '',
                justification: '',
                stance: '',
                confidence: 0.5,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="annotation-form">
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
