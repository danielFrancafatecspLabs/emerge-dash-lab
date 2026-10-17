export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userLab: string
  userAvatar: string
  text: string
  createdAt: string
}

export interface ChatPresence {
  userId: string
  userName: string
  userLab: string
  lastSeen: string
}