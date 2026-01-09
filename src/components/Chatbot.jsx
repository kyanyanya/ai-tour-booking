
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
                // src/components/Chatbot.jsx
                createChat({
                    webhookUrl: 'https://kyanyanya.app.n8n.cloud/webhook/80fb0d87-4125-47c3-bc00-5f66c53396ad/chat',

                    // SỬA DÒNG "Hi there!" THÀNH TÊN TRANG WEB CỦA BẠN
                    title: 'AI Travel Tours',

                    // SỬA DÒNG "Start a chat..." THÀNH LỜI CHÀO MỚI
                    subtitle: 'Chào bạn, chúc bạn một ngày mới tốt lành.',

                    showWelcomeScreen: true, // Nếu bạn muốn ẩn hẳn mảng đen này, hãy đổi thành false
                    mainColor: '#8233ff',

                    // Các tin nhắn xuất hiện trong bong bóng chat
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