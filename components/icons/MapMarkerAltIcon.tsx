import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface MapMarkerAltIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const MapMarkerAltIcon: React.FC<MapMarkerAltIconProps> = ({
  size = 24,
  color = 'currentColor',
  ...props
}) => {
  return <FaMapMarkerAlt size={size} color={color} {...props} />;
};

export default MapMarkerAltIcon;
