import React from 'react';

const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-card rounded-[20px] shadow-premium border border-theme overflow-hidden transition-all duration-300 ${className}`}>
        {children}
    </div>
);

export default Card;
