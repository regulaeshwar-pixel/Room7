import React from 'react';
import SwipeableNotification from './SwipeableNotification';
import { NOTIFICATION_TYPES } from '../constants/notifications';

const NotificationBanner = ({ notificationState, notifyDispatch, dismissAlert }) => {
    if (!notificationState.ready) return null;
    const { persistent, transient } = notificationState;
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 flex flex-col items-center gap-2 pointer-events-none">
            {transient && (
                <SwipeableNotification
                    key={`transient-${Date.now()}`}
                    alert={{ ...transient, type: NOTIFICATION_TYPES.TRANSIENT }}
                    onDismiss={() => notifyDispatch({ type: 'CLEAR_TRANSIENT' })}
                />
            )}
            {persistent.map(alert => (
                <SwipeableNotification
                    key={alert.type}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert)}
                />
            ))}
        </div>
    );
};

export default NotificationBanner;
