import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/auth/AuthSlice';
import managerDailyScoreService from '../../../services/api/managerDailyScoreService';
import { BusinessTimeUtil } from '../../../utils/BusinessTimeUtil';

const formatNumber = (value) => Number(value || 0).toFixed(2);

const sortByScore = (rows, key) =>
  [...(rows || [])].sort((a, b) => Number(b?.[key] || 0) - Number(a?.[key] || 0));

const CoachingCompetitionPage = () => {
  const { user } = useSelector(selectAuth);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canImport = user?.role === 'ADMIN' || user?.role === 'PROVINCIAL_VIEWER';

  const today = BusinessTimeUtil.getEffectiveBusinessDate(undefined, isManager).toDate();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(
    startOfMonth.getMonth() + 1,
  ).padStart(2, '0')}-01`;

  const [fromDate, setFromDate] = useState(startOfMonthStr);
  const [toDate, setToDate] = useState(
    BusinessTimeUtil.getEffectiveBusinessDate(undefined, isManager).format('YYYY-MM-DD'),
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const loadReport = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setErrorText('');

    try {
      const data = await managerDailyScoreService.getCoachingCompetitionReport({
        fromDate,
        toDate,
      });
      setReportData(data);
    } catch (err) {
      setErrorText(err?.response?.data?.message || 'Không thể tải báo cáo thi đua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [fromDate, toDate]);

  const handleDownloadTemplate = async () => {
    try {
      const res = await managerDailyScoreService.downloadCoachingCompetitionTemplate();
      const blob = new Blob([res.blob]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorText('Lỗi khi tải biểu mẫu');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('');
    setErrorText('');

    try {
      const res = await managerDailyScoreService.importCoachingCompetitionData(file);
      setUploadStatus(
        `Import thành công ${res.importedCount || 0} dòng. Bỏ qua ${res.skippedCount || 0} dòng.`,
      );
      await loadReport();
    } catch (err) {
      setErrorText(err?.response?.data?.message || 'Lỗi khi import file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await managerDailyScoreService.exportCoachingCompetitionReportFile({
        fromDate,
        toDate,
      });
      const blob = new Blob([res.blob]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(res.fileName));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorText(err?.response?.data?.message || 'Lỗi khi xuất file Excel');
    }
  };

  const units = reportData?.units || [];
  const employees = reportData?.employees || [];

  const excellentUnits = sortByScore(units, 'excellentCoachingScore');
  const transformationUnits = sortByScore(units, 'bestTransformationScore');
  const behaviorUnits = sortByScore(units, 'bestBehaviorScore');

  const strongestEmployees = sortByScore(employees, 'personalChangeScore');
  const followUpEmployees = sortByScore(employees, 'followUpScore');
  const cultureEmployees = sortByScore(employees, 'cultureScore');

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Báo Cáo Thi Đua Coaching</h2>
        {canImport ? (
          <div>
            <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
                Tải biểu mẫu Import
              </button>
              <label className="btn btn-primary" style={{ cursor: 'pointer', margin: 0 }}>
                {uploading ? 'Đang tải lên...' : 'Import dữ liệu Excel'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '13px', marginTop: '8px', maxWidth: '760px' }}
            >
              File import nhập chi tiết theo tiểu mục: Mục 3 gồm 3.1, 3.2, 3.3; Mục 4 gồm
              4.1, 4.2, 4.3, 4.4, 4.5; Mục 5 gồm 5.1. Hệ thống sẽ cộng các cột chi tiết này
              khi xuất báo cáo.
            </div>
          </div>
        ) : null}
      </div>

      <div className="filter-section card" style={{ padding: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Từ ngày</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Đến ngày</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
          <button className="btn btn-success" onClick={handleExportReport} disabled={loading}>
            Xuất Excel báo cáo
          </button>
        </div>
        {errorText ? <div className="text-danger mt-2">{errorText}</div> : null}
        {uploadStatus ? <div className="text-success mt-2">{uploadStatus}</div> : null}
      </div>

      {reportData ? (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Kết quả Tập Thể</h3>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ overflowX: 'auto' }}>
                <h4>1. Nhóm coaching xuất sắc</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Mục 1</th>
                      <th>Mục 2</th>
                      <th>Mục 3</th>
                      <th>Mục 4</th>
                      <th>Mục 5</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excellentUnits.length ? (
                      excellentUnits.map((unit) => (
                        <tr key={`excellent-${unit.unitId}`}>
                          <td>{unit.unitName}</td>
                          <td className="text-center">{formatNumber(unit.item1Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item2Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item3Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item4Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item5Avg)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(unit.excellentCoachingScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <h4>2. Nhóm chuyển hóa đội ngũ tốt nhất</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Mục 1</th>
                      <th>Mục 2</th>
                      <th>Mục 3</th>
                      <th>Mục 4 x 2</th>
                      <th>Mục 5</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformationUnits.length ? (
                      transformationUnits.map((unit) => (
                        <tr key={`transformation-${unit.unitId}`}>
                          <td>{unit.unitName}</td>
                          <td className="text-center">{formatNumber(unit.item1Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item2Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item3Avg)}</td>
                          <td className="text-center">{formatNumber(Number(unit.item4Avg || 0) * 2)}</td>
                          <td className="text-center">{formatNumber(unit.item5Avg)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(unit.bestTransformationScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <h4>3. Nhóm giữ chuẩn hành vi tốt nhất</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Mục 1</th>
                      <th>Mục 2 x 2</th>
                      <th>Mục 3</th>
                      <th>Mục 4</th>
                      <th>Mục 5</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviorUnits.length ? (
                      behaviorUnits.map((unit) => (
                        <tr key={`behavior-${unit.unitId}`}>
                          <td>{unit.unitName}</td>
                          <td className="text-center">{formatNumber(unit.item1Avg)}</td>
                          <td className="text-center">{formatNumber(Number(unit.item2Avg || 0) * 2)}</td>
                          <td className="text-center">{formatNumber(unit.item3Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item4Avg)}</td>
                          <td className="text-center">{formatNumber(unit.item5Avg)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(unit.bestBehaviorScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Kết quả Cá Nhân</h3>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ overflowX: 'auto' }}>
                <h4>1. Nhân viên thay đổi mạnh nhất</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Mã NV</th>
                      <th>Họ và tên</th>
                      <th>Đơn vị</th>
                      <th>Mục 2</th>
                      <th>Mục 4 x 2</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strongestEmployees.length ? (
                      strongestEmployees.map((emp) => (
                        <tr key={`strongest-${emp.employeeId}`}>
                          <td>{emp.employeeCode}</td>
                          <td>{emp.fullName}</td>
                          <td>{emp.unitName}</td>
                          <td className="text-center">{formatNumber(emp.item2Score)}</td>
                          <td className="text-center">{formatNumber(Number(emp.item4Score || 0) * 2)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(emp.personalChangeScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <h4>2. Nhân viên follow-up tốt nhất</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Mã NV</th>
                      <th>Họ và tên</th>
                      <th>Đơn vị</th>
                      <th>Mục 2</th>
                      <th>Mục 2.7</th>
                      <th>Mục 4</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUpEmployees.length ? (
                      followUpEmployees.map((emp) => (
                        <tr key={`followup-${emp.employeeId}`}>
                          <td>{emp.employeeCode}</td>
                          <td>{emp.fullName}</td>
                          <td>{emp.unitName}</td>
                          <td className="text-center">{formatNumber(emp.item2Score)}</td>
                          <td className="text-center">{formatNumber(emp.item2Item7Score)}</td>
                          <td className="text-center">{formatNumber(emp.item4Score)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(emp.followUpScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <h4>3. Nhân viên xây dựng văn hóa tốt nhất</h4>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Mã NV</th>
                      <th>Họ và tên</th>
                      <th>Đơn vị</th>
                      <th>Mục 2 x 2</th>
                      <th>Mục 4</th>
                      <th>Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cultureEmployees.length ? (
                      cultureEmployees.map((emp) => (
                        <tr key={`culture-${emp.employeeId}`}>
                          <td>{emp.employeeCode}</td>
                          <td>{emp.fullName}</td>
                          <td>{emp.unitName}</td>
                          <td className="text-center">{formatNumber(Number(emp.item2Score || 0) * 2)}</td>
                          <td className="text-center">{formatNumber(emp.item4Score)}</td>
                          <td className="text-center font-weight-bold">
                            {formatNumber(emp.cultureScore)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Thống kê chi tiết Mục 3, 4, 5 - Tập Thể</h3>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th>3.1</th>
                    <th>3.2</th>
                    <th>3.3</th>
                    <th>4.1</th>
                    <th>4.2</th>
                    <th>4.3</th>
                    <th>4.4</th>
                    <th>4.5</th>
                    <th>5.1</th>
                  </tr>
                </thead>
                <tbody>
                  {units.length ? (
                    units.map((unit) => (
                      <tr key={`detail-unit-${unit.unitId}`}>
                        <td>{unit.unitName}</td>
                        <td className="text-center">{formatNumber(unit.item31Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item32Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item33Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item41Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item42Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item43Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item44Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item45Avg)}</td>
                        <td className="text-center">{formatNumber(unit.item51Avg)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center">
                        Chưa có dữ liệu chi tiết tập thể
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Thống kê chi tiết Mục 3, 4, 5 - Cá Nhân</h3>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ và tên</th>
                    <th>Đơn vị</th>
                    <th>3.1</th>
                    <th>3.2</th>
                    <th>3.3</th>
                    <th>4.1</th>
                    <th>4.2</th>
                    <th>4.3</th>
                    <th>4.4</th>
                    <th>4.5</th>
                    <th>5.1</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length ? (
                    employees.map((emp) => (
                      <tr key={`detail-employee-${emp.employeeId}`}>
                        <td>{emp.employeeCode}</td>
                        <td>{emp.fullName}</td>
                        <td>{emp.unitName}</td>
                        <td className="text-center">{formatNumber(emp.item31Score)}</td>
                        <td className="text-center">{formatNumber(emp.item32Score)}</td>
                        <td className="text-center">{formatNumber(emp.item33Score)}</td>
                        <td className="text-center">{formatNumber(emp.item41Score)}</td>
                        <td className="text-center">{formatNumber(emp.item42Score)}</td>
                        <td className="text-center">{formatNumber(emp.item43Score)}</td>
                        <td className="text-center">{formatNumber(emp.item44Score)}</td>
                        <td className="text-center">{formatNumber(emp.item45Score)}</td>
                        <td className="text-center">{formatNumber(emp.item51Score)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        Chưa có dữ liệu chi tiết cá nhân
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CoachingCompetitionPage;
