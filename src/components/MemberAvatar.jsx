import React from 'react';

const MemberAvatar = ({ name, code, size = 'sm', className = '', member }) => {
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    const displayCode = code || member?.avatar || (name ? name.substring(0, 2).toUpperCase() : (member?.name ? member.name.substring(0, 2).toUpperCase() : '??'));

    return (
        <div className={`${sizeClass} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border-2 border-white shadow-sm ${className}`} title={name}>
            {displayCode}
        </div>
    );
};

export default MemberAvatar;
