// frontend/src/features/sessions/sessionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

const apiInstance = api;

// Note: The global interceptor in src/utils/api.js already handles 401 redirects.

const initialState = {
    sessions: [],
    activeSession: null,
    isGenerating: false,
    isError: false,
    isLoading: false,
    message: ''
}

export const getSessions = createAsyncThunk('sessions/getAll', async (_, thunkAPI) => {
    try {
        const response = await apiInstance.get('/api/sessions');
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
})

export const createSession = createAsyncThunk('sessions/create', async (sessionData, thunkAPI) => {
    try {
        const response = await apiInstance.post('/api/sessions', sessionData);
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
})

export const getSessionById = createAsyncThunk('sessions/getOne', async (sessionId, thunkAPI) => {
    try {
        const response = await apiInstance.get(`/api/sessions/${sessionId}`);
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
})

export const deleteSession = createAsyncThunk('sessions/delete', async (sessionId, thunkAPI) => {
    try {
        const response = await apiInstance.delete(`/api/sessions/${sessionId}`);
        return response.data.id;
    }
    catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
})

export const submitAnswer = createAsyncThunk('sessions/submitAnswer', async ({ sessionId, formData }, thunkAPI) => {
    try {
        const response = await apiInstance.post(`/api/sessions/${sessionId}/submit-answer`, formData);
        return response.data;
    }
    catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
})

export const endSession = createAsyncThunk('sessions/endSession', async (sessionId, thunkAPI) => {
    try {
        const response = await apiInstance.post(`/api/sessions/${sessionId}/end`, {});
        return response.data;
    }
    catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);

    }
})

export const sessionSlice = createSlice({
    name: 'sessions',
    initialState,
    reducers: {
        reset: (state) => {
            state.isError = false;
            state.message = '';
            state.isLoading = false;
            state.isGenerating = false;
        },
        socketUpdateSession: (state, action) => {
            const { sessionId, status, message, session } = action.payload;
            state.message = message;

            if (status === 'QUESTIONS_READY' || status === 'GENERATION_FAILED') {
                state.isGenerating = false;
            }

            if (session && state.activeSession && state.activeSession._id === sessionId) {
                state.activeSession.questions = state.activeSession.questions.map((currentQ, index) => {
                    const incomingQ = session.questions[index];
                    if (!incomingQ) return currentQ;
                    if (incomingQ.isEvaluated) return incomingQ;
                    if (currentQ.isSubmitted && !incomingQ.isSubmitted) return currentQ;
                    return incomingQ;
                });
                state.activeSession.overallScore = session.overallScore;
                state.activeSession.status = session.status;
                state.activeSession.metrics = session.metrics;
            }
        },
        setActiveSession: (state, action) => {
            state.activeSession = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder

            .addCase(getSessions.pending, (state) => { state.isLoading = true; })
            .addCase(getSessions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = action.payload;
            })
            .addCase(getSessions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createSession.pending, (state) => { state.isLoading = true; state.isGenerating = true; state.activeSession = null; })
            .addCase(createSession.fulfilled, (state) => { state.isLoading = false; })
            .addCase(createSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.isGenerating = false;
                state.message = action.payload;
            })
            .addCase(getSessionById.fulfilled, (state, action) => {
                state.activeSession = action.payload;
            })
            .addCase(deleteSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = state.sessions.filter(s => s._id !== action.payload);
            })

            .addCase(submitAnswer.pending, (state) => {
                // Do NOT set global isLoading here, or it freezes the whole app.
                // We handle button loading locally in the component.
            })
            .addCase(submitAnswer.fulfilled, (state, action) => {
                state.isLoading = false;


                if (action.payload && Array.isArray(action.payload.questions)) {
                    state.activeSession = action.payload;
                }

            })
            .addCase(submitAnswer.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload;
            });
    }
})

export const { reset, socketUpdateSession, setActiveSession } = sessionSlice.actions;
export default sessionSlice.reducer;