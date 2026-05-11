import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, Pedro</h1>
      <p className="text-sm text-muted-foreground">
        Visão geral da oficina (placeholder Sprint 0).
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>OS abertas</CardTitle>
            <CardDescription>Sprint 1</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>A receber</CardTitle>
            <CardDescription>Sprint 2</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agendados hoje</CardTitle>
            <CardDescription>Sprint 4</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
      </div>
    </div>
  );
}
