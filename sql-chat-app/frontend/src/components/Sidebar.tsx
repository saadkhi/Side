import React, { useState } from 'react';
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
    onDeleteConversation: (id: number, e: React.MouseEvent) => void;
    username: string;
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    username,
    isOpen,
    toggleSidebar,
}) => {
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const confirmDelete = (e: React.MouseEvent) => {
        if (deleteId) {
            onDeleteConversation(deleteId, e);
            setDeleteId(null);
        }
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(null);
    };

    const handleDeleteClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    return (
        <>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        <span style={{ fontSize: '18px' }}>●</span> {username}
                    </div>
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
                            <div className="conversation-info">
                                <div className="conversation-title">{conv.title || 'Untitled Chat'}</div>
                                <div className="conversation-date">
                                    {new Date(conv.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDeleteClick(conv.id, e)}
                                title="Delete Chat"
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}

            {deleteId && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Chat?</h3>
                        <p>Are you sure you want to delete this conversation?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
