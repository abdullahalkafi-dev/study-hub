declare module "@silo/content" {
  export const START_DATE: string;
  export function getRoadmap(): { PHASES: { name: string; from: number; to: number }[]; W: string[][] };
  export function availableWeeks(): number[];
  export function getWeek(w: number): any[] | null;
  export function getDay(w: number, d: number): any | null;
}
