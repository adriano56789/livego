import React from 'react';

interface CustomDiamondIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const CustomDiamondIcon: React.FC<CustomDiamondIconProps> = ({
  size = 24,
  width,
  height,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={width || size}
      height={height || size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M12 1.5L1.5 12L12 22.5L22.5 12L12 1.5Z"
        fill="#FFD700"
        stroke="#FFC107"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 1.5L16.5 12L12 16.5L7.5 12L12 1.5Z"
        fill="#FFE44D"
        stroke="#FFC107"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 22.5L16.5 12L12 7.5L7.5 12L12 22.5Z"
        fill="#FFC107"
        stroke="#FFA000"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 1.5V7.5M12 16.5V22.5M1.5 12H7.5M16.5 12H22.5"
        stroke="#FFA000"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CustomDiamondIcon;
