import { Badge } from "@/components/ui/badge";
import { STATUS_COLOR, STATUS_LABEL, type AgendaStatus } from "../types";

interface Props {
  status: AgendaStatus;
}

export function AgendaStatusBadge({ status }: Props) {
  return (
    <Badge variant={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
  );
}
