import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startOnboarding = (force = false) => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');

    if (hasSeenTour && !force) {
        return;
    }

    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: 'Finish',
        closeBtnText: 'Skip',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        steps: [
            {
                element: '#sidebar-logo',
                popover: {
                    title: 'Welcome to InterviewAI! 🚀',
                    description: 'Your personal AI-powered interview coach. Let\'s show you around.',
                    side: "right",
                    align: 'start'
                }
            },
            {
                element: '#nav-dashboard',
                popover: {
                    title: 'Your Dashboard',
                    description: 'Get an overview of your progress, recent activities, and performance stats.',
                    side: "right",
                    align: 'center'
                }
            },
            {
                element: '#nav-new-interview',
                popover: {
                    title: 'Start a New Interview',
                    description: 'Practice with real-time AI voice interviews tailored to your resume or specific tracks.',
                    side: "right",
                    align: 'center'
                }
            },
            {
                element: '#nav-coding-practice',
                popover: {
                    title: 'Coding Practice',
                    description: 'Solve 2000+ real interview questions from top companies with AI guidance.',
                    side: "right",
                    align: 'center'
                }
            },
            {
                element: '#nav-analytics',
                popover: {
                    title: 'Analytics',
                    description: 'Deep dive into your emotional intelligence, confidence, and technical scoring.',
                    side: "right",
                    align: 'center'
                }
            },
            {
                element: '#nav-settings',
                popover: {
                    title: 'Settings',
                    description: 'Customize your experience, manage your profile, and configure your preferences.',
                    side: "right",
                    align: 'center'
                }
            }
        ],
        onDestroy: () => {
            localStorage.setItem('hasSeenOnboarding', 'true');
        }
    });

    driverObj.drive();
};
