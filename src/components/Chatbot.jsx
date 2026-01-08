// src/components/Chatbot.jsx
import { useEffect } from 'react';

const Chatbot = () => {
    useEffect(() => {
        // CSS n8n
        const link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Script n8n
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
        document.body.appendChild(script);

        script.onload = () => {
            import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js').then(({ createChat }) => {
                createChat({
                    webhookUrl: 'https://kyanyanya.app.n8n.cloud/webhook/80fb0d87-4125-47c3-bc00-5f66c53396ad/chat',
                    webhookConfig: {
                        method: 'POST'
                    },
                    showWelcomeScreen: true,
                    title: 'AI Travel Tours',
                    subtitle: 'Trợ lý ảo hỗ trợ 24/7',
                    mainColor: '#007bff',
                    initialMessages: [
                        'Chào mừng bạn đến với AI Travel Tours!',
                        'Tôi có thể giúp gì cho chuyến đi của bạn hôm nay?'
                    ]
                });
            });
        };

        return () => {

            if (document.head.contains(link)) document.head.removeChild(link);
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

    return null;
};

export default Chatbot;