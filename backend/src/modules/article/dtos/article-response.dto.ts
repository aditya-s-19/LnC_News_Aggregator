export class GetArticleByIdResponseDto {
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

export class GetArticlesResponseDto {
  id: number;
  headline: string;
  description: string;
}
