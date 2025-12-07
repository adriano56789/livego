import React from 'react';
import { FaMapMarker } from 'react-icons/fa';

interface MapMarkerIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const MapMarkerIcon: React.FC<MapMarkerIconProps> = ({
  size = 24,
  color = 'currentColor',
  ...props
}) => {
  return <FaMapMarker size={size} color={color} {...props} />;
};

export default MapMarkerIcon;
