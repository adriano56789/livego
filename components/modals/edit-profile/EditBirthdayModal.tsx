import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';

interface EditBirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue: string;
}

const EditBirthdayModal: React.FC<EditBirthdayModalProps> = ({ isOpen, onClose, onSave, initialValue }) => {
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');

  useEffect(() => {
    if (isOpen) {
      const parts = (initialValue || '').split('/');
      // Check for a valid-looking date format DD/MM/YYYY
      if (parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length === 4) {
        setDay(String(parseInt(parts[0], 10)));
        setMonth(String(parseInt(parts[1], 10)));
        setYear(parts[2]);
      } else {
        // If initialValue is missing or malformed, default to 18 years ago
        const currentYear = new Date().getFullYear();
        setDay('1');
        setMonth('1');
        setYear(String(currentYear - 18));
      }
    }
  }, [isOpen, initialValue]);

  // Adjust day if it's invalid for the new month/year
  useEffect(() => {
    if (isOpen) {
      const maxDays = new Date(parseInt(year), parseInt(month), 0).getDate();
      if (parseInt(day) > maxDays) {
          setDay(String(maxDays));
      }
    }
  }, [month, year, day, isOpen]);


  const handleSave = () => {
    if (day && month && year) {
      const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      onSave(formattedDate);
    }
  };

  if (!isOpen) return null;

  // Generate options for dropdowns
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - 18 - i));
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];
  
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  
  const selectClasses = "w-full bg-[#2c2c2e] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500";

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Aniversário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </div>
        
        <div className="flex space-x-3">
          <div className="flex-1">
            <label htmlFor="day-select" className="text-xs text-gray-400 mb-1 block">Dia</label>
            <select id="day-select" value={day} onChange={e => setDay(e.target.value)} className={selectClasses}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="month-select" className="text-xs text-gray-400 mb-1 block">Mês</label>
            <select id="month-select" value={month} onChange={e => setMonth(e.target.value)} className={selectClasses}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
             <label htmlFor="year-select" className="text-xs text-gray-400 mb-1 block">Ano</label>
            <select id="year-select" value={year} onChange={e => setYear(e.target.value)} className={selectClasses}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-500 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default EditBirthdayModal;