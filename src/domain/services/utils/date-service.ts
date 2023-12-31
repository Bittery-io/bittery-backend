import dayjs from 'dayjs';

export const formatDateWithTime = (date: number): string => {
    return dayjs(date).format('DD-MM-YYYY HH:mm:ss');
};

export const formatDateWithTime2 = (date: number): string => {
    return dayjs(date).format('DD-MM-YYYY-HH:mm:ss');
};

export const addMinutes = (date: number, minutes: number): number => {
    return dayjs(date).add(minutes, 'minute').valueOf();
};

export const minusDays = (date: number, days: number): number => {
    return dayjs(date).subtract(days, 'day').valueOf();
};

export const addDays = (date: number, days: number): number => {
    return dayjs(date).add(days, 'day').valueOf();
};

export const addHoursGetDate = (date: number, hours: number): number => {
    return dayjs(date).add(hours, 'hour').valueOf();
};

export const getDifferenceInMilliseconds = (date1: number, date2: number): number => {
    return dayjs(date1).diff(dayjs(date2));
};

export const minusDaysGetDay = (date: number, minusDays: number): number => {
    return dayjs(date).subtract(minusDays, 'day').date();
};

export const minusDaysGetMonth = (date: number, minusDays: number): number => {
    return dayjs(date).subtract(minusDays, 'day').month();
};

// this return today 23:59:59 epoch
export const getEpochLastSecondOfToday = (): number => {
    const date = new Date();
    // here i set 23:59:59 but it's local time
    // so getting timestamp epoch will return me 21:59 but
    // but for my use cases it's oke because invoices are saved also
    // in local time so last saved invoice will be saved 21:59
    date.setHours(23, 59, 59, 999);
    return date.getTime();
};

export const minutesToDays = (minutes: number): number => {
    return minutes / 60.0 / 24.0;
};

export const nowepoch = () => {
    return dayjs().toDate().getTime();
};

export const isFirstDateAfterSecond = (firstDate: number, secondDate: number) => {
    return firstDate > secondDate;
};

export const addMonthsToDate = (date: number, months: number): number => {
    return dayjs(date).add(months, 'month').valueOf();
};

export const isNowPlusGivenDaysAfterGivenDate = (date: number, days: number): boolean => {
    return !dayjs().add(days, 'day').isBefore(dayjs(date));
};

export const getDaysBetween = (dateFrom: number, dateTo: number): number => {
    return dayjs(dateFrom).diff(dayjs(dateTo), 'day');
};

export const getHoursBetween = (dateFrom: number, dateTo: number): number => {
    return dayjs(dateFrom).diff(dayjs(dateTo), 'hour');
};

export const getMinutesBetween = (dateFrom: number, dateTo: number): number => {
    return dayjs(dateFrom).diff(dayjs(dateTo), 'minute');
};
