import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const createRoom = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/rooms/create`);
      const newRoomId = response.data.roomId;
      toast.success(`Room created! ID: ${newRoomId}`);
      navigate(`/room/${newRoomId}`);
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/rooms/join`, { roomId: roomId.trim().toUpperCase() });
      navigate(`/room/${roomId.trim().toUpperCase()}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join room';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>CodeCollab</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Real-time Code Collaboration</h2>
            <p>Create a new room or join an existing one to start coding together!</p>
          </div>

          <div className="dashboard-actions">
            <div className="action-section">
              <h3>Create New Room</h3>
              <p>Start a new collaborative coding session</p>
              <button 
                onClick={createRoom} 
                className="create-room-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="action-section">
              <h3>Join Existing Room</h3>
              <p>Enter the room ID to join a collaboration session</p>
              <form onSubmit={joinRoom} className="join-form">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter Room ID (e.g., ABC123)"
                  className="room-input"
                  maxLength="6"
                />
                <button 
                  type="submit" 
                  className="join-room-button"
                  disabled={loading || !roomId.trim()}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </form>
            </div>
          </div>

          <div className="features">
            <h3>Features</h3>
            <ul>
              <li>Real-time code synchronization</li>
              <li>Multiple programming languages support</li>
              <li>Live cursor tracking</li>
              <li>User presence indicators</li>
              <li>Instant collaboration</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;