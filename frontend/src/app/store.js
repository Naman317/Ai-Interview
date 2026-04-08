import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import sessionReducer from '../features/sessions/sessionSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';

const store=configureStore({
    reducer: {
        auth: authReducer,
        sessions: sessionReducer,
        analytics: analyticsReducer,
    },
    devTools:true,
});

export default store