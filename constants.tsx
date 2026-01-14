
import { DataRow, Column } from './types';

export const INITIAL_COLUMNS: Column[] = [
  { id: 'col-id', header: '編號', accessor: 'id', isDraggable: false, width: '80px' },
  { id: 'col-name', header: '姓名', accessor: 'name', isDraggable: true },
  { id: 'col-role', header: '職位', accessor: 'role', isDraggable: true },
  { id: 'col-status', header: '狀態', accessor: 'status', isDraggable: true },
  { id: 'col-perf', header: '績效 (%)', accessor: 'performance', isDraggable: true },
  { id: 'col-salary', header: '薪資 (TWD)', accessor: 'salary', isDraggable: true },
  { id: 'col-actions', header: '操作', accessor: 'actions', isDraggable: false, width: '120px' },
];

export const MOCK_DATA: DataRow[] = [
  { id: '1', name: '王小明', email: 'xiaoming@nexus.ai', role: '工程師', status: '啟動中', lastActive: '2023-10-24', performance: 92, salary: 75000 },
  { id: '2', name: '陳曉華', email: 'huahua@nexus.ai', role: '設計師', status: '啟動中', lastActive: '2023-10-25', performance: 88, salary: 62000 },
  { id: '3', name: '張大千', email: 'daqian@nexus.ai', role: '經理', status: '未啟用', lastActive: '2023-09-12', performance: 75, salary: 98000 },
  { id: '4', name: '李思思', email: 'sisi@nexus.ai', role: '工程師', status: '待處理', lastActive: '2023-10-21', performance: 40, salary: 58000 },
  { id: '5', name: '金大元', email: 'dayuan@nexus.ai', role: '行銷', status: '啟動中', lastActive: '2023-10-25', performance: 95, salary: 65000 },
];
