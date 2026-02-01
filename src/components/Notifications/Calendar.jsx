import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/utils';

export default function Calendar({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysCount = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = [];
  // Padding for first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === d;
    });

    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

    days.push(
      <div key={d} className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}>
        <span className="day-number">{d}</span>
        <div className="day-events">
          {dayEvents.map((e, idx) => (
            <div key={idx} className={`event-dot ${e.type}`} title={e.message}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{monthNames[month]} {year}</h2>
        <div className="calendar-nav">
          <button onClick={prevMonth}><ChevronLeft size={20} /></button>
          <button onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="calendar-weekdays">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className="calendar-grid">
        {days}
      </div>
      <div className="calendar-legend">
        <div className="legend-item"><span className="dot reminder"></span> Reminder</div>
        <div className="legend-item"><span className="dot lease"></span> Lease Ending</div>
        <div className="legend-item"><span className="dot admin"></span> Response</div>
      </div>
    </div>
  );
}
