import { useEffect, useRef, useState } from 'react';
import LoginRequiredModal from './LoginRequiredModal';
import '../styles/ChatBox.css';

const ChatBox = ({ messages, onSendMessage, isSpectator, currentUser }) => {
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentUser?.isGuest) {
            setShowLoginModal(true);
            return;
        }
        const message = inputRef.current.value.trim();
        if (message && !isSpectator) {
            onSendMessage(message);
            inputRef.current.value = '';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <i className="fa-solid fa-comments"></i>
                <h3>Chat</h3>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <i className="fa-solid fa-message"></i>
                        <p>No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        msg.type === 'system' ? (
                            <div key={index} className="chat-message system">
                                <span className="system-text">
                                    <i className="fa-solid fa-circle-info"></i> {msg.text}
                                </span>
                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                            </div>
                        ) : (
                            <div
                                key={index}
                                className={`chat-message ${msg.senderId === currentUser?.id || msg.senderId === currentUser?._id ? 'own' : 'other'}`}
                            >
                                <div className="message-content">
                                    <span className="message-sender">{msg.senderName}</span>
                                    <span className="message-text">{msg.text}</span>
                                </div>
                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                            </div>
                        )
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={isSpectator ? "Spectators cannot send messages" : "Type a message..."}
                    disabled={isSpectator}
                    className="chat-input"
                    maxLength={200}
                />
                <button
                    type="submit"
                    disabled={isSpectator}
                    className="chat-send-btn"
                    title={isSpectator ? "Spectators cannot send messages" : "Send message"}
                >
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </form>


            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                message="Sign in to chat with other players."
                actionLabel="Sign In to Chat"
            />
        </div >
    );
};

export default ChatBox;
