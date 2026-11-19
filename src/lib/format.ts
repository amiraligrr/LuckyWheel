import type { Language } from "../types";

const localeFor = (language: Language) => (language === "fa" ? "fa-IR" : "en-US");

export function formatNumber(
  value: number,
  language: Language,
  maximumFractionDigits = 1,
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatWeight(value: number, language: Language): string {
  return formatNumber(value, language, 2);
}

export function formatPercent(value: number, language: Language): string {
  if (!Number.isFinite(value) || value <= 0) {
    return language === "fa" ? "۰٪" : "0%";
  }
  if (value < 0.1) {
    return language === "fa" ? "کمتر از ۰٫۱٪" : "<0.1%";
  }
  const digits = Number.isInteger(value) || value >= 10 ? 0 : 1;
  const number = formatNumber(value, language, digits);
  return language === "fa" ? `${number}٪` : `${number}%`;
}

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatDay(timestamp: number, language: Language): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(timestamp));
}

export function formatTime(timestamp: number, language: Language): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function isToday(timestamp: number): boolean {
  return dayKey(timestamp) === dayKey(Date.now());
}

export function isYesterday(timestamp: number): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dayKey(timestamp) === dayKey(yesterday.getTime());
}
