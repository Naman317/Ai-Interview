import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketUpdateSession } from '../features/sessions/sessionSlice';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const useSocket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      const newSocket = io(BACKEND_URL, {
        query: { userId: user._id },
        transports: ['websocket'],
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket.io connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.io disconnected.');
      });

      newSocket.on('sessionUpdate', (payload) => {
        console.log('Real-time Session Update:', payload.status);
        dispatch(socketUpdateSession(payload));
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user, dispatch]);

  return socket;
};

export default useSocket;