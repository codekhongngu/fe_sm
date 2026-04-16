import { useEffect, useState } from 'react';
import behaviorAdminService from '../../../services/api/behaviorAdminService';

const WeeklyReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  
  const [weeklyConfigs, setWeeklyConfigs] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [formData, setFormData] = useState({
    customerMetCount: 0,
    deepInquiryRate: 0,
    fullConsultationRate: 0,
    followedThroughRate: 0,
    managerFeedback: ''
  });

  const loadWeeks = async () => {
    setErrorText('');
    try {
      const data = await behaviorAdminService.getWeeklyConfigs();
      const list = Array.isArray(data) ? data : [];
      setWeeklyConfigs(list);
      if (!selectedWeekId && list.length > 0) {
        setSelectedWeekId(list[0].id);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách tuần');
    }
  };

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeekId) {
      setWeeklySummary(null);
      setSelectedUserId('');
      return;
    }
    const run = async () => {
      setLoading(true);
      setErrorText('');
      setSuccessText('');
      try {
        const data = await behaviorAdminService.getWeeklySummary(selectedWeekId);
        setWeeklySummary(data || null);
        setSelectedUserId(''); // Reset selected user when week changes
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu tuần');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedWeekId]);

  // Update form data when a user is selected
  useEffect(() => {
    if (!selectedUserId || !weeklySummary?.items) {
      setFormData({
        customerMetCount: 0,
        deepInquiryRate: 0,
        fullConsultationRate: 0,
        followedThroughRate: 0,
        managerFeedback: ''
      });
      return;
    }
    
    const userItem = weeklySummary.items.find(item => item.userId === selectedUserId);
    if (userItem) {
      setFormData({
        customerMetCount: userItem.totalCustomerMet || 0,
        deepInquiryRate: userItem.deepInquiryRate || 0,
        fullConsultationRate: userItem.fullConsultationRate || 0,
        followedThroughRate: userItem.followedThroughRate || 0,
        managerFeedback: userItem.managerFeedback || ''
      });
    }
  }, [selectedUserId, weeklySummary]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedWeekId || !selectedUserId) {
      setErrorText('Vui lòng chọn tuần và nhân viên');
      return;
    }

    setSaving(true);
    setErrorText('');
    setSuccessText('');
    try {
      const payload = {
        weekId: selectedWeekId,
        userId: selectedUserId,
        ...formData
      };
      
      // Convert string values to numbers for rates and counts
      payload.customerMetCount = Number(payload.customerMetCount);
      payload.deepInquiryRate = Number(payload.deepInquiryRate);
      payload.fullConsultationRate = Number(payload.fullConsultationRate);
      payload.followedThroughRate = Number(payload.followedThroughRate);
      
      await behaviorAdminService.saveWeeklySummary(payload);
      setSuccessText('Lưu báo cáo thành công');
      
      // Update local state so it reflects without reloading
      setWeeklySummary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item => 
            item.userId === selectedUserId 
              ? { 
                  ...item, 
                  totalCustomerMet: payload.customerMetCount,
                  deepInquiryRate: payload.deepInquiryRate,
                  fullConsultationRate: payload.fullConsultationRate,
                  followedThroughRate: payload.followedThroughRate,
                  managerFeedback: payload.managerFeedback
                } 
              : item
          )
        };
      });
      
      setTimeout(() => setSuccessText(''), 3000);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lỗi khi lưu báo cáo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review-v3-shell">
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>Mẫu 6: Báo cáo tuần</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Quản lý chọn nhân viên và tuần để nhập thông tin báo cáo tuần.
          </p>
        </section>

        {errorText ? <div className="status-err" style={{ marginBottom: 8 }}>{errorText}</div> : null}
        {successText ? <div className="status-ok" style={{ marginBottom: 8, color: 'green' }}>{successText}</div> : null}
        {loading ? <div>Đang tải dữ liệu...</div> : null}

        <section className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Lựa chọn thông tin</h3>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tuần báo cáo:</label>
              <select
                className="field"
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Chọn tuần --</option>
                {weeklyConfigs.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.weekName} ({week.startDate} → {week.endDate})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: 250 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Nhân viên:</label>
              <select
                className="field"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: '100%' }}
                disabled={!selectedWeekId || !weeklySummary?.items}
              >
                <option value="">-- Chọn nhân viên --</option>
                {(weeklySummary?.items || []).map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {selectedUserId && (
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Nhập liệu báo cáo</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Số KH gặp trong tuần</label>
                <input 
                  type="number" 
                  className="field" 
                  style={{ width: '100%' }}
                  value={formData.customerMetCount}
                  onChange={(e) => handleFormChange('customerMetCount', e.target.value)}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tỷ lệ có hỏi sâu (%)</label>
                <input 
                  type="number" 
                  className="field" 
                  style={{ width: '100%' }}
                  value={formData.deepInquiryRate}
                  onChange={(e) => handleFormChange('deepInquiryRate', e.target.value)}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tỷ lệ tư vấn đủ giải pháp (%)</label>
                <input 
                  type="number" 
                  className="field" 
                  style={{ width: '100%' }}
                  value={formData.fullConsultationRate}
                  onChange={(e) => handleFormChange('fullConsultationRate', e.target.value)}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tỷ lệ có theo đuổi đến cùng (%)</label>
                <input 
                  type="number" 
                  className="field" 
                  style={{ width: '100%' }}
                  value={formData.followedThroughRate}
                  onChange={(e) => handleFormChange('followedThroughRate', e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Nhận xét</label>
              <textarea 
                className="field" 
                style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                placeholder="Nhập nhận xét..."
                value={formData.managerFeedback}
                onChange={(e) => handleFormChange('managerFeedback', e.target.value)}
              />
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 24px', fontSize: 16 }}
              >
                {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
              </button>
            </div>
          </section>
        )}
        
        {!selectedUserId && selectedWeekId && !loading && (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
            Vui lòng chọn nhân viên để nhập liệu
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReportPage;
