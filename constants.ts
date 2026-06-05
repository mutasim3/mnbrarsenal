
import { TeamTheme, PostTemplate } from './types';

export const TEAM_THEMES: TeamTheme[] = [
  { id: 'arsenal-home', name: 'أرسنال - أساسي', primary: '#EF0107', secondary: '#FFFFFF', accent: '#063672' },
  { id: 'arsenal-away', name: 'أرسنال - احتياطي', primary: '#000000', secondary: '#DBFE60', accent: '#EF0107' },
  { id: 'arsenal-third', name: 'أرسنال - ثالث', primary: '#79D8D3', secondary: '#412B58', accent: '#FFFFFF' },
  { id: 'arsenal-retro', name: 'أرسنال - كلاسيك', primary: '#9A1032', secondary: '#FFFFFF', accent: '#DBA111' }
];

export const URGENT_KEYWORDS = [
  'عاجل',
  'رسمياً',
  'فابريزيو رومانو',
  'ديفيد أورنستين',
  'سوق الانتقالات',
  'حصري',
  'بيان رسمي',
  'تحديث',
  'هنا نحن نذهب!'
];

export const TEMPLATES: PostTemplate[] = [
  { id: 'breaking', name: 'خبر عاجل', description: 'تصميم جريء للأخبار الهامة', layout: 'news' },
  { id: 'quote', name: 'تصريح لاعب', description: 'تركيز على صورة اللاعب والاقتباس', layout: 'quote' },
  { id: 'match', name: 'موعد مباراة', description: 'بطاقة تعريفية للمباريات القادمة', layout: 'match' },
  { id: 'minimal', name: 'بسيط', description: 'تصميم هادئ وعصري', layout: 'minimal' }
];

export const FONTS = ['Cairo', 'Tajawal', 'Almarai'];

export const INITIAL_STATE: any = {
  width: 1080,
  height: 1080,
  urgentText: 'عاجل',
  quoteText: 'هذا المكان مخصص لتصريح اللاعب أو تفاصيل الخبر المهمة التي تريد إبرازها بشكل مميز.',
  bgImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1080&auto=format&fit=crop',
  bgTransform: { x: 0, y: 0, scale: 1 },
  playerImage: null,
  playerTransform: { x: 0, y: 0, scale: 1 },
  logoImage: null,
  logoPos: { x: 500, y: 150 },
  logoSize: 150,
  theme: TEAM_THEMES[0],
  quoteTextStyle: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Cairo',
    alignment: 'right',
    fontWeight: '700',
    shadow: true,
  },
};
