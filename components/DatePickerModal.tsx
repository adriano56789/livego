

import React, { useState, useEffect, useMemo } from 'react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  currentDate: string | null;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ isOpen, onClose, onSelectDate, currentDate }) => {
  const now = new Date();
  const initialDate = currentDate ? new Date(currentDate + 'T00:00:00') : new Date(now.getFullYear() - 18, 0, 1);
  
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth()); // 0-11
  const [day, setDay] = useState(initialDate.getDate());

  useEffect(() => {
    if (isOpen && currentDate) {
      const d = new Date(currentDate + 'T00:00:00');
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(d.getDate());
    }
  }, [isOpen, currentDate]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    const endYear = currentYear - 13; // Users must be at least 13
    return Array.from({ length: (endYear - startYear + 1) }, (_, i) => startYear + i).reverse();
  }, []);

  const months = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  }, [year, month]);

  const handleConfirm = () => {
    const validDay = Math.min(day, daysInMonth);
    const selectedDate = new Date(year, month, validDay);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDate > today) {
        onClose();
        return;
    }
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
    onSelectDate(dateString);
    onClose();
  };
  
  const handleDayClick = (clickedDay: number) => {
    setDay(clickedDay);
  };
  
  const renderDays = () => {
    const dayElements = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dayElements.push(<div key={`blank-${i}`} className="w-10 h-10"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === day;
      dayElements.push(
        <button
          key={`day-${i}`}
          onClick={() => handleDayClick(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            isSelected
              ? 'bg-[#34C759] text-black font-bold'
              : 'text-gray-300 hover:bg-[#252525]'
          }`}
        >
          {i}
        </button>
      );
    }
    return dayElements;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="datepicker-title"
    >
      <div 
        className="bg-[#1c1c1c] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="datepicker-title" className="text-xl font-semibold text-white text-center">
            Selecione seu Aniversário
        </h2>

        <div className="flex gap-4">
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))} 
            className="w-full bg-[#252525] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-lime-500/50"
            aria-label="Ano"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={month} 
            onChange={e => setMonth(Number(e.target.value))} 
            className="w-full bg-[#252525] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-lime-500/50"
            aria-label="Mês"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">D</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">S</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">T</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">Q</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">Q</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">S</div>
          <div className="text-gray-500 text-sm w-10 h-8 flex items-center justify-center">S</div>
          {renderDays()}
        </div>

        <div className="flex gap-4 mt-2">
            <button onClick={onClose} className="w-full bg-[#252525] text-white font-semibold py-3 rounded-full hover:bg-gray-600 transition-colors">
                Cancelar
            </button>
            <button onClick={handleConfirm} className="w-full bg-[#34C759] text-black font-semibold py-3 rounded-full hover:opacity-90 transition-opacity">
                Confirmar
            </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;