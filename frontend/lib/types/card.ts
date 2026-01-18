export interface Card {
  id: string
  userId: string
  customName: string | null
  lastFourDigits: string | null
  createdAt: string
}

export interface UpdateCardDto {
  customName?: string
}
