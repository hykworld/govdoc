import { ScheduleItem } from '../types';

export function downloadIcsCalendar(title: string, schedules: ScheduleItem[]) {
  if (!schedules || schedules.length === 0) return;

  const now = new Date();
  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GovDoc AI//Document Analyzer KR//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  schedules.forEach((item, index) => {
    // Attempt basic parsing of year-month-day
    const dateMatch = item.date.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    let startDate: Date;
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      startDate = new Date(year, month, day, 9, 0, 0);
    } else {
      startDate = new Date(now.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
    }

    const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:govdoc-${Date.now()}-${index}@govdoc.kr`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:[${title}] ${item.phase}`,
      `DESCRIPTION:${item.phase} - ${item.date} ${item.note ? `\\n비고: ${item.note}` : ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[\/\\?%*:|"<>]/g, '_')}_일정.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createGoogleCalendarUrl(title: string, schedule: ScheduleItem): string {
  const dateMatch = schedule.date.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  let dateStr = '';
  if (dateMatch) {
    const y = dateMatch[1];
    const m = dateMatch[2].padStart(2, '0');
    const d = dateMatch[3].padStart(2, '0');
    dateStr = `${y}${m}${d}T090000/${y}${m}${d}T180000`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[공고일정] ${title} - ${schedule.phase}`,
    details: `${schedule.phase}: ${schedule.date} ${schedule.note ? `(${schedule.note})` : ''}\n출처: 대한민국 공공정책·LH공고 수석 문서 분석기`,
  });

  if (dateStr) {
    params.set('dates', dateStr);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
