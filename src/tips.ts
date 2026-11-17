import data from "./data/tips.json";
export type Tip = (typeof data.tips)[number];
export const publishedTips = (): Tip[] => data.tips.filter((t) => t.status === "published");
export const tipsForTheme = (theme: string): Tip[] => publishedTips().filter((t) => t.themes.includes(theme));
