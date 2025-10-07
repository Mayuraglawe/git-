import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Share2, Users, Lock, Eye, Edit, Crown, UserPlus, 
  Link as LinkIcon, Mail, Copy, Check, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export type AccessLevel = 'view-only' | 'edit' | 'full-access';
export type FreeBusyStatus = 'free' | 'busy' | 'tentative' | 'out-of-office';

export interface EventShare {
  id: string;
  event_id: string;
  user_email: string;
  user_name?: string;
  access_level: AccessLevel;
  shared_by: string;
  shared_at: string;
  can_reshare: boolean;
}

export interface FreeBusySlot {
  start: Date;
  end: Date;
  status: FreeBusyStatus;
  event_title?: string; // Only shown for events user has access to
}

interface EventSharingDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (share: Omit<EventShare, 'id' | 'shared_at'>) => void;
  existingShares: EventShare[];
  currentUserEmail: string;
}

export function EventSharingDialog({ 
  event, 
  open, 
  onOpenChange, 
  onShare,
  existingShares,
  currentUserEmail 
}: EventSharingDialogProps) {
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('view-only');
  const [canReshare, setCanReshare] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const generateShareLink = () => {
    const link = `${window.location.origin}/events/shared/${event.id}?token=${btoa(JSON.stringify({
      event_id: event.id,
      access_level: accessLevel,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }))}`;
    setShareLink(link);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    if (!userEmail.trim()) return;

    onShare({
      event_id: event.id,
      user_email: userEmail.trim(),
      access_level: accessLevel,
      shared_by: currentUserEmail,
      can_reshare: canReshare
    });

    setUserEmail('');
    setAccessLevel('view-only');
    setCanReshare(false);
  };

  const getAccessIcon = (level: AccessLevel) => {
    switch (level) {
      case 'view-only': return <Eye className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'full-access': return <Crown className="h-4 w-4" />;
    }
  };

  const getAccessColor = (level: AccessLevel) => {
    switch (level) {
      case 'view-only': return 'bg-blue-500';
      case 'edit': return 'bg-yellow-500';
      case 'full-access': return 'bg-purple-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Event: {event.title}
          </DialogTitle>
          <DialogDescription>
            Control who can view and edit this event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with specific users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Share with People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                  />
                </div>
                <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view-only">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Only
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Can Edit
                      </div>
                    </SelectItem>
                    <SelectItem value="full-access">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Full Access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare}>
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="can-reshare" className="text-sm">
                  Allow recipient to share with others
                </Label>
                <Switch
                  id="can-reshare"
                  checked={canReshare}
                  onCheckedChange={setCanReshare}
                />
              </div>

              {/* Access level descriptions */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Eye className="h-3 w-3 mt-0.5" />
                  <div>
                    <span className="font-medium">View Only:</span> Can see event details but cannot make changes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Edit className="h-3 w-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Can Edit:</span> Can modify event details and participants
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-3 w-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Full Access:</span> Can edit, delete, and manage sharing permissions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing shares */}
          {existingShares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People with Access ({existingShares.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingShares.map(share => (
                    <div key={share.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getAccessColor(share.access_level)}`} />
                        <div>
                          <p className="font-medium">{share.user_name || share.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Shared {format(new Date(share.shared_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getAccessIcon(share.access_level)}
                          <span className="ml-1">{share.access_level}</span>
                        </Badge>
                        {share.can_reshare && (
                          <Badge variant="secondary" className="text-xs">
                            <Share2 className="h-3 w-3 mr-1" />
                            Can share
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Get Shareable Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={generateShareLink}
                  className="flex-1"
                >
                  Generate Link
                </Button>
              </div>
              
              {shareLink && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="text-xs" />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(shareLink)}
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Link expires in 7 days. Anyone with the link can {accessLevel === 'view-only' ? 'view' : 'edit'} this event.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FreeBusyViewerProps {
  userEmail: string;
  startDate: Date;
  endDate: Date;
  slots: FreeBusySlot[];
}

export function FreeBusyViewer({ userEmail, startDate, endDate, slots }: FreeBusyViewerProps) {
  const getStatusColor = (status: FreeBusyStatus) => {
    switch (status) {
      case 'free': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'tentative': return 'bg-yellow-500';
      case 'out-of-office': return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: FreeBusyStatus) => {
    switch (status) {
      case 'free': return '✓';
      case 'busy': return '✕';
      case 'tentative': return '?';
      case 'out-of-office': return '⊘';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Availability for {userEmail}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-4">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </div>
          
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No availability information</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded border">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(slot.status)}`}>
                    <span className="text-white text-xs">{getStatusIcon(slot.status)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {format(slot.start, 'MMM d, h:mm a')} - {format(slot.end, 'h:mm a')}
                      </span>
                      <Badge variant={slot.status === 'free' ? 'default' : 'secondary'} className="text-xs">
                        {slot.status}
                      </Badge>
                    </div>
                    {slot.event_title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {slot.event_title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Free</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Busy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Tentative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Out of Office</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate free/busy slots from events
export function calculateFreeBusySlots(
  events: any[],
  startDate: Date,
  endDate: Date,
  userHasAccess: (eventId: string) => boolean
): FreeBusySlot[] {
  const slots: FreeBusySlot[] = [];

  events.forEach(event => {
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);

    // Check if event is within the requested range
    if (eventStart >= startDate && eventEnd <= endDate) {
      slots.push({
        start: eventStart,
        end: eventEnd,
        status: event.status === 'cancelled' ? 'free' : 'busy',
        event_title: userHasAccess(event.id) ? event.title : undefined
      });
    }
  });

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Storage helpers
const STORAGE_KEY = 'event_shares';

export function saveEventShares(shares: EventShare[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
}

export function loadEventShares(): EventShare[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addEventShare(share: Omit<EventShare, 'id' | 'shared_at'>): EventShare {
  const shares = loadEventShares();
  const newShare: EventShare = {
    ...share,
    id: Date.now().toString(),
    shared_at: new Date().toISOString()
  };
  shares.push(newShare);
  saveEventShares(shares);
  return newShare;
}

export function getEventShares(eventId: string): EventShare[] {
  return loadEventShares().filter(share => share.event_id === eventId);
}

export function getUserAccessLevel(eventId: string, userEmail: string): AccessLevel | null {
  const shares = loadEventShares();
  const share = shares.find(s => s.event_id === eventId && s.user_email === userEmail);
  return share ? share.access_level : null;
}

export function canUserAccessEvent(eventId: string, userEmail: string): boolean {
  return getUserAccessLevel(eventId, userEmail) !== null;
}

export function canUserEditEvent(eventId: string, userEmail: string): boolean {
  const level = getUserAccessLevel(eventId, userEmail);
  return level === 'edit' || level === 'full-access';
}

export function canUserManageSharing(eventId: string, userEmail: string): boolean {
  const level = getUserAccessLevel(eventId, userEmail);
  return level === 'full-access';
}
