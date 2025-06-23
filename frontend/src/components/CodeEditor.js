import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CodeEditor = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [code, setCode] = useState('// Loading...');
  const [language, setLanguage] = useState('javascript');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const editorRef = useRef(null);
  const lastCodeRef = useRef('');

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' }
  ];

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error('Authentication required');
      navigate('/login');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    setSocket(newSocket);

    // Join room
    newSocket.emit('join-room', { roomId, token });

    // Socket event listeners
    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to room');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from room');
    });

    newSocket.on('code-update', (data) => {
      setCode(data.code);
      setLanguage(data.language || 'javascript');
      lastCodeRef.current = data.code;
      
      if (data.updatedBy && data.updatedBy !== user?.username) {
        toast(`Code updated by ${data.updatedBy}`, {
          icon: '✏️',
          duration: 2000
        });
      }
    });

    newSocket.on('user-joined', (data) => {
      toast.success(data.message);

      if (Array.isArray(data.users)) {
        // Replace connected users list with full list from backend
        setConnectedUsers(data.users.filter(name => name !== user?.username));
      }
    });


    newSocket.on('user-left', (data) => {
      toast(`${data.message}`, { icon: '👋' });

      if (Array.isArray(data.users)) {
        setConnectedUsers(data.users.filter(name => name !== user?.username));
      }
    });


    newSocket.on('cursor-update', (data) => {
      // Handle cursor position updates from other users
      console.log(`${data.username} cursor at:`, data.position);
    });

    newSocket.on('error', (error) => {
      toast.error(error.message);
      if (error.message === 'Room not found') {
        navigate('/dashboard');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, navigate, getToken, user?.username]);

  const handleEditorChange = (value) => {
    if (value !== lastCodeRef.current) {
      setCode(value);
      lastCodeRef.current = value;
      
      if (socket && isConnected) {
        socket.emit('code-change', {
          code: value,
          language
        });
      }
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket && isConnected) {
      socket.emit('code-change', {
        code,
        language: newLanguage
      });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    navigate('/dashboard');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (socket && isConnected) {
        socket.emit('cursor-position', {
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          }
        });
      }
    });
  };

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <h2>CodeCollab - Room: {roomId}</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="header-controls">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-select"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          <button onClick={copyRoomId} className="copy-button">
            Copy Room ID
          </button>
          
          <button onClick={leaveRoom} className="leave-button">
            Leave Room
          </button>
        </div>
      </header>

      <div className="editor-content">
        <div className="editor-wrapper">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              wordWrap: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true }
            }}
          />
        </div>
        
        <div className="sidebar">
          <div className="users-panel">
            <h3>Connected Users</h3>
            <div className="user-list">
              <div className="user-item current-user">
                <span className="user-indicator">🟢</span>
                <span>{user?.username} (You)</span>
              </div>
              {connectedUsers.map((connectedUser, index) => (
                <div key={index} className="user-item">
                  <span className="user-indicator">🟢</span>
                  <span>{connectedUser}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="room-info">
            <h3>Room Information</h3>
            <div className="info-item">
              <strong>Room ID:</strong> {roomId}
            </div>
            <div className="info-item">
              <strong>Language:</strong> {languages.find(l => l.value === language)?.label}
            </div>
            <div className="info-item">
              <strong>Status:</strong> 
              <span className={isConnected ? 'connected' : 'disconnected'}>
                {isConnected ? ' Connected' : ' Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="help-panel">
            <h3>Quick Help</h3>
            <ul>
              <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Save (auto-sync)</li>
              <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo</li>
              <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo</li>
              <li><kbd>Ctrl</kbd> + <kbd>F</kbd> - Find</li>
              <li><kbd>F11</kbd> - Fullscreen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;