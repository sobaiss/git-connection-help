export default function DisplayDate({ date }: { date: string }) {
  const inputDate = new Date(date);
  const now = new Date();
  if (isNaN(inputDate.getTime())) {
    return <></>;
  }

  // Reset time to midnight for date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const inputDateOnly = new Date(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate()
  );

  // Format time as HH:MM
  const hours = inputDate.getHours().toString().padStart(2, '0');
  const minutes = inputDate.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  // Check if date is today
  if (inputDateOnly.getTime() === today.getTime()) {
    return <>Aujourd&apos;hui à {timeString}</>;
  }

  // Check if date is yesterday
  if (inputDateOnly.getTime() === yesterday.getTime()) {
    return <>Hier à {timeString}</>;
  }

  // Check if date is within the last 6 days (excluding today and yesterday)
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

  if (inputDateOnly > sixDaysAgo && inputDateOnly < yesterday) {
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = daysOfWeek[inputDate.getDay()];
    return (
      <>
        {dayName} dernier à {timeString}
      </>
    );
  }

  // Otherwise format as DD/MM/YYYY HH:MM
  const day = inputDate.getDate().toString().padStart(2, '0');
  const month = (inputDate.getMonth() + 1).toString().padStart(2, '0');
  const year = inputDate.getFullYear();

  return (
    <>
      {day}/{month}/{year} {timeString}
    </>
  );
}
