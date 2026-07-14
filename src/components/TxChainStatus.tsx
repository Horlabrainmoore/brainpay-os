import { Badge } from "@/components/ui/badge";
import { useTxStatus } from "@/hooks/useTxStatus";
import { Loader2 } from "lucide-react";

/**
 * Live mempool → confirmed status badge for a Bitcoin txid.
 * Polls every 20s (mempool) or 2m (confirmed).
 */
export function TxChainStatus({ txid }: { txid: string }) {
  const { data, isLoading, isError } = useTxStatus(txid);

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> checking
      </Badge>
    );
  }
  if (isError || !data) {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
        unknown
      </Badge>
    );
  }
  if (!data.confirmed) {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-warning text-warning">
        mempool
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">
      {data.confirmations.toLocaleString()} conf
    </Badge>
  );
}
