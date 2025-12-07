import React from 'react';
import { UserIcon } from '../icons';
import { useTranslation } from '../../i18n';

interface FriendRequestNotificationProps {
  followerName: string;
  onClick: () => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({ followerName, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="bg-purple-500/30 rounded-full p-1.5 px-3 flex items-center self-start text-xs cursor-pointer hover:bg-purple-500/40 shadow-md"
    >
      <UserIcon className="w-5 h-5 text-purple-300 mr-2" />
      <span className="text-gray-200">{t('chat.newFriendRequestWithName', { name: followerName })}</span>
    </button>
  );
};

export default FriendRequestNotification;