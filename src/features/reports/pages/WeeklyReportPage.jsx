import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/auth/AuthSlice';
import behaviorAdminService from '../../../services/api/behaviorAdminService';
import userService from '../../../services/api/userService';
import * as XLSX from 'xlsx';

const WeeklyReportPage = () => {
  const { user } = useSelector(selectAuth);
  const isViewerOnly = user?.role === 'PROVINCIAL_VIEWER' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  
  const [weeklyConfigs, setWeeklyConfigs] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  
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

  const loadUnits = async () => {
    if (isViewerOnly) {
      try {
        const unitData = await userService.getUnits();
        setUnits(Array.isArray(unitData) ? unitData : []);
      } catch (error) {
        console.error('Lỗi tải danh sách đơn vị:', error);
      }
    }
  };

  useEffect(() => {
    loadWeeks();
    loadUnits();
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
        const data = await behaviorAdminService.getWeeklySummary(selectedWeekId, selectedUnitId);
        setWeeklySummary(data || null);
        setSelectedUserId(''); // Reset selected user when week or unit changes
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu tuần');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedWeekId, selectedUnitId]);

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

  const handleExportExcel = () => {
    if (!weeklySummary || !weeklySummary.items || weeklySummary.items.length === 0) {
      setErrorText('Không có dữ liệu để xuất Excel');
      return;
    }

    const currentWeek = weeklyConfigs.find(w => w.id === selectedWeekId);
    const weekName = currentWeek ? currentWeek.weekName : 'Tuần';

    // Prepare data for Excel
    const excelData = [];
    
    // Header rows
    excelData.push(['Mẫu 6: Báo cáo tuần', '', '', '', '', '']);
    excelData.push(['GĐ VNPT khu vực tổng hợp', '', '', '', '', '']);
    excelData.push(['']); // Empty row
    
    // Column Headers
    excelData.push([
      'Tên nhân viên', 
      'Số KH gặp trong tuần', 
      'Tỷ lệ% có hỏi sâu', 
      'Tỷ lệ% có tư vấn đủ giải pháp', 
      'Tỷ lệ% có theo đuổi đến cùng', 
      'Nhận xét'
    ]);

    // Data rows
    weeklySummary.items.forEach(item => {
      excelData.push([
        item.fullName,
        item.totalCustomerMet || 0,
        item.deepInquiryRate || 0,
        item.fullConsultationRate || 0,
        item.followedThroughRate || 0,
        item.managerFeedback || ''
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Auto width for columns
    const colWidths = [
      { wch: 30 }, // Tên nhân viên
      { wch: 25 }, // Số KH gặp trong tuần
      { wch: 20 }, // Tỷ lệ% có hỏi sâu
      { wch: 25 }, // Tỷ lệ% có tư vấn đủ giải pháp
      { wch: 25 }, // Tỷ lệ% có theo đuổi đến cùng
      { wch: 40 }, // Nhận xét
    ];
    worksheet['!cols'] = colWidths;

    // Merge header cells
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Mẫu 6...
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // GĐ VNPT...
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo tuần');

    // Export file
    XLSX.writeFile(workbook, `Mau_6_Bao_cao_tuan_${weekName}.xlsx`);
  };

  return (
    <div className="review-v3-shell">
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>{isViewerOnly ? 'Thống kê Báo cáo tuần' : 'Mẫu 6: Báo cáo tuần'}</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            {isViewerOnly ? 'Xem thống kê nội dung báo cáo tuần toàn tỉnh.' : 'Quản lý chọn nhân viên và tuần để nhập thông tin báo cáo tuần.'}
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

            {isViewerOnly && (
              <div style={{ flex: 1, minWidth: 250 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Đơn vị:</label>
                <select
                  className="field"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Tất cả đơn vị --</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {!isViewerOnly && (
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
            )}
          </div>
        </section>

        {!isViewerOnly && selectedUserId && (
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
        
        {!isViewerOnly && !selectedUserId && selectedWeekId && !loading && (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
            Vui lòng chọn nhân viên để nhập liệu
          </div>
        )}

        {selectedWeekId && weeklySummary && weeklySummary.items && (
          <section className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Thống kê theo Mẫu 6</h3>
              <button className="btn outline" onClick={handleExportExcel}>
                Xuất Excel
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr>
                    {isViewerOnly && (
                      <th style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Đơn vị</th>
                    )}
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Tên nhân viên</th>
                    <th style={{ padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Số KH gặp trong tuần</th>
                    <th style={{ padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Tỷ lệ% có hỏi sâu</th>
                    <th style={{ padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Tỷ lệ% có tư vấn đủ giải pháp</th>
                    <th style={{ padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Tỷ lệ% có theo đuổi đến cùng</th>
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySummary.items.map((item) => (
                    <tr key={item.userId}>
                      {isViewerOnly && (
                        <td style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0' }}>{item.unitName || 'N/A'}</td>
                      )}
                      <td style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0' }}>{item.fullName}</td>
                      <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{item.totalCustomerMet || 0}</td>
                      <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{item.deepInquiryRate || 0}</td>
                      <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{item.fullConsultationRate || 0}</td>
                      <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{item.followedThroughRate || 0}</td>
                      <td style={{ textAlign: 'left', padding: 8, border: '1px solid #e2e8f0' }}>{item.managerFeedback || ''}</td>
                    </tr>
                  ))}
                  {weeklySummary.items.length === 0 && (
                    <tr>
                      <td colSpan={isViewerOnly ? "7" : "6"} style={{ padding: '20px', color: '#64748b' }}>Không có dữ liệu nhân viên</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default WeeklyReportPage;
