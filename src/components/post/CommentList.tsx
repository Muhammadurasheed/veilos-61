
import { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/alias';

interface CommentListProps {
  comments: Comment[];
}

const CommentList = ({ comments }: CommentListProps) => {
  if (comments.length === 0) {
    return <p className="text-sm text-gray-500 italic">No responses yet. Be the first to respond.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3">
          <Avatar className="h-8 w-8 mt-1">
            {comment.isExpert ? (
              <>
                <AvatarImage src={`/experts/expert-${comment.expertId?.split('-')[1] || '1'}.jpg`} alt={comment.userAlias} />
                <AvatarFallback className="bg-veilo-gold-light text-veilo-gold-dark">
                  {comment.userAlias.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            ) : (
              <>
                <AvatarImage src={`/avatars/avatar-${comment.userAvatarIndex}.svg`} alt={comment.userAlias} />
                <AvatarFallback className="bg-veilo-blue-light text-veilo-blue-dark">
                  {comment.userAlias.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="font-medium text-sm text-gray-700 mr-2">{comment.userAlias}</span>
              {comment.isExpert && (
                <Badge variant="outline" className="bg-veilo-gold-light text-veilo-gold-dark border-veilo-gold-light text-xs">
                  Verified Expert
                </Badge>
              )}
              <span className="text-xs text-gray-400 ml-auto">{formatDate(comment.timestamp)}</span>
            </div>
            <div className="p-3 bg-white bg-opacity-70 rounded-xl text-sm text-gray-700">
              {comment.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
