// frontend/src/utils/tts.js

/**
 * Text-to-Speech utility using Web Speech API
 * Provides AI voice for interview questions and feedback
 */

class TTSManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.voices = [];
        this.selectedVoice = null;
        this.settings = {
            rate: 1.0,      // Speed: 0.1 to 10
            pitch: 1.0,     // Pitch: 0 to 2
            volume: 1.0,    // Volume: 0 to 1
            lang: 'en-US'
        };

        // Load voices when available
        this.loadVoices();

        // Chrome loads voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    /**
     * Load available voices
     */
    loadVoices() {
        this.voices = this.synth.getVoices();

        // Try to find a good English voice
        this.selectedVoice = this.voices.find(voice =>
            voice.lang === 'en-US' && voice.name.includes('Google')
        ) || this.voices.find(voice =>
            voice.lang === 'en-US'
        ) || this.voices[0];
    }

    /**
     * Speak the given text
     * @param {string} text - Text to speak
     * @param {Object} options - Optional settings override
     * @returns {Promise} Resolves when speech is complete
     */
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            // Stop any ongoing speech
            this.stop();

            if (!text || text.trim() === '') {
                resolve();
                return;
            }

            // Create utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);

            // Apply settings
            this.currentUtterance.rate = options.rate || this.settings.rate;
            this.currentUtterance.pitch = options.pitch || this.settings.pitch;
            this.currentUtterance.volume = options.volume || this.settings.volume;
            this.currentUtterance.lang = options.lang || this.settings.lang;
            this.currentUtterance.voice = options.voice || this.selectedVoice;

            // Event handlers
            this.currentUtterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };

            this.currentUtterance.onerror = (event) => {
                console.error('TTS Error:', event);
                this.currentUtterance = null;
                reject(event);
            };

            // Speak
            this.synth.speak(this.currentUtterance);
        });
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.currentUtterance = null;
    }

    /**
     * Pause current speech
     */
    pause() {
        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
        }
    }

    /**
     * Resume paused speech
     */
    resume() {
        if (this.synth.paused) {
            this.synth.resume();
        }
    }

    /**
     * Check if currently speaking
     */
    isSpeaking() {
        return this.synth.speaking;
    }

    /**
     * Check if paused
     */
    isPaused() {
        return this.synth.paused;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get available voices
     */
    getVoices() {
        return this.voices;
    }

    /**
     * Set voice by name
     */
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.selectedVoice = voice;
        }
    }

    /**
     * Speak question with AI-like pacing
     */
    async speakQuestion(questionText) {
        // Add slight pauses for natural speech
        const formattedText = questionText
            .replace(/\./g, '.,')  // Pause after periods
            .replace(/\?/g, '?.')  // Pause after questions
            .replace(/,/g, ',,');  // Slight pause after commas

        return this.speak(formattedText, {
            rate: 0.9,  // Slightly slower for clarity
            pitch: 1.0
        });
    }

    /**
     * Speak feedback with emphasis
     */
    async speakFeedback(feedbackText) {
        return this.speak(feedbackText, {
            rate: 1.0,
            pitch: 1.1  // Slightly higher pitch for feedback
        });
    }
}

// Create singleton instance
const ttsManager = new TTSManager();

// Export convenience functions
export const speak = (text, options) => ttsManager.speak(text, options);
export const speakQuestion = (text) => ttsManager.speakQuestion(text);
export const speakFeedback = (text) => ttsManager.speakFeedback(text);
export const stopSpeaking = () => ttsManager.stop();
export const pauseSpeaking = () => ttsManager.pause();
export const resumeSpeaking = () => ttsManager.resume();
export const isSpeaking = () => ttsManager.isSpeaking();
export const updateTTSSettings = (settings) => ttsManager.updateSettings(settings);
export const getVoices = () => ttsManager.getVoices();
export const setVoice = (voiceName) => ttsManager.setVoice(voiceName);

export default ttsManager;
