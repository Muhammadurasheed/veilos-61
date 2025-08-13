import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Tag,
  Lock,
  Unlock,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SessionNote {
  id: string;
  sessionId: string;
  expertId: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  attachments: Array<{
    type: 'image' | 'document' | 'audio';
    url: string;
    fileName: string;
    fileSize?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface SessionNotesProps {
  sessionId: string;
  isExpert?: boolean;
  canEdit?: boolean;
}

export const SessionNotes: React.FC<SessionNotesProps> = ({
  sessionId,
  isExpert = false,
  canEdit = false
}) => {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    isPrivate: false
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedTag]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/session-notes/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotes(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load session notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }

    setFilteredNotes(filtered);
  };

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Incomplete Information",
        description: "Please provide both title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/session-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId,
          title: formData.title,
          content: formData.content,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          isPrivate: formData.isPrivate
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotes([data.data, ...notes]);
        setShowCreateDialog(false);
        resetForm();
        toast({
          title: "Note Created",
          description: "Session note has been created successfully"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/session-notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          isPrivate: formData.isPrivate
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotes(notes.map(note => note.id === editingNote.id ? data.data : note));
        setEditingNote(null);
        resetForm();
        toast({
          title: "Note Updated",
          description: "Session note has been updated successfully"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/session-notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotes(notes.filter(note => note.id !== noteId));
        toast({
          title: "Note Deleted",
          description: "Session note has been deleted successfully"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const startEditing = (note: SessionNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
      isPrivate: note.isPrivate
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: '',
      isPrivate: false
    });
  };

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return [...new Set(allTags)].sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Session Notes</h3>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} found
          </p>
        </div>
        
        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All tags</option>
            {getAllTags().map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('');
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notes found</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first note
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {note.title}
                      {note.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(note.createdAt), 'PPP')} at {format(new Date(note.createdAt), 'p')}
                      {note.updatedAt !== note.createdAt && (
                        <span className="ml-2 text-xs">(edited)</span>
                      )}
                    </CardDescription>
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(note)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm mb-4 whitespace-pre-wrap">{note.content}</p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Note Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingNote} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingNote(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update your session note' : 'Add a new note to this session'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter note title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter note content"
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="assessment, progress, goals"
              />
            </div>
            
            {isExpert && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                />
                <Label htmlFor="private" className="flex items-center gap-2">
                  {formData.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  Private note (only visible to me)
                </Label>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={editingNote ? handleUpdateNote : handleCreateNote}
              className="flex-1"
            >
              {editingNote ? 'Update Note' : 'Create Note'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingNote(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};