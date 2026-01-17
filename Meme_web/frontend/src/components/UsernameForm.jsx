import React, { useState } from 'react';

const UsernameForm = ({ onSubmit }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onSubmit(username);
        }
    };

    return (
        <div className="username-form-container">
            <h2>Batch Completed!</h2>
            <p>Please enter your username to finalize your submissions.</p>
            <form onSubmit={handleSubmit} className="username-form">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="username-input"
                />
                <button type="submit" className="btn-primary">Finish</button>
            </form>
        </div>
    );
};

export default UsernameForm;
