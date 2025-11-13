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
    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs text-gray-400">{comment.user.name}</p>
      <div className="bg-gray-800/50 rounded-lg p-2 mt-1">
        <p className="text-sm text-white">{comment.text}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[#1C1C1E] w-full max-w-md h-[60%] rounded-t-2xl flex flex-col"
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
            comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
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
                className="bg-purple-600 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-purple-700 transition-colors disabled:bg-gray-600"
              >
                {isPosting ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : <SendIcon className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CommentModal;