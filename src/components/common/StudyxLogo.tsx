import React from 'react';

interface StudyxLogoProps {
  onClick?: () => void;
  className?: string;
}

export function StudyxLogo({ onClick, className = '' }: StudyxLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none ${className}`}>
      <span className="w-8 h-8 rounded-lg studyx-gradient-btn flex items-center justify-center shadow-sm shadow-blue-600/25 shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.5 7.25C6.5 5.45507 7.95507 4 9.75 4H16.5C17.0523 4 17.5 4.44772 17.5 5V6.75C17.5 7.30228 17.0523 7.75 16.5 7.75H10.5C9.94772 7.75 9.5 8.19772 9.5 8.75C9.5 9.30228 9.94772 9.75 10.5 9.75H14.25C16.0449 9.75 17.5 11.2051 17.5 13V16.75C17.5 18.5449 16.0449 20 14.25 20H7.5C6.94772 20 6.5 19.5523 6.5 19V17.25C6.5 16.6977 6.94772 16.25 7.5 16.25H13.5C14.0523 16.25 14.5 15.8023 14.5 15.25C14.5 14.6977 14.0523 14.25 13.5 14.25H9.75C7.95507 14.25 6.5 12.7949 6.5 11V7.25Z"
            fill="white"
          />
          <circle cx="18.25" cy="18.25" r="2" fill="#BAE6FD" />
        </svg>
      </span>
      <span className="font-display font-bold text-lg tracking-tight text-slate-950 dark:text-white">
        STUDYX <span className="text-blue-600 dark:text-sky-400">AI</span>
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
      >
        {content}
      </button>
    );
  }

  return content;
}
