
import React from 'react';

interface HumanBodyProps {
  onOrganClick: (organ: string) => void;
  selectedOrgan: string | null;
}

const HumanBody: React.FC<HumanBodyProps> = ({ onOrganClick, selectedOrgan }) => {
  const organStyle = "cursor-pointer transition-all duration-300 opacity-80 hover:opacity-100";
  
  return (
    <svg viewBox="0 0 300 500" className="max-w-xs mx-auto h-auto drop-shadow-lg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      </defs>
      <style>
        {`
          .body-part {
            fill: #b2dfdb; /* Lighter Teal */
            stroke: #4db6ac; /* Medium Teal */
          }
          .selected-organ {
             filter: url(#glow);
             opacity: 1;
             transform-origin: center;
             animation: pulse 1.5s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }
        `}
      </style>
      <g id="torso" className="body-part" strokeWidth="2">
        {/* Simplified body outline */}
        <path d="M150 120 C 120 120, 100 150, 100 180 L 100 350 L 120 450 L 180 450 L 200 350 L 200 180 C 200 150, 180 120, 150 120 Z" />
      </g>
       <g id="head" className="body-part" strokeWidth="2">
        <circle cx="150" cy="80" r="40" />
      </g>
      
      {/* Organs */}
      <g id="organs">
        {/* Brain */}
        <path
          d="M150 50 C130 50 120 60 120 80 C120 100 130 110 150 110 C170 110 180 100 180 80 C180 60 170 50 150 50 Z"
          fill="#26a69a"
          className={`${organStyle} ${selectedOrgan === 'Brain' ? 'selected-organ' : ''}`}
          onClick={() => onOrganClick('Brain')}
        />
        {/* Lungs */}
        <g onClick={() => onOrganClick('Lungs')} className={`${organStyle} ${selectedOrgan === 'Lungs' ? 'selected-organ' : ''}`}>
          <path d="M140 160 C 110 160, 100 200, 110 230 L 140 230 Z" fill="#4db6ac" />
          <path d="M160 160 C 190 160, 200 200, 190 230 L 160 230 Z" fill="#4db6ac" />
        </g>
        {/* Heart */}
        <path
          d="M150 190 L 130 210 C 120 220, 150 250, 150 250 C 150 250, 180 220, 170 210 L 150 190 Z"
          fill="#e74c3c"
          className={`${organStyle} ${selectedOrgan === 'Heart' ? 'selected-organ' : ''}`}
          onClick={() => onOrganClick('Heart')}
        />
        {/* Liver */}
        <path
          d="M120 250 C 140 240, 160 240, 180 250 L 190 280 L 110 280 Z"
          fill="#00796b"
          className={`${organStyle} ${selectedOrgan === 'Liver' ? 'selected-organ' : ''}`}
          onClick={() => onOrganClick('Liver')}
        />
        {/* Kidneys */}
         <g onClick={() => onOrganClick('Kidneys')} className={`${organStyle} ${selectedOrgan === 'Kidneys' ? 'selected-organ' : ''}`}>
           <ellipse cx="125" cy="300" rx="15" ry="25" fill="#00695c" />
           <ellipse cx="175" cy="300" rx="15" ry="25" fill="#00695c" />
        </g>
      </g>
    </svg>
  );
};

export default HumanBody;