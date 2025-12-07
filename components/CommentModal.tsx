import React, { useState, useEffect, useRef } from 'react';
import { Comment, FeedPhoto, User } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { SendIcon, CloseIcon } from './icons';

interface CommentModalProps {
  photo: FeedPhoto;
  currentUser: User;
  onClose: () => void;
  onCommentPosted: (photoId: string) => void;
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0">
      <img 
        src={comment.user.avatarUrl} 
        alt={comment.user.name} 
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline">
        <p className="text-sm font-medium text-white">{comment.user.name}</p>
        <span className="ml-2 text-xs text-gray-400">
          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="mt-1 bg-gray-800/50 rounded-lg px-3 py-2">
        <p className="text-sm text-white break-words">{comment.text}</p>
      </div>
    </div>
  </div>
);

const CommentModal: React.FC<CommentModalProps> = ({ photo, currentUser, onClose, onCommentPosted }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    api.getComments(photo.id)
      .then(data => setComments(data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [photo.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || isPosting) return;

    setIsPosting(true);
    try {
      const { success, comment } = await api.postComment(photo.id, newComment);
      if (success && comment) {
        setComments(prev => [...prev, comment]);
        setNewComment('');
        onCommentPosted(photo.id);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-[#1C1C1E] w-full max-w-md h-[70%] rounded-t-2xl flex flex-col shadow-lg border-t border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 text-center relative border-b border-gray-700">
          <h2 className="text-base font-semibold text-white">{comments.length} Comentários</h2>
          <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main ref={listRef} className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <CommentItem 
                key={`${comment.id || 'comment'}_${index}`} 
                comment={comment} 
              />
            ))
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              <p>Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          )}
        </main>
        <footer className="flex-shrink-0 p-3 bg-[#111111] border-t border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="flex-grow bg-[#2C2C2E] rounded-full flex items-center pr-1.5">
              <input
                type="text"
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePostComment()}
                className="flex-grow bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={handlePostComment}
                disabled={isPosting || !newComment.trim()}
                className="bg-purple-600 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {isPosting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <SendIcon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CommentModal;