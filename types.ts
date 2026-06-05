
export interface TeamTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'news' | 'quote' | 'match' | 'minimal';
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface PostState {
  width: number;
  height: number;
  urgentText: string;
  quoteText: string;
  bgImage: string | null;
  bgTransform: ImageTransform;
  playerImage: string | null;
  playerTransform: ImageTransform;
  logoImage: string | null;
  logoPos: { x: number; y: number };
  logoSize: number;
  theme: TeamTheme;
  quoteTextStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    alignment: 'right' | 'center' | 'left';
    fontWeight: string;
    shadow: boolean;
  };
}

export interface AISuggestion {
  quoteTextSize: number;
  primaryColor: string;
  fontFamily: string;
}
