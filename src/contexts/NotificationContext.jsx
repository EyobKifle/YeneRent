import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const showNotification = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const refreshUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const data = await api.get('notifications/unread/count');
            setUnreadCount(data.count || 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            refreshUnreadCount();
            const interval = setInterval(refreshUnreadCount, 30000); // 30s polling
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [user, refreshUnreadCount]);

    return (
        <NotificationContext.Provider value={{ showNotification, unreadCount, refreshUnreadCount }}>
            {children}
            <div className="toast-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`toast toast-${notification.type}`}
                        onClick={() => removeNotification(notification.id)}
                    >
                        <div className="toast-content">
                            <i className={`fa-solid ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            <span>{notification.message}</span>
                        </div>
                        <button className="toast-close">&times;</button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
