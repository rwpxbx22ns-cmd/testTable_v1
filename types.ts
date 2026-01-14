
export interface Column {
  id: string;
  header: string;
  accessor: keyof DataRow | 'actions';
  isDraggable: boolean;
  width?: string;
}

export interface DataRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: '啟動中' | '未啟用' | '待處理';
  lastActive: string;
  performance: number;
  salary: number;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}
