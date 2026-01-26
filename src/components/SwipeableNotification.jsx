import React, { useState, useRef } from 'react';
import {
    Info,
    AlertTriangle,
    Bell,
    CheckCircle2,
    PartyPopper,
    Utensils,
    Droplets,
    ShoppingCart,
    DollarSign,
    Calendar,
    GripVertical,
} from 'lucide-react';
import { NOTIFICATION_TYPES } from '../constants/notifications';

const SwipeableNotification = ({ alert, onDismiss }) => {
    const [translateX, setTranslateX] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const startX = useRef(null);
    const isDragging = useRef(false);

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const handleTouchMove = (e) => {
        if (!startX.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        setTranslateX(diff);
        setOpacity(Math.max(0, 1 - Math.abs(diff) / 250));
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (Math.abs(translateX) > 100) {
            setTranslateX(translateX > 0 ? 500 : -500);
            setOpacity(0);
            setTimeout(() => onDismiss(alert), 300);
        } else {
            setTranslateX(0);
            setOpacity(1);
        }
        startX.current = null;
    };

    const handleMouseDown = (e) => {
        startX.current = e.clientX;
        isDragging.current = true;
    };
    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const currentX = e.clientX;
        const diff = currentX - startX.current;
        setTranslateX(diff);
        setOpacity(Math.max(0, 1 - Math.abs(diff) / 250));
    };
    const handleMouseUp = () => {
        if (!isDragging.current) return;
        handleTouchEnd();
    };
    const handleMouseLeave = () => {
        if (isDragging.current) handleTouchEnd();
    };

    const variant = alert.variant || 'info';

    const styles = {
        danger: { bg: 'bg-rose-50', iconBg: 'bg-rose-100 text-rose-600', text: 'text-rose-900', border: 'border-rose-100' },
        warning: { bg: 'bg-amber-50', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-900', border: 'border-amber-100' },
        success: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-900', border: 'border-emerald-100' },
        info: { bg: 'bg-white', iconBg: 'bg-slate-100 text-slate-600', text: 'text-slate-700', border: 'border-slate-100' },
        social: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-900', border: 'border-indigo-100' }
    };

    const activeStyle = styles[variant] || styles.info;

    let Icon = Info;
    if (variant === 'danger') Icon = AlertTriangle;
    if (variant === 'warning') Icon = Bell;
    if (variant === 'success') Icon = CheckCircle2;
    if (variant === 'social') Icon = PartyPopper;

    if (alert.type === NOTIFICATION_TYPES.COOKING_DELAYED || alert.type === NOTIFICATION_TYPES.COOKING_PENDING || alert.type === NOTIFICATION_TYPES.COOKING_WINDOW) Icon = Utensils;
    if (alert.type === NOTIFICATION_TYPES.WATER_DUTY || alert.type === NOTIFICATION_TYPES.LOW_WATER) Icon = Droplets;
    if (alert.type === NOTIFICATION_TYPES.MARKET) Icon = ShoppingCart;
    if (alert.type === NOTIFICATION_TYPES.VEG_NEGATIVE || alert.type === NOTIFICATION_TYPES.VEG_LOW) Icon = DollarSign;
    if (alert.type === NOTIFICATION_TYPES.UPCOMING_DUTY) Icon = Calendar;

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `translateX(${translateX}px)`,
                opacity: opacity,
                transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease'
            }}
            className={`w-full max-w-md shadow-xl rounded-2xl p-4 flex items-start gap-4 pointer-events-auto touch-pan-y relative select-none cursor-grab active:cursor-grabbing border bg-white ${activeStyle.border}`}
        >
            <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activeStyle.iconBg}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 pt-0.5">
                <p className={`text-sm font-semibold leading-tight ${activeStyle.text}`}>{alert.msg}</p>
            </div>
            <div className="shrink-0 opacity-20 text-slate-400 self-center"><GripVertical size={20} /></div>
        </div>
    );
};

export default SwipeableNotification;
