export const ROLES = [
    {
        id: 'mern',
        label: 'MERN Stack Developer',
        tech: 'MongoDB, Express, React, Node.js',
        icon: 'mern',
        description: 'Full-stack JavaScript development focusing on modern web applications.'
    },
    {
        id: 'backend',
        label: 'Backend Engineer',
        tech: 'Node.js, Python, Java, Go',
        icon: 'backend',
        description: 'Focus on distributed systems, API design, and server-side logic.'
    },
    {
        id: 'frontend',
        label: 'Frontend Developer',
        tech: 'React, Vue, Angular, TypeScript',
        icon: 'frontend',
        description: 'Creating high-performance, accessible, and beautiful user interfaces.'
    },
    {
        id: 'data-science',
        label: 'Data Science',
        tech: 'Python, ML, Statistics, SQL',
        icon: 'data-science',
        description: 'Analyzing complex datasets and building predictive models.'
    },
    {
        id: 'devops',
        label: 'DevOps & SRE',
        tech: 'Docker, Kubernetes, AWS, CI/CD',
        icon: 'devops',
        description: 'Infrastructure automation and improving reliability/scalability.'
    },
];

export const DIFFICULTIES = [
    { id: 'easy', label: 'Junior', desc: 'Entry level and fundamentals', color: 'text-green-400', bg: 'bg-green-400/10' },
    { id: 'medium', label: 'Mid-Level', desc: 'System design and depth', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { id: 'hard', label: 'Senior+', desc: 'Architecture and optimization', color: 'text-red-400', bg: 'bg-red-400/10' },
];

export const INTERVIEW_TYPES = [
    { id: 'voice', label: 'Oral Interview', desc: 'AI-led voice session', icon: 'voice' },
    { id: 'video', label: 'Video Interview', desc: 'Full visuals & AI analytics', icon: 'video' },
];
