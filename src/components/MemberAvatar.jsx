import React from 'react';

const MemberAvatar = ({ name, code, size = 'sm', className = '', member, isActive = false }) => {
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-sm';
    const displayCode = code || member?.avatar || (name ? name.substring(0, 2).toUpperCase() : (member?.name ? member.name.substring(0, 2).toUpperCase() : '??'));

    const baseStyles = `${sizeClass} rounded-[14px] flex items-center justify-center font-black transition-all duration-300 shadow-sm ${isActive
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-50'
            : 'bg-indigo-50 text-indigo-400'
        }`;

    return (
        <div className={`${baseStyles} ${className}`} title={name}>
            {displayCode}
        </div>
    );
};

export default MemberAvatar;
