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

export const minutesToDays = (minutes: number): number => {
    return minutes / 60.0 / 24.0;
};
