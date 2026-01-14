
import React, { useState, useEffect, useCallback } from 'react';
import { Column, DataRow, AIInsight, User } from './types';
import { INITIAL_COLUMNS, MOCK_DATA } from './constants';
import { getAIAnalysis, generateMoreRows } from './services/geminiService';
import { syncDataWithExternalAPI, saveUserColumnOrder, loadUserColumnOrder } from './services/apiService';

// 模擬使用者清單
const USERS: User[] = [
  { id: 'user_1', name: '王管理員', role: '高級經理', avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' },
  { id: 'user_2', name: '李經理', role: '部門負責人', avatar: 'https://ui-avatars.com/api/?name=Lee&background=6366f1&color=fff' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-TW', { style: 'decimal' }).format(value);
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const AIInsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
  const getColors = () => {
    switch (insight.type) {
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  return (
    <div className={`p-4 rounded-xl border ${getColors()} transition-all duration-300 hover:shadow-md`}>
      <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">{insight.title}</h4>
      <p className="text-sm opacity-90 leading-relaxed">{insight.description}</p>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [data, setData] = useState<DataRow[]>(MOCK_DATA);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [overColIndex, setOverColIndex] = useState<number | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DataRow | null>(null);
  const [formData, setFormData] = useState<Partial<DataRow>>({});

  // 根據儲存的 ID 清單重新排列欄位
  const applyColumnOrder = useCallback((userId: string) => {
    const savedOrder = loadUserColumnOrder(userId);
    if (savedOrder) {
      const reorderedCols = savedOrder
        .map(id => INITIAL_COLUMNS.find(c => c.id === id))
        .filter(Boolean) as Column[];
      
      // 確保沒有漏掉新加入的欄位（如果有更新的話）
      INITIAL_COLUMNS.forEach(col => {
        if (!reorderedCols.find(rc => rc.id === col.id)) {
          reorderedCols.push(col);
        }
      });
      setColumns(reorderedCols);
    } else {
      setColumns(INITIAL_COLUMNS);
    }
  }, []);

  // 當切換使用者時執行
  useEffect(() => {
    applyColumnOrder(currentUser.id);
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchInsights = async () => {
    setIsLoading(true);
    const result = await getAIAnalysis(data);
    setInsights(result);
    setIsLoading(false);
  };

  const handleSyncAPI = async () => {
    setIsSyncing(true);
    const result = await syncDataWithExternalAPI(data);
    if (result) alert("數據已成功傳送並同步。");
    setIsSyncing(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!columns[index].isDraggable) return;
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!columns[index].isDraggable || draggedColIndex === null) return;
    if (overColIndex !== index) setOverColIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || !columns[targetIndex].isDraggable) return;
    const updatedCols = [...columns];
    const [removed] = updatedCols.splice(draggedColIndex, 1);
    updatedCols.splice(targetIndex, 0, removed);
    setColumns(updatedCols);
    
    // 儲存新的順序
    const columnIds = updatedCols.map(c => c.id);
    saveUserColumnOrder(currentUser.id, columnIds);
    
    setDraggedColIndex(null);
    setOverColIndex(null);
  };

  const openModal = (row: DataRow | null = null) => {
    if (row) {
      setEditingRow(row);
      setFormData(row);
    } else {
      setEditingRow(null);
      setFormData({
        id: (data.length > 0 ? Math.max(...data.map(d => parseInt(d.id))) + 1 : 1).toString(),
        status: '啟動中',
        performance: 0,
        salary: 40000
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = formData as DataRow;
    if (editingRow) {
      setData(data.map(item => item.id === editingRow.id ? finalData : item));
    } else {
      setData([...data, finalData]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">NexusTable Pro</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">個人化數據與 API 同步控制台</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <img src={currentUser.avatar} alt="avatar" className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm" />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{currentUser.role}</p>
            </div>
          </div>
          <select 
            className="text-xs font-semibold bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            value={currentUser.id}
            onChange={(e) => {
              const user = USERS.find(u => u.id === e.target.value);
              if (user) setCurrentUser(user);
            }}
          >
            {USERS.map(u => <option key={u.id} value={u.id}>切換為 {u.name}</option>)}
          </select>
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <button onClick={() => openModal()} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            新增成員
          </button>
          <button onClick={handleSyncAPI} disabled={isSyncing} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
            {isSyncing ? <span className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4 4" /></svg>}
            API 同步
          </button>
        </div>
        <button onClick={fetchInsights} disabled={isLoading} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
          {isLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>}
          AI 洞察
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {columns.map((col, idx) => (
                    <th
                      key={col.id}
                      draggable={col.isDraggable}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={() => setOverColIndex(null)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest transition-all duration-200 ${col.isDraggable ? 'draggable hover:bg-slate-100' : 'no-drag'} ${draggedColIndex === idx ? 'draggable-source' : ''} ${overColIndex === idx ? 'draggable-over' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {col.isDraggable && <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" /></svg>}
                        {col.header}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    {columns.map((col) => (
                      <td key={col.id} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {col.accessor === 'actions' ? (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            <button onClick={() => setData(data.filter(d => d.id !== row.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        ) : col.accessor === 'salary' ? (
                          <span className="font-mono font-bold text-slate-900">$ {formatCurrency(row.salary)}</span>
                        ) : col.accessor === 'status' ? (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${row.status === '啟動中' ? 'bg-emerald-100 text-emerald-700' : row.status === '未啟用' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span>
                        ) : col.accessor === 'performance' ? (
                          <div className="flex items-center gap-2 w-32">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${row.performance > 80 ? 'bg-blue-500' : row.performance > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${row.performance}%` }} /></div>
                            <span className="font-mono text-[10px] font-bold text-slate-500">{row.performance}%</span>
                          </div>
                        ) : row[col.accessor as keyof DataRow]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI 智慧洞察分析
            </h3>
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {isLoading ? <LoadingSpinner /> : insights.map((insight, i) => <AIInsightCard key={i} insight={insight} />)}
              {!isLoading && insights.length === 0 && (
                <div className="text-center py-12">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                     <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-xs text-slate-400 font-medium px-4">請點擊「AI 洞察」按鈕開始分析當前數據。</p>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-50">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">介面設定狀態</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">系統已自動為 <span className="text-blue-600">@{currentUser.name}</span> 載入上一次的欄位排列順序。</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900">{editingRow ? '修改成員' : '新增成員'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">請輸入詳細的人事資料資訊</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">成員姓名</label>
                  <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如：林大明" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">職位名稱</label>
                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="例如：研發組長" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">月薪 (TWD)</label>
                    <input required type="number" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono font-bold" value={formData.salary || 0} onChange={e => setFormData({...formData, salary: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">運作狀態</label>
                  <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="啟動中">啟動中</option>
                    <option value="未啟用">未啟用</option>
                    <option value="待處理">待處理</option>
                  </select>
                </div>
                <div>
                  <label className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    <span>績效評分</span>
                    <span className="text-blue-600 font-mono text-xs">{formData.performance}%</span>
                  </label>
                  <input type="range" min="0" max="100" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" value={formData.performance || 0} onChange={e => setFormData({...formData, performance: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all border border-transparent">取消</button>
                <button type="submit" className="flex-[2] px-6 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">儲存變更並同步</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 border-t border-slate-100 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">&copy; 2024 NEXUS ANALYTICS SYSTEM</p>
        <p className="text-[9px] text-slate-300 font-medium">個人化介面偏好與 API 交換模式已啟動</p>
      </footer>
    </div>
  );
};

export default App;
