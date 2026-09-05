import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Megaphone, FileText, AlertTriangle, CheckCircle2, Clock, PlusCircle } from 'lucide-react';

const mockOcorrencias = [
  { id: '1', titulo: 'Barulho no 5º andar após 22h', data: '12/10/2026', status: 'Pendente', urgencia: 'Alta' },
  { id: '2', titulo: 'Vazamento na garagem', data: '11/10/2026', status: 'Em Análise', urgencia: 'Média' },
  { id: '3', titulo: 'Lâmpada queimada no hall', data: '10/10/2026', status: 'Resolvido', urgencia: 'Baixa' },
];

const mockAvisos = [
  { id: '1', titulo: 'Manutenção do Elevador', data: '15/10/2026', mensagem: 'O elevador social passará por manutenção preventiva das 10h às 14h.' },
  { id: '2', titulo: 'Assembleia Geral', data: '20/10/2026', mensagem: 'Reunião ordinária para prestação de contas no salão de festas às 19h.' },
];

export default function DashboardView() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Acompanhe as ocorrências e avisos do condomínio.</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Ocorrência
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ocorrencias" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="ocorrencias" className="data-[state=active]:text-indigo-700">
              <FileText className="mr-2 h-4 w-4" />
              Ocorrências
            </TabsTrigger>
            <TabsTrigger value="avisos" className="data-[state=active]:text-amber-700">
              <Megaphone className="mr-2 h-4 w-4" />
              Mural de Avisos
            </TabsTrigger>
          </TabsList>

          {/* Ocorrencias Tab */}
          <TabsContent value="ocorrencias" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
                <CardTitle className="text-lg font-medium text-slate-800">Livro de Registros</CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white rounded-b-xl">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Urgência</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOcorrencias.map((ocorrencia) => (
                      <TableRow key={ocorrencia.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-700">{ocorrencia.titulo}</TableCell>
                        <TableCell className="text-slate-500">{ocorrencia.data}</TableCell>
                        <TableCell>
                          {ocorrencia.urgencia === 'Alta' && (
                            <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 shadow-none">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Alta
                            </Badge>
                          )}
                          {ocorrencia.urgencia === 'Média' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none">
                              Média
                            </Badge>
                          )}
                          {ocorrencia.urgencia === 'Baixa' && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-none">
                              Baixa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {ocorrencia.status === 'Pendente' && (
                            <span className="inline-flex items-center text-sm text-slate-500">
                              <Clock className="mr-1.5 h-4 w-4" /> {ocorrencia.status}
                            </span>
                          )}
                          {ocorrencia.status === 'Resolvido' && (
                            <span className="inline-flex items-center text-sm text-emerald-600">
                              <CheckCircle2 className="mr-1.5 h-4 w-4" /> {ocorrencia.status}
                            </span>
                          )}
                          {ocorrencia.status === 'Em Análise' && (
                            <span className="inline-flex items-center text-sm text-indigo-600">
                              <Clock className="mr-1.5 h-4 w-4" /> {ocorrencia.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avisos Tab */}
          <TabsContent value="avisos" className="mt-6 space-y-4">
            {mockAvisos.map((aviso) => (
              <Card key={aviso.id} className="border-l-4 border-l-amber-500 shadow-sm border-y-0 border-r-0 rounded-r-xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-slate-800">{aviso.titulo}</CardTitle>
                    <span className="text-xs font-medium text-slate-400">{aviso.data}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{aviso.mensagem}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
