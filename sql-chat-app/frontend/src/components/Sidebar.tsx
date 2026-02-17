import React from 'react';
import '../App.css';

interface Conversation {
    id: number;
    title: string;
    updated_at: string;
    created_at: string;
}

interface SidebarProps {
    conversations: Conversation[];
    currentConversationId: number | null;
    onSelectConversation: (id: number) => void;
    onNewChat: () => void;
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewChat,
    isOpen,
    toggleSidebar,
}) => {
    return (
        <>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button onClick={onNewChat} className="new-chat-btn">
                        + New Chat
                    </button>
                </div>
                <div className="conversation-list">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''
                                }`}
                            onClick={() => onSelectConversation(conv.id)}
                        >
                            <div className="conversation-title">{conv.title || 'Untitled Chat'}</div>
                            <div className="conversation-date">
                                {new Date(conv.updated_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
        </>
    );
};

export default Sidebar;
