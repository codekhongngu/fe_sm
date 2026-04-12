import React, { useMemo } from 'react';
import './EformV2.css';

const JourneyTimelineStepper = ({
  currentDay = 1, // Current day in the 90-day journey (1-90)
  totalDays = 90,
  logs = [], // Array of log objects: { dateKey: '2023-10-25', status: 'PENDING' | 'APPROVED' | 'REJECTED' }
  phaseConfigs = [],
  onSelectDay
}) => {

  // Phân đoạn Giai đoạn: Lấy từ cấu hình động
  const phases = useMemo(() => {
    if (Array.isArray(phaseConfigs) && phaseConfigs.length > 0) {
      return phaseConfigs
        .filter(p => p.isActive !== false)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        .map((p, index) => ({
          id: p.id || p.phaseCode || index,
          label: `${p.phaseName} (${p.startDate ? p.startDate.split('-').reverse().join('/') : ''} - ${p.endDate ? p.endDate.split('-').reverse().join('/') : ''})`,
          startDate: p.startDate,
          endDate: p.endDate
        }));
    }
    // Fallback nếu không có cấu hình
    return [
      { id: 1, label: 'Giai đoạn 1', startDate: '2020-01-01', endDate: '2020-01-30' },
      { id: 2, label: 'Giai đoạn 2', startDate: '2020-01-31', endDate: '2020-03-01' },
      { id: 3, label: 'Giai đoạn 3', startDate: '2020-03-02', endDate: '2020-03-31' }
    ];
  }, [phaseConfigs]);

  const [activePhase, setActivePhase] = React.useState(() => {
    if (phases.length > 0) return phases[0].id;
    return 1;
  });

  React.useEffect(() => {
    // Determine which phase contains currentDay
    // Giả sử ngày hiện tại có thể không nằm trong một phase cụ thể do tính bằng date
    // Ở đây component Stepper chủ yếu hiển thị danh sách ngày, nên ta tạm map các ngày trong phase
    // Tuy nhiên cấu trúc "start, end" bằng số ngày (1..90) của Stepper đã bị phá vỡ.
    // Cần phải render các ô ngày theo số ngày trong khoảng startDate -> endDate
    const active = phases.find((p) => p.id === activePhase);
    if (!active && phases.length > 0) {
      setActivePhase(phases[0].id);
    }
  }, [phases, activePhase]);

  const currentPhase = phases.find((p) => p.id === activePhase) || phases[0];

  // Tính số lượng ngày trong khoảng startDate -> endDate
  const getDaysArray = (phase) => {
    if (!phase || !phase.startDate || !phase.endDate) return [];
    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);
    const diffTime = end - start;
    if (diffTime < 0) return [];
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    
    // Tạo mảng các đối tượng chứa date cụ thể
    return Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${d.getFullYear()}-${m}-${day}`;
      return { dayNumber: i + 1, dateKey, displayLabel: `${day}/${m}` };
    });
  };

  const currentPhaseDays = getDaysArray(currentPhase);

  const renderDaysForPhase = () => {
    if (!currentPhase || currentPhaseDays.length === 0) {
      return <div style={{ padding: 20, textAlign: 'center', color: '#999', width: '100%' }}>Chưa có cấu hình ngày cho giai đoạn này</div>;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return currentPhaseDays.map((dayObj) => {
      const isToday = dayObj.dateKey === todayStr;
      const logStatus = logs.find((l) => l.dateKey === dayObj.dateKey)?.status || 'NONE';

      let statusClass = 'future';
      if (logStatus === 'APPROVED') statusClass = 'approved';
      else if (logStatus === 'REJECTED') statusClass = 'rejected';
      else if (logStatus === 'PENDING') statusClass = 'pending';
      else if (dayObj.dateKey < todayStr) statusClass = 'missed';
      else if (dayObj.dateKey === todayStr) statusClass = 'pending';

      return (
        <div
          key={dayObj.dateKey}
          className={`stepper-day-node ${statusClass} ${isToday ? 'active' : ''}`}
          onClick={() => statusClass !== 'future' && onSelectDay && onSelectDay(dayObj.dateKey)}
          title={`Ngày ${dayObj.displayLabel} - ${statusClass.toUpperCase()}`}
        >
          {dayObj.displayLabel}
        </div>
      );
    });
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
        {renderDaysForPhase()}
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
