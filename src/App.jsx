import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks'; 
import { db } from './db'; 
import './App.css';

// 这是一个假数据数组，用来模拟从云端服务器获取的社区数据
const MOCK_COMMUNITY_DATA = [
  { id: 101, user: "Alex", location: "Main Stage Left", clean: 4, queue: 1, comment: "Huge line right now!", time: "10:05 AM" },
  { id: 102, user: "Sam", location: "Food Court", clean: 5, queue: 5, comment: "Completely empty and clean.", time: "10:12 AM" },
  { id: 103, user: "Jamie", location: "VIP Lounge", clean: 3, queue: 4, comment: "Out of soap.", time: "10:15 AM" }
];

function App() {
 
  // 1. 状态管理 (React Hooks)
  const [activeTab, setActiveTab] = useState('diary'); 

  // 表单状态
  const [location, setLocation] = useState(''); 
  const [cleanRating, setCleanRating] = useState(0); 
  const [queueRating, setQueueRating] = useState(0); 
  const [comment, setComment] = useState(''); 
  const [photo, setPhoto] = useState(null); 

  // 社区排序状态
  const [communitySort, setCommunitySort] = useState('fastest'); 

  // 2. 数据获取与逻辑
  // 获取本地个人日记
  const myNotes = useLiveQuery(() => db.reports.orderBy('id').reverse().toArray(), []) || [];

  // 对社区假数据进行排序的逻辑
  const sortedCommunityData = [...MOCK_COMMUNITY_DATA].sort((a, b) => {
    if (communitySort === 'fastest') return b.queue - a.queue; 
    if (communitySort === 'cleanest') return b.clean - a.clean; 
    return 0; 
  });

  // 删除个人日记
  const handleDelete = async (id) => {
    if (window.confirm("Delete this note?")) {
      await db.reports.delete(id);
    }
  };

  //  核心功能：Web Share API 原生分享逻辑
  const handleShare = async (note) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Toilet Diary',
          text: `Check out this restroom at ${note.location}! Cleanliness: ${note.cleanlinessRating} stars, Queue: ${note.queueRating} stars.`,
          url: window.location.href // 分享当前应用的网址
        });
      } catch (error) {
        console.log("Share cancelled or failed", error);
      }
    } else {
      alert("Your browser does not support the Web Share API.");
    }
  };

  // 提交新日记
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!location || cleanRating === 0 || queueRating === 0) {
      alert("Missing required fields!");
      return;
    }
    
    try {
      await db.reports.add({
        location,
        cleanlinessRating: cleanRating,
        queueRating: queueRating,
        comment: comment, 
        image: photo, // 把相机拍的照片文件存进 IndexedDB
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      
      // 重置表单
      setLocation(''); setCleanRating(0); setQueueRating(0); setComment(''); setPhoto(null);
      document.getElementById('photo-input').value = ''; // 强行清空照片输入框
      alert("Saved to local diary!");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  // 3. 页面视图渲染 (全英文UI)
  return (
    <div className="app-container">
      
      {/* 顶部导航栏 */}
      <div className="navbar">
        <button 
          className={activeTab === 'diary' ? 'nav-btn active' : 'nav-btn'} 
          onClick={() => setActiveTab('diary')}
        >
          My Diary
        </button>
        <button 
          className={activeTab === 'community' ? 'nav-btn active' : 'nav-btn'} 
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
      </div>

      <div className="header">
        <h1>ToiletQ</h1>
      </div>

      {/* 视图 A: 我的日记 */}
      {activeTab === 'diary' && (
        <div>
          {/* 简化的提交表单 */}
          <form onSubmit={handleSubmit} className="simple-box">
            <h3>New Log</h3>
            
            <select 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              className="simple-input"
              style={{ 
                color: '#000',              //  强制文字为黑色，防止 iOS 变透明
                backgroundColor: '#fff',    //  强制背景为白色
                WebkitAppearance: 'none',   // 剥夺苹果 iOS 的默认渲染权限
                appearance: 'none',         //  标准去格式化
                opacity: 1,                 //  防止 iOS 降低未选中状态的透明度
                // 下面这三行是自己画一个下拉小箭头，保证美观
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px top 50%',
                backgroundSize: '12px auto',
                paddingRight: '30px'
              }}
            >
              <option value="">-- Location --</option>
              <option value="Main Stage Left">Main Stage Left</option>
              <option value="Food Court">Food Court</option>
              <option value="VIP Lounge">VIP Lounge</option>
            </select>

            <div className="rating-row">
              <label>Clean:</label>
              <div>{[1,2,3,4,5].map(star => (<span key={star} className={star <= cleanRating ? "star active" : "star"} onClick={() => setCleanRating(star)}>★</span>))}</div>
            </div>

            <div className="rating-row">
              <label>Queue (Fast):</label>
              <div>{[1,2,3,4,5].map(star => (<span key={star} className={star <= queueRating ? "star active" : "star"} onClick={() => setQueueRating(star)}>★</span>))}</div>
            </div>

            <input 
              type="text" 
              placeholder="Comments (optional)" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="simple-input"
            />

            {/*  核心功能：Camera API 原生相机/文件输入框 */}
            <input 
              id="photo-input"
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={(e) => setPhoto(e.target.files[0])} 
              className="simple-input"
              style={{ fontSize: '14px', padding: '10px' }}
            />

            <button type="submit" className="simple-btn">Save Note</button>
          </form>

          {/* 个人的历史记录 */}
          <h3>My Logs (Local)</h3>
          {myNotes.map(note => (
            <div key={note.id} className="simple-box note-item">
              <div className="note-head">
                <strong> {note.location}</strong>
                <div>
                  {/*  核心功能：调用原生分享的按钮 */}
                  <button 
                    onClick={() => handleShare(note)}
                    style={{ backgroundColor: '#007AFF', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginRight: '5px' }}
                  >
                    Share
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p>Clean: {'★'.repeat(note.cleanlinessRating)} | Queue: {'★'.repeat(note.queueRating)}</p>
              {note.comment && <p className="comment-text">"{note.comment}"</p>}
              
              {/* 视觉升级：如果有图片，直接在日记里展示出来！ */}
              {note.image && (
                 <img 
                   src={URL.createObjectURL(note.image)} 
                   alt="Restroom evidence" 
                   style={{ width: '100%', borderRadius: '8px', marginTop: '10px', maxHeight: '150px', objectFit: 'cover' }} 
                 />
              )}
              
              <small style={{ display: 'block', marginTop: '10px', color: '#888' }}>{note.timestamp}</small>
            </div>
          ))}
        </div>
      )}

      {/* 视图 B: 社区广场 (纯演示用的假数据，保持完全隔离不变) */}
      {activeTab === 'community' && (
        <div>
          <div className="community-header">
            <h3>Live Community Feed</h3>
            <select value={communitySort} onChange={(e) => setCommunitySort(e.target.value)} className="simple-input sort-select">
              <option value="fastest">Sort: Fastest Queue</option>
              <option value="cleanest">Sort: Cleanest</option>
            </select>
          </div>

          <p className="mock-warning">Note: This is simulated data for demonstration.</p>

          {sortedCommunityData.map(post => (
            <div key={post.id} className="simple-box community-item">
              <div className="note-head">
                <strong> {post.location}</strong>
                <span className="user-badge"> {post.user}</span>
              </div>
              <p>Clean: {'★'.repeat(post.clean)} | Queue: {'★'.repeat(post.queue)}</p>
              <p className="comment-text">"{post.comment}"</p>
              <small>Posted at {post.time}</small>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;