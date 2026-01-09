
import { useEffect } from 'react';
import './ChatbotOverrides.css';

const Chatbot = () => {
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
        document.body.appendChild(script);

        script.onload = () => {
            import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js').then(({ createChat }) => {

                createChat({
                    webhookUrl: 'https://kyanyanya.app.n8n.cloud/webhook/80fb0d87-4125-47c3-bc00-5f66c53396ad/chat',


                    title: 'AI Travel Tours',
                    subtitle: 'Chào bạn, chúc bạn một ngày mới tốt lành.',
                    showWelcomeScreen: true,
                    mainColor: '#8233ff',


                    initialMessages: [
                        'Xin chào! Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?'
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