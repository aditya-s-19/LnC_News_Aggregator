export class ArticleResponseDto {
  id: number;
  headline: string;
  description: string;
  source: string;
  url: string;
  published_at: Date;
  category_id: number | null;
  isSaved: boolean;
  reaction_id: number | null;
}
