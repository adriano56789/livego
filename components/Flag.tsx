
import React from 'react';
import GlobalIcon from './icons/GlobalIcon';
import BrazilFlagIcon from './icons/BrazilFlagIcon';
import ColombiaFlagIcon from './icons/ColombiaFlagIcon';
import UsaFlagIcon from './icons/UsaFlagIcon';
import MexicoFlagIcon from './icons/MexicoFlagIcon';
import ArgentinaFlagIcon from './icons/ArgentinaFlagIcon';
import SpainFlagIcon from './icons/SpainFlagIcon';
import PhilippinesFlagIcon from './icons/PhilippinesFlagIcon';
import VietnamFlagIcon from './icons/VietnamFlagIcon';
import IndiaFlagIcon from './icons/IndiaFlagIcon';
import RussiaFlagIcon from './icons/RussiaFlagIcon';
import CanadaFlagIcon from './icons/CanadaFlagIcon';


interface FlagProps extends React.SVGProps<SVGSVGElement> {
  code: string;
}

const flagComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  global: GlobalIcon,
  BR: BrazilFlagIcon,
  CO: ColombiaFlagIcon,
  US: UsaFlagIcon,
  MX: MexicoFlagIcon,
  AR: ArgentinaFlagIcon,
  ES: SpainFlagIcon,
  PH: PhilippinesFlagIcon,
  VN: VietnamFlagIcon,
  IN: IndiaFlagIcon,
  RU: RussiaFlagIcon,
  CA: CanadaFlagIcon,
};

const Flag: React.FC<FlagProps> = ({ code, ...props }) => {
  const FlagComponent = flagComponents[code] || GlobalIcon; // Fallback to GlobalIcon
  return <FlagComponent {...props} />;
};

export default Flag;
