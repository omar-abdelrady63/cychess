import { useNotifications } from '../context/NotificationContext';
import './NotificationPopup.css';

const NotificationPopup = () => {
    const { popupQueue, removePopup } = useNotifications();

    const handleDismiss = (notification) => {
        removePopup(notification.id || notification._id);
    };

    if (popupQueue.length === 0) return null;

    return (
        <div className="notification-popup-container">
            {popupQueue.map((notification) => {
                const id = notification.id || notification._id;
                return (
                    <div
                        key={id}
                        className={`notification-popup ${notification.type === 'game_invite' ? 'invite' : ''}`}
                    >
                        <div className="notification-popup-header">
                            <strong>{notification.title}</strong>
                            <button
                                type="button"
                                className="notification-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removePopup(id);
                                }}
                                aria-label="Dismiss"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <div className="notification-popup-message">
                            {notification.message}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default NotificationPopup;
