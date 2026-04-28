import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import managerDailyScoreService from '../../../services/api/managerDailyScoreService';
import { selectAuth } from '../../../store/auth/AuthSlice';

import { BusinessTimeUtil } from '../../../utils/BusinessTimeUtil';

const SCORE_GUIDE_BY_ITEM_CODE = {
  LEARNING_TRAINING_PARTICIPATION:
    'Tốt: hiểu rõ, phát biểu, áp dụng và chia sẻ kinh nghiệm (2-5 điểm)\nĐạt: có tham gia (1 điểm)',
  LEARNING_WORKBOOK_EXERCISE:
    'Xuất sắc (100%): 4\nTốt (>=80%): 3\nĐạt (>=50%): 2\nKém (<=30%): 1',
  LEARNING_MULTIPLE_CHOICE: 'Xuất sắc (100%): 3\nĐạt (>=50%): 2\nKém (<=50%): 1',
  LEARNING_STAGE_EXERCISE: 'Chủ động làm đầy đủ (1-3 điểm)',
  BEHAVIOR_SALES_PLAN:
    'Kế hoạch >=15 khách có đầy đủ thông tin: 3\nKế hoạch >=10 khách có đầy đủ thông tin: 2\nKế hoạch >=5 khách có đầy đủ thông tin: 1',
  BEHAVIOR_PREPARE_CONSULT: 'Có ghi, đầy đủ: 2\nCó ghi, chưa đầy đủ: 1',
  BEHAVIOR_CUSTOMERS_CONTACTED:
    '>=10 khách hàng: 10\n>=8 khách hàng: 8-9\n>=6 khách hàng: 6-7\n>=4 khách hàng: 4-5\n>=2 khách hàng: 2-3\nLưu ý: nếu tiêu chí này > 0 thì Số cuộc gọi CSKH thành công phải = 0',
  BEHAVIOR_OLD_CUSTOMERS_CONSULTED: '>=4 khách hàng: 4\n>=3 khách hàng: 3\n>=2 khách hàng: 2\n>=1 khách hàng: 1',
  BEHAVIOR_SUCCESSFUL_CARE_CALLS:
    '>=100 cuộc: 10\n>=90 cuộc: 8\n>=80 cuộc: 6\n>=60 cuộc: 4\nLưu ý: nếu tiêu chí này > 0 thì Số khách hàng tiếp cận phải = 0',
  BEHAVIOR_DAILY_CHECKLIST: 'Có ghi, đầy đủ, áp dụng đúng: 7\nCó ghi, chưa đầy đủ, chưa đúng: 1-7',
  BEHAVIOR_DIRECTOR_EVALUATION: 'Mẫu 6 (tối đa 9 điểm)',
  PERFORMANCE_RENEWAL_SERVICES: '>=3 dịch vụ: 10\n>=2 dịch vụ: 8\n>=1 dịch vụ: 6',
  PERFORMANCE_NEW_PTM_PACKAGES: '>=2 gói: 4\n>=1 gói: 2',
  PERFORMANCE_CLOSE_RATE: '>=30%: 4\n>=20%: 3\n>=10%: 2',
  PERFORMANCE_REVENUE: '>=1.000.000: 30\n>=800.000: 25\n>=600.000: 20\n>=400.000: 15\n>=200.000: 10\n>=100.000: 5',
  PERFORMANCE_RETURNING_REFERRED: 'Có khách hàng cũ giới thiệu khách mới: 2',
};
const BEHAVIOR_SECTION_CODE = 'BEHAVIOR';
const BEHAVIOR_SECTION_MAX_SCORE = 35;
const BEHAVIOR_CUSTOMERS_CONTACTED_CODE = 'BEHAVIOR_CUSTOMERS_CONTACTED';
const BEHAVIOR_SUCCESSFUL_CARE_CALLS_CODE = 'BEHAVIOR_SUCCESSFUL_CARE_CALLS';

const ManagerDailyScorePage = () => {
  const { user } = useSelector(selectAuth);
  
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const todayKey = useMemo(() => 
    BusinessTimeUtil.getEffectiveBusinessDate(undefined, isManager).format('YYYY-MM-DD'),
    [isManager]
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [criteriaData, setCriteriaData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeKeyword, setEmployeeKeyword] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [scoreDate, setScoreDate] = useState(todayKey);
  const [scoreMap, setScoreMap] = useState({});
  const [selfScoreMap, setSelfScoreMap] = useState({});
  const [employeeNoteMap, setEmployeeNoteMap] = useState({});
  const [sheetStatus, setSheetStatus] = useState('');
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [stats, setStats] = useState(null);

  const allCriteria = useMemo(() => {
    if (!criteriaData?.criteria) {
      return [];
    }
    return criteriaData.criteria;
  }, [criteriaData]);

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const currentTotalScore = useMemo(() => {
    return Number(
      allCriteria
        .reduce((sum, criterion) => sum + Number(scoreMap[criterion.id] || 0), 0)
        .toFixed(2),
    );
  }, [allCriteria, scoreMap]);

  const criteriaByItemCode = useMemo(
    () => new Map(allCriteria.map((item) => [item.itemCode, item])),
    [allCriteria],
  );
  const canEditScore = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canEditEmployeeNote = user?.role === 'EMPLOYEE';

  const resolveScoreGuide = (itemCode) => SCORE_GUIDE_BY_ITEM_CODE[itemCode] || 'Theo quy định nội bộ';

  const validateBeforeSubmit = () => {
    if (!selectedEmployeeId) {
      setErrorText('Vui lòng chọn nhân viên');
      return false;
    }
    if (!scoreDate) {
      setErrorText('Vui lòng chọn ngày chấm điểm');
      return false;
    }
    for (const criterion of allCriteria) {
      const value = Number(scoreMap[criterion.id] || 0);
      if (value < 0) {
        setErrorText(`Điểm không hợp lệ: ${criterion.contentName}`);
        return false;
      }
      if (value > Number(criterion.maxScore || 0)) {
        setErrorText(
          `Điểm "${criterion.contentName}" vượt quá mức tối đa ${Number(criterion.maxScore || 0)}`,
        );
        return false;
      }
    }
    const behaviorTotal = allCriteria
      .filter((item) => item.sectionCode === BEHAVIOR_SECTION_CODE)
      .reduce((sum, item) => sum + Number(scoreMap[item.id] || 0), 0);
    if (behaviorTotal > BEHAVIOR_SECTION_MAX_SCORE) {
      setErrorText(
        `Tổng điểm phần II. Thực hành hành vi không được vượt quá ${BEHAVIOR_SECTION_MAX_SCORE}`,
      );
      return false;
    }
    const customersContactedId = criteriaByItemCode.get(BEHAVIOR_CUSTOMERS_CONTACTED_CODE)?.id;
    const successfulCareCallsId = criteriaByItemCode.get(BEHAVIOR_SUCCESSFUL_CARE_CALLS_CODE)?.id;
    if (customersContactedId && successfulCareCallsId) {
      const customersContactedScore = Number(scoreMap[customersContactedId] || 0);
      const successfulCareCallsScore = Number(scoreMap[successfulCareCallsId] || 0);
      if (customersContactedScore > 0 && successfulCareCallsScore > 0) {
        setErrorText(
          'Nếu tiêu chí Số khách hàng tiếp cận có điểm thì Số cuộc gọi CSKH thành công phải bằng 0 và ngược lại',
        );
        return false;
      }
    }
    return true;
  };

  const handleScoreChange = (criteriaId, value) => {
    setScoreMap((prev) => {
      const next = { ...prev, [criteriaId]: value };
      const customersContactedId = criteriaByItemCode.get(BEHAVIOR_CUSTOMERS_CONTACTED_CODE)?.id;
      const successfulCareCallsId = criteriaByItemCode.get(BEHAVIOR_SUCCESSFUL_CARE_CALLS_CODE)?.id;
      if (!customersContactedId || !successfulCareCallsId) {
        return next;
      }
      if (criteriaId === customersContactedId && Number(value) > 0) {
        next[successfulCareCallsId] = 0;
      }
      if (criteriaId === successfulCareCallsId && Number(value) > 0) {
        next[customersContactedId] = 0;
      }
      return next;
    });
  };

  const loadEmployees = async (keyword = '') => {
    if (user?.role === 'EMPLOYEE') {
      setEmployees([
        {
          id: user.id || user.sub,
          fullName: user.fullName || '',
          username: user.username || '',
          unitId: user.unitId || '',
          unitName: user.unitName || '',
        }
      ]);
      setSelectedEmployeeId(user.id || user.sub);
      return;
    }
    const data = await managerDailyScoreService.getEmployees(keyword);
    setEmployees(Array.isArray(data) ? data : []);
    if (!selectedEmployeeId && Array.isArray(data) && data.length > 0) {
      setSelectedEmployeeId(data[0].id);
    }
  };

  const loadCriteria = async () => {
    const data = await managerDailyScoreService.getCriteria();
    setCriteriaData(data || null);
  };

  const loadEntry = async () => {
    if (!selectedEmployeeId || !scoreDate) {
      return;
    }
    const data = await managerDailyScoreService.getEntry(selectedEmployeeId, scoreDate);
    const initialScoreMap = {};
    const initialSelfScoreMap = {};
    const initialEmployeeNoteMap = {};

    allCriteria.forEach((criterion) => {
      initialScoreMap[criterion.id] = 0;
      initialSelfScoreMap[criterion.id] = 0;
      initialEmployeeNoteMap[criterion.id] = '';
    });

    const sheetItems = data?.sheet?.items || [];
    const isApproved = data?.sheet?.status === 'APPROVED';

    sheetItems.forEach((item) => {
      const sScore = Number(item.score || 0);
      const slfScore = Number(item.selfScore || 0);
      
      // Tự động copy selfScore sang score nếu người dùng là quản lý/admin, phiếu chưa duyệt, và chưa có điểm thẩm định
      initialScoreMap[item.criteriaId] = (canEditScore && !isApproved && sScore === 0) ? slfScore : sScore;
      
      initialSelfScoreMap[item.criteriaId] = slfScore;
      initialEmployeeNoteMap[item.criteriaId] = item.employeeNote || '';
    });

    setScoreMap(initialScoreMap);
    setSelfScoreMap(initialSelfScoreMap);
    setEmployeeNoteMap(initialEmployeeNoteMap);
    setSheetStatus(data?.sheet?.status || '');
  };

  const handleSelfScoreChange = (criteriaId, value) => {
    setSelfScoreMap((prev) => {
      const next = { ...prev, [criteriaId]: value };
      const customersContactedId = criteriaByItemCode.get(BEHAVIOR_CUSTOMERS_CONTACTED_CODE)?.id;
      const successfulCareCallsId = criteriaByItemCode.get(BEHAVIOR_SUCCESSFUL_CARE_CALLS_CODE)?.id;
      if (!customersContactedId || !successfulCareCallsId) {
        return next;
      }
      if (criteriaId === customersContactedId && Number(value) > 0) {
        next[successfulCareCallsId] = 0;
      }
      if (criteriaId === successfulCareCallsId && Number(value) > 0) {
        next[customersContactedId] = 0;
      }
      return next;
    });
  };

  const handleEmployeeNoteChange = (criteriaId, value) => {
    setEmployeeNoteMap((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const loadStatistics = async () => {
    const data = await managerDailyScoreService.getStatistics({
      fromDate,
      toDate,
      employeeId: selectedEmployeeId || undefined,
    });
    setStats(data || null);
  };

  const exportStatistics = async () => {
    setErrorText('');
    setStatusText('');
    try {
      const result = await managerDailyScoreService.exportStatistics({
        fromDate,
        toDate,
        employeeId: selectedEmployeeId || undefined,
      });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusText('Đã xuất file Excel thống kê');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất file Excel thất bại');
    }
  };

  const bootstrap = async () => {
    setLoading(true);
    setErrorText('');
    try {
      await Promise.all([loadCriteria(), loadEmployees('')]);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu chấm điểm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!allCriteria.length || !selectedEmployeeId || !scoreDate) {
      return;
    }
    const run = async () => {
      try {
        await loadEntry();
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được phiếu chấm điểm hiện có');
      }
    };
    run();
  }, [allCriteria.length, selectedEmployeeId, scoreDate]);

  useEffect(() => {
    if (!criteriaData || user?.role === 'EMPLOYEE') {
      return;
    }
    const run = async () => {
      try {
        await loadStatistics();
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được thống kê');
      }
    };
    run();
  }, [criteriaData, fromDate, toDate, selectedEmployeeId, user?.role]);

  const onSave = async () => {
    if (!canEditScore && !canEditEmployeeNote) {
      setErrorText('Vai trò hiện tại chỉ có quyền xem thống kê');
      return;
    }
    setErrorText('');
    setStatusText('');
    if (!validateBeforeSubmit()) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employeeId: selectedEmployeeId,
        scoreDate,
        items: allCriteria.map((criterion) => ({
          criteriaId: criterion.id,
          requirementNote: resolveScoreGuide(criterion.itemCode),
          score: Number(scoreMap[criterion.id] || 0),
          selfScore: Number(selfScoreMap[criterion.id] || 0),
          employeeNote: String(employeeNoteMap[criterion.id] || ''),
        })),
      };
      await managerDailyScoreService.submitEntry(payload);
      setStatusText('Đã lưu phiếu chấm điểm hằng ngày');
      if (user?.role !== 'EMPLOYEE') {
        await loadStatistics();
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu phiếu chấm điểm thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review-v3-shell">
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>{user?.role === 'EMPLOYEE' ? 'Phiếu chấm điểm hằng ngày' : 'Chấm điểm hằng ngày cho nhân viên'}</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            {user?.role === 'EMPLOYEE' 
              ? 'Nhân viên điền nội dung tự đánh giá vào cột "Nội dung (Nhân viên nhập)" và lưu phiếu.' 
              : 'Quản lý chấm điểm theo tiêu chí, cột yêu cầu hiển thị cách tính điểm theo mẫu.'}
          </p>
        </section>

        {errorText ? <div className="status-err" style={{ marginBottom: 8 }}>{errorText}</div> : null}
        {loading ? <div>Đang tải dữ liệu...</div> : null}

        <section className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Bộ lọc nhập điểm</h3>
          <div className="manager-daily-score-filter-grid">
            {user?.role !== 'EMPLOYEE' && (
              <div>
                <div className="review-label">Nhân viên</div>
                <select
                  className="field"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.username})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="review-label">Ngày chấm điểm</div>
              <input
                type="date"
                className="field"
                value={scoreDate}
                onChange={(e) => setScoreDate(e.target.value)}
              />
            </div>
            {user?.role !== 'EMPLOYEE' && (
              <div>
                <div className="review-label">Tìm nhân viên</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="field"
                    value={employeeKeyword}
                    onChange={(e) => setEmployeeKeyword(e.target.value)}
                    placeholder="Tên hoặc username"
                  />
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => loadEmployees(employeeKeyword)}
                  >
                    Lọc
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, color: '#334155' }}>
            Nhân viên đang chọn: <strong>{selectedEmployee?.fullName || '-'}</strong> | Đơn vị:{' '}
            <strong>{selectedEmployee?.unitName || '-'}</strong>
            {user?.role !== 'EMPLOYEE' && (
              <> | Tổng điểm hiện tại: <strong>{currentTotalScore}/100</strong></>
            )}
          </div>
        </section>

        <section className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Phiếu chấm điểm</h3>
          <div className="manager-daily-score-form-list">
            {(criteriaData?.sections || []).map((section) => (
              <FragmentSection
                key={section.sectionCode}
                section={section}
                scoreMap={scoreMap}
                selfScoreMap={selfScoreMap}
                employeeNoteMap={employeeNoteMap}
                resolveScoreGuide={resolveScoreGuide}
                onChangeScore={handleScoreChange}
                onChangeSelfScore={handleSelfScoreChange}
                onChangeEmployeeNote={handleEmployeeNoteChange}
                canEditScore={canEditScore}
                canEditEmployeeNote={canEditEmployeeNote}
              />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ color: '#334155' }}>
                {user?.role !== 'EMPLOYEE' && (
                  <>Tổng điểm: <strong>{currentTotalScore}</strong></>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn" onClick={onSave} disabled={saving || (!canEditScore && !canEditEmployeeNote)}>
                  {saving ? 'Đang lưu...' : (canEditScore || canEditEmployeeNote) ? 'Lưu phiếu' : 'Chỉ xem thống kê'}
                </button>
              </div>
            </div>
            {statusText ? <div className="status-ok" style={{ textAlign: 'right' }}>{statusText}</div> : null}
          </div>
        </section>

        {user?.role !== 'EMPLOYEE' && (
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Thống kê theo mẫu hiện tại</h3>
            <div className="manager-daily-score-filter-grid" style={{ marginBottom: 10 }}>
              <div>
                <div className="review-label">Từ ngày</div>
                <input
                  type="date"
                  className="field"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <div className="review-label">Đến ngày</div>
                <input
                  type="date"
                  className="field"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn outline" onClick={loadStatistics}>
                    Làm mới thống kê
                  </button>
                  <button type="button" className="btn" onClick={exportStatistics}>
                    Xuất Excel
                  </button>
                </div>
              </div>
            </div>

            <div className="manager-daily-score-table-wrap">
              <table className="table manager-daily-score-table">
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th>Họ và tên</th>
                    <th>Ngày</th>
                    {allCriteria.map((criterion) => (
                      <th key={criterion.id}>{criterion.contentName}</th>
                    ))}
                    {(criteriaData?.sections || []).map((section) => (
                      <th key={section.sectionCode}>Tổng {section.sectionName}</th>
                    ))}
                    <th>Tổng cộng</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.rows || []).map((row) => (
                    <tr key={row.id}>
                      <td>{row.unitName || '-'}</td>
                      <td>{row.employee?.fullName || '-'}</td>
                      <td>{row.scoreDate || '-'}</td>
                      {allCriteria.map((criterion) => (
                        <td key={criterion.id}>
                          {Number(row.scoresByItemCode?.[criterion.itemCode] || 0)}
                        </td>
                      ))}
                      {(criteriaData?.sections || []).map((section) => (
                        <td key={section.sectionCode}>
                          {Number(row.sectionTotals?.[section.sectionCode] || 0)}
                        </td>
                      ))}
                      <td>
                        <strong>{Number(row.totalScore || 0)}</strong>
                      </td>
                    </tr>
                  ))}
                  {!loading && (!stats?.rows || stats.rows.length === 0) ? (
                    <tr>
                      <td colSpan={4 + allCriteria.length + (criteriaData?.sections?.length || 0)}>
                        Chưa có dữ liệu thống kê trong khoảng lọc.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, color: '#334155' }}>
              Số dòng thống kê: <strong>{stats?.totals?.totalRows || 0}</strong> | Điểm trung bình:{' '}
              <strong>{stats?.totals?.averageScore || 0}</strong>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const FragmentSection = ({
  section,
  scoreMap,
  selfScoreMap,
  employeeNoteMap,
  resolveScoreGuide,
  onChangeScore,
  onChangeSelfScore,
  onChangeEmployeeNote,
  canEditScore,
  canEditEmployeeNote,
}) => {
  return (
    <div className="manager-daily-score-section">
      <div className="manager-daily-score-section-title">
        {section.sectionName} (Tối đa {Number(section.maxScore || 0)} điểm)
      </div>
      {section.items.map((item) => (
        <div key={item.id} className="manager-daily-score-row">
          <div className="manager-daily-score-col stt">{item.sttLabel}</div>
          <div className="manager-daily-score-col content">{item.contentName}</div>
          <div className="manager-daily-score-col guide">
            <div className="manager-daily-score-guide-box">{resolveScoreGuide(item.itemCode)}</div>
          </div>
          <div className="manager-daily-score-col note">
            {item.employeeInputType === 'number' ? (
              <input
                type="number"
                className="field manager-daily-score-note-field"
                value={employeeNoteMap[item.id] || ''}
                onChange={(e) => onChangeEmployeeNote(item.id, e.target.value)}
                disabled={!canEditEmployeeNote}
                placeholder="Nhân viên nhập số..."
              />
            ) : (
              <textarea
                className="field manager-daily-score-note-field"
                value={employeeNoteMap[item.id] || ''}
                onChange={(e) => onChangeEmployeeNote(item.id, e.target.value)}
                disabled={!canEditEmployeeNote}
                placeholder="Nhân viên nhập nội dung..."
              />
            )}
          </div>
          <div className="manager-daily-score-col score">
            <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Tự đánh giá</div>
            <input
              type="number"
              min={0}
              max={Number(item.maxScore || 0)}
              className="field"
              value={Number(selfScoreMap[item.id] ?? 0)}
              disabled={!canEditEmployeeNote}
              onChange={(e) => onChangeSelfScore(item.id, Number(e.target.value || 0))}
              style={{
                borderColor: Number(selfScoreMap[item.id] ?? 0) > Number(item.maxScore || 0) ? '#dc2626' : undefined
              }}
            />
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
              Tối đa: {Number(item.maxScore || 0)} điểm
            </div>
            {Number(selfScoreMap[item.id] ?? 0) > Number(item.maxScore || 0) && (
              <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>
                Điểm vượt quá tối đa
              </div>
            )}
          </div>
          <div className="manager-daily-score-col score">
            <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Thẩm định</div>
            <input
              type="number"
              min={0}
              max={Number(item.maxScore || 0)}
              className="field"
              value={Number(scoreMap[item.id] ?? 0)}
              disabled={!canEditScore}
              onChange={(e) => onChangeScore(item.id, Number(e.target.value || 0))}
              style={{
                borderColor: Number(scoreMap[item.id] ?? 0) > Number(item.maxScore || 0) ? '#dc2626' : undefined
              }}
            />
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
              Tối đa: {Number(item.maxScore || 0)} điểm
            </div>
            {Number(scoreMap[item.id] ?? 0) > Number(item.maxScore || 0) && (
              <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>
                Điểm vượt quá tối đa
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManagerDailyScorePage;
