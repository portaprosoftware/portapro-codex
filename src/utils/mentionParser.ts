/**
 * Utility for parsing @mentions from text
 */

export interface MentionedUser {
  userId: string;
  username: string;
}

/**
 * Parse @mentions from text
 * Supports formats: @username, @user.name, @user_name
 * Returns array of unique usernames mentioned
 */
export function parseUserMentions(text: string): string[] {
  if (!text) return [];
  
  // Match @username pattern (alphanumeric, dots, underscores, hyphens)
  const mentionRegex = /@([\w.-]+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }
  
  return mentions;
}

/**
 * Check if text contains any @mentions
 */
export function hasMentions(text: string): boolean {
  return /@[\w.-]+/.test(text);
}

/**
 * Highlight @mentions in text with HTML markup
 */
export function highlightMentions(text: string): string {
  return text.replace(/@([\w.-]+)/g, '<span class="mention">@$1</span>');
}
