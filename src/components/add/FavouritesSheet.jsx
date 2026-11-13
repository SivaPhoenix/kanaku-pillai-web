import { useFavourites } from "../../hooks/useLedger.js";
import { formatMoney } from "../../lib/money.js";
import { IconTile } from "../transaction/IconTile.jsx";
import { Alert, Button, Dialog, Spinner } from "../ui/index.js";

export function FavouritesSheet({ open, onClose, onPick, categoriesById, money }) {
  const { data, isLoading, isError, refetch } = useFavourites();
  return (
    <Dialog open={open} onClose={onClose} title="Favourites" size="sm">
      {isLoading ? (
        <Spinner className="m-4" />
      ) : isError ? (
        <Alert>
          <p>Could not load favourites.</p>
          <Button variant="hairline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </Alert>
      ) : !data?.length ? (
        <p className="py-4 text-[15px] text-text-muted">
          No favourites yet. Turn on Save as favourite when you add an entry.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((fav) => (
            <li key={fav.id}>
              <button
                type="button"
                onClick={() => onPick(fav)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl surface-l0 px-3 py-2.5 text-left"
              >
                <IconTile
                  icon={fav.icon}
                  tone={
                    fav.type === "transfer"
                      ? "transfer"
                      : (categoriesById.get(fav.categoryId)?.color ?? "c3")
                  }
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
                  {fav.title}
                </span>
                <span className="font-mono text-[15px] font-semibold whitespace-nowrap text-text">
                  {formatMoney(fav.amountMinor, { ...money, type: fav.type })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
