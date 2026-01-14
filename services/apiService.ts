
import { DataRow, Column } from "../types";

const EXTERNAL_API_URL = "https://jsonplaceholder.typicode.com/posts";

export const syncDataWithExternalAPI = async (currentData: DataRow[]): Promise<DataRow[] | null> => {
  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      body: JSON.stringify({ timestamp: new Date().toISOString(), payload: currentData }),
      headers: { "Content-type": "application/json; charset=UTF-8" },
    });
    if (!response.ok) throw new Error("API 同步失敗");
    return currentData;
  } catch (error) {
    return null;
  }
};

// 模擬使用者偏好設定儲存 API
export const saveUserColumnOrder = (userId: string, columnIds: string[]) => {
  const key = `nexus_layout_${userId}`;
  localStorage.setItem(key, JSON.stringify(columnIds));
};

// 模擬使用者偏好設定讀取 API
export const loadUserColumnOrder = (userId: string): string[] | null => {
  const key = `nexus_layout_${userId}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
};
