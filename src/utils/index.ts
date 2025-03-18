export const calculateDaysRemaining = (endDate: string): number => {
  const timeDifference = new Date(endDate).getTime() - new Date().getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number): string => {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "RUB",
  };

  const numberFormat = new Intl.NumberFormat("ru-RU", options);
  return numberFormat.format(amount);
};
