// Static class names per palette slot (Tailwind must see literal strings).
export const TONE_TILE = {
  c1: "bg-c1/16 text-c1",
  c2: "bg-c2/16 text-c2",
  c3: "bg-c3/16 text-c3",
  c4: "bg-c4/16 text-c4",
  c5: "bg-c5/16 text-c5",
  c6: "bg-c6/16 text-c6",
  c7: "bg-c7/16 text-c7",
  transfer: "bg-transfer/16 text-transfer",
};

// Title, meta line and icon for an entry, joined with the cached accounts/categories lookups.
export function describeTransaction(tx, { accountsById, categoriesById }) {
  const account = accountsById.get(tx.accountId);
  if (tx.type === "transfer") {
    const to = accountsById.get(tx.toAccountId);
    return {
      title: tx.note || "Transfer",
      meta: `${account?.name ?? "Account"} to ${to?.name ?? "account"}`,
      icon: "transfer",
      tone: "transfer",
    };
  }
  const category = categoriesById.get(tx.categoryId);
  return {
    title: tx.note || category?.name || (tx.type === "income" ? "Income" : "Expense"),
    meta: [category?.name, account?.name].filter(Boolean).join(" · "),
    icon: category?.icon ?? "other",
    tone: category?.color ?? "c3",
  };
}
