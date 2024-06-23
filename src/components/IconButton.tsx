import React from "react";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  disabled = false,
  className = "",
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`rounded-full cursor-pointer border flex justify-center items-center hover:bg-accent ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={!disabled ? handleKeyDown : undefined}
    >
      {icon}
    </div>
  );
};
