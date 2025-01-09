// Utility functions to simulate DWL functions
export const splitBy = (value: string, separator: string) => value?.split(separator);
export const contains = (arr: any[], value: any) => arr?.includes(value);
export const upper = (str: string) => str?.toUpperCase();
export const isEmpty = (value: any): boolean => {
    return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
};
export const substringAfterLast = (str: string, separator: string): string => {
    const index = str ? str.lastIndexOf(separator) : -1;
    return index !== -1 ? str.substring(index + 1) : str;
};
