import dayjs from 'dayjs';

export const formatDateWithoutTime = (date: number): string => {
    return dayjs(date).format('DD-MM-YYYY');
};
