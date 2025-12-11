import { transactionsConfig } from '@/lib/config';
import { Select, SelectItem } from '@heroui/react';

export default function SelectTransaction({
  label,
  placeholder,
  transactionType,
  setTransactionType,
}: {
  label?: string;
  placeholder?: string;
  transactionType: string;
  setTransactionType: (value: string) => void;
}) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={[transactionType]}
      onSelectionChange={(keys) => setTransactionType(Array.from(keys)[0] as string)}
      className="w-full"
      size="lg"
      variant="bordered"
      radius="full"
      aria-label="Sélectionner le type de transaction"
    >
      <SelectItem key="">Tous</SelectItem>
      <>
        {transactionsConfig.map((transaction) => (
          <SelectItem key={transaction.value}>{transaction.label}</SelectItem>
        ))}
      </>
    </Select>
  );
}
