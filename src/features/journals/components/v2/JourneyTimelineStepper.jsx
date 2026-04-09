import React, { useMemo } from 'react';
import './EformV2.css';

const JourneyTimelineStepper = ({
  currentDay = 1, // Current day in the 90-day journey (1-90)
  totalDays = 90,
  logs = [], // Array of log objects: { dateKey: '2023-10-25', status: 'PENDING' | 'APPROVED' | 'REJECTED' }
  onSelectDay
}) => {

  // Phân đoạn Giai đoạn: Ngày 1-30, Ngày 31-60, Ngày 61-90
  const phases = useMemo(() => {
    return [
      { id: 1, label: 'Giai đoạn 1 (Ngày 1-30)', start: 1, end: 30 },
      { id: 2, label: 'Giai đoạn 2 (Ngày 31-60)', start: 31, end: 60 },
      { id: 3, label: 'Giai đoạn 3 (Ngày 61-90)', start: 61, end: 90 }
    ];
  }, []);

  const [activePhase, setActivePhase] = React.useState(() => {
    if (currentDay <= 30) return 1;
    if (currentDay <= 60) return 2;
    return 3;
  });

  const getDayStatus = (dayNum) => {
    if (dayNum > currentDay) return 'future';
    const log = logs.find(l => l.dayNumber === dayNum);
    if (!log) return dayNum < currentDay ? 'missed' : 'pending';
    return log.status.toLowerCase(); // 'pending', 'approved', 'rejected'
  };

  const renderDaysForPhase = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    const days = [];
    for (let i = phase.start; i <= phase.end; i++) {
      const status = getDayStatus(i);
      const isActive = i === currentDay;

      days.push(
        <div
          key={i}
          className={`stepper-day-node ${status} ${isActive ? 'active' : ''}`}
          onClick={() => status !== 'future' && onSelectDay && onSelectDay(i)}
          title={`Ngày ${i} - ${status.toUpperCase()}`}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="stepper-container">
      <div className="stepper-phases">
        {phases.map(phase => (
          <button
            key={phase.id}
            className={`stepper-phase-tab ${activePhase === phase.id ? 'active' : ''}`}
            onClick={() => setActivePhase(phase.id)}
          >
            {phase.label}
          </button>
        ))}
      </div>

      <div className="stepper-days-grid">
        {renderDaysForPhase(activePhase)}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '24px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="stepper-day-node pending" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /> Chờ duyệt
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="stepper-day-node approved" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /> Đạt
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="stepper-day-node rejected" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /> Chưa đạt
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="stepper-day-node missed" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /> Bị lỡ
        </div>
      </div>
    </div>
  );
};

export default JourneyTimelineStepper;
