export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorLab: string
  authorAvatar: string
  content: string
  linkUrl: string
  createdAt: string
  likes: string[] // array of userIds
}