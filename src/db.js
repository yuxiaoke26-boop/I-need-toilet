import Dexie from 'dexie';

// ==========================================
// 本地存储设置 (On-Device Storage: Dexie & IndexedDB)
// ==========================================
export const db = new Dexie('RestroomDB');

// 数据库版本升级到 3，加入了 'comment' (用户短留言) 字段
db.version(3).stores({
  reports: '++id, location, cleanlinessRating, queueRating, comment, image, timestamp'
});