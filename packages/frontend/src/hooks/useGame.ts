import { useContext } from 'react';
import { SocketContext } from '@/providers/SocketContext';

export const useGame = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useGame must be used within a SocketProvider');
    }
    return context;
};
