import React from 'react';

const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-card rounded-2xl shadow-sm border border-theme overflow-hidden transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

export default Card;
