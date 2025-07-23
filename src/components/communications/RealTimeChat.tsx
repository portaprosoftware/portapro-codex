
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  User,
  Circle,
  CheckCircle2
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
}

export const RealTimeChat: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockChannels: ChatChannel[] = [
    {
      id: 'channel-1',
      name: 'Operations Team',
      type: 'group',
      participants: ['user-1', 'user-2', 'user-3'],
      lastMessage: {
        id: 'msg-1',
        senderId: 'user-2',
        senderName: 'Sarah Johnson',
        content: 'Vehicle V-001 needs immediate attention',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'text',
        status: 'read'
      },
      unreadCount: 2
    },
    {
      id: 'channel-2',
      name: 'John Smith',
      type: 'direct',
      participants: ['user-1', 'user-4'],
      lastMessage: {
        id: 'msg-2',
        senderId: 'user-4',
        senderName: 'John Smith',
        content: 'Job completed successfully',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'text',
        status: 'delivered'
      },
      unreadCount: 0,
      isOnline: true
    },
    {
      id: 'channel-3',
      name: 'Dispatch Center',
      type: 'group',
      participants: ['user-1', 'user-5', 'user-6'],
      lastMessage: {
        id: 'msg-3',
        senderId: 'user-5',
        senderName: 'Mike Davis',
        content: 'New urgent job assigned',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'text',
        status: 'sent'
      },
      unreadCount: 1
    }
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      senderId: 'user-2',
      senderName: 'Sarah Johnson',
      content: 'Good morning team! Ready for today\'s operations',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-2',
      senderId: 'user-1',
      senderName: 'You',
      content: 'Morning! All vehicles are ready to go',
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-3',
      senderId: 'user-3',
      senderName: 'Alex Wilson',
      content: 'Vehicle V-001 showing maintenance alert',
      timestamp: new Date(Date.now() - 50 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-4',
      senderId: 'user-2',
      senderName: 'Sarah Johnson',
      content: 'Vehicle V-001 needs immediate attention',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'text',
      status: 'read'
    }
  ];

  const { data: channels = mockChannels } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: async () => {
      // In real implementation, fetch from Supabase
      return mockChannels;
    }
  });

  const { data: messages = mockMessages } = useQuery({
    queryKey: ['chat-messages', selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return [];
      // In real implementation, fetch messages for specific channel
      return mockMessages;
    },
    enabled: !!selectedChannel
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; channelId: string }) => {
      // In real implementation, send message to Supabase
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'user-1',
        senderName: 'You',
        content: messageData.content,
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };
      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel] });
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      setMessageInput('');
    }
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannel) return;
    
    sendMessageMutation.mutate({
      content: messageInput,
      channelId: selectedChannel
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Simulate real-time presence
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
        users.forEach(user => {
          if (Math.random() > 0.3) {
            newSet.add(user);
          } else {
            newSet.delete(user);
          }
        });
        return newSet;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Circle className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white">
      {/* Channels Sidebar */}
      <div className="w-80 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Messages
          </h3>
        </div>
        
        <ScrollArea className="h-[calc(600px-65px)]">
          <div className="p-2">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChannel === channel.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {channel.type === 'group' ? (
                        <MessageCircle className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {channel.type === 'direct' && channel.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{channel.name}</p>
                    {channel.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {channel.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {channel.lastMessage && (
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-gray-600 truncate">
                        {channel.lastMessage.senderName}: {channel.lastMessage.content}
                      </p>
                      <span className="text-xs text-gray-400">
                        {channel.lastMessage.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedChannelData?.type === 'group' ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{selectedChannelData?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedChannelData?.type === 'group' ? 
                      `${selectedChannelData.participants.length} members` :
                      selectedChannelData?.isOnline ? 'Online' : 'Offline'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'user-1' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${
                      message.senderId === 'user-1' ? 'order-2' : 'order-1'
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.senderId === 'user-1' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.senderId !== 'user-1' && (
                          <p className="text-xs font-medium mb-1 text-gray-600">
                            {message.senderName}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${
                        message.senderId === 'user-1' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.senderId === 'user-1' && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
