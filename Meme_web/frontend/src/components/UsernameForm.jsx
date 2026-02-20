import React, { useState } from 'react';

const UsernameForm = ({ onSubmit, isStart = false }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onSubmit(username.trim());
        }
    };

    return (
        <div className="username-form-container">
            {isStart ? (
                <>
                    <h2>Welcome!</h2>
                    <p>Please enter your username to begin annotating memes.</p>
                </>
            ) : (
                <>
                    <h2>Batch Completed!</h2>
                    <p>Please enter your username to finalize your submissions.</p>
                </>
            )}
            <form onSubmit={handleSubmit} className="username-form">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="username-input"
                    autoFocus
                />
                <button type="submit" className="btn-primary">
                    {isStart ? 'Start Annotating' : 'Finish'}
                </button>
            </form>
        </div>
    );
};

export default UsernameForm;
