export const calculateDaysRemaining = (endDate: string) => {
  const timeDifference = new Date(endDate).getTime() - new Date().getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};
