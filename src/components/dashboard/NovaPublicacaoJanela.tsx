/* eslint-disable quality/max-lines, import-x/no-restricted-paths, max-lines-per-function, complexity, quality/no-direct-console, max-statements */ // FIXME: D�vida t�cnica (Quarentena)
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  ArrowLeft,
  Users,
  Building2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Check,
  Eye,
  Send,
  AlertTriangle,
  RotateCcw,
  Wand2,
  Loader2,
} from 'lucide-react';
import {
  refinarComunicadoComIA,
  TOMS_CONFIG,
  type TomComunicado,
  type CategoriaComunicado,
  type SugestaoComunicado,
} from '@/lib/ai-comunicado';
import type { AvisoData } from '@/lib/firestore';

export interface NovaPublicacaoJanelaProps {
  onVoltar: () => void;
  onSave: (dados: Omit<AvisoData, 'id'>, avisoId?: string) => Promise<void>;
  availableTorres: string[];
  condominioId: string;
  criadoPorNome: string;
  criadoPorUid: string;
  initialData?: AvisoData | null;
}

const CATEGORIAS: { id: CategoriaComunicado; label: string; cor: string }[] = [
  { id: 'Geral', label: 'Geral', cor: 'border-slate-300 text-slate-700 hover:bg-slate-50' },
  { id: 'Manutenção', label: 'Manutenção', cor: 'border-amber-300 text-amber-800 hover:bg-amber-50' },
  { id: 'Assembleia', label: 'Assembleia', cor: 'border-indigo-300 text-indigo-800 hover:bg-indigo-50' },
  { id: 'Segurança', label: 'Segurança', cor: 'border-rose-300 text-rose-800 hover:bg-rose-50' },
  { id: 'Convivência', label: 'Convivência', cor: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50' },
];

const TONS_ICONES: Record<TomComunicado, { icon: string; corBorda: string }> = {
  formal: { icon: '🏛️', corBorda: 'border-slate-300' },
  educativo: { icon: '🤝', corBorda: 'border-emerald-300' },
  firme: { icon: '⚠️', corBorda: 'border-amber-300' },
  direto: { icon: '⚡', corBorda: 'border-blue-300' },
  acolhedor: { icon: '💚', corBorda: 'border-pink-300' },
};

const ETAPAS_REFINAMENTO_IA = [
  {
    titulo: 'Análise estrutural e contexto',
    descricao: 'Identificando tópicos centrais e objetivo da publicação',
  },
  {
    titulo: 'Calibragem de tom condominial',
    descricao: 'Ajustando estilo e vocabulário ao tom selecionado',
  },
  {
    titulo: 'Revisão gramatical e clareza',
    descricao: 'Lapidando concordância, pontuação e eliminação de ambiguidades',
  },
  {
    titulo: 'Estruturação do título e encerramento',
    descricao: 'Finalizando parágrafos para leitura ágil no app e mural',
  },
];

export function NovaPublicacaoJanela({
  onVoltar,
  onSave,
  availableTorres,
  condominioId,
  criadoPorNome,
  criadoPorUid,
  initialData,
}: NovaPublicacaoJanelaProps) {
  const isEditing = Boolean(initialData?.id);
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [categoria, setCategoria] = useState<CategoriaComunicado>(
    (initialData?.categoria as CategoriaComunicado) || 'Geral'
  );
  const [mensagem, setMensagem] = useState(initialData?.mensagem || '');
  const [destinatarioTipo, setDestinatarioTipo] = useState<'todos' | 'bloco'>(
    initialData?.destinatarioTipo || 'todos'
  );
  const [blocoDestino, setBlocoDestino] = useState(
    initialData?.blocoDestino || availableTorres[0] || ''
  );
  const [tom, setTom] = useState<TomComunicado>('formal');

  // Estado da IA
  const [gerandoSugestao, setGerandoSugestao] = useState(false);
  const [etapaIA, setEtapaIA] = useState<number>(0);
  const [sugestao, setSugestao] = useState<SugestaoComunicado | null>(null);
  const [sugestaoFeedback, setSugestaoFeedback] = useState('');
  const [rascunhoOriginalSalvo, setRascunhoOriginalSalvo] = useState<{ titulo: string; mensagem: string } | null>(null);
  const painelDireitoRef = useRef<HTMLDivElement>(null);

  // Estado de envio
  const [formError, setFormError] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleGerarSugestaoIA = async () => {
    if (!titulo.trim() && !mensagem.trim()) {
      setFormError('Por favor, digite ao menos o assunto no título ou um rascunho da mensagem para a IA.');
      return;
    }
    setFormError('');
    setSugestaoFeedback('');
    setGerandoSugestao(true);
    setEtapaIA(0);

    // Auto-scroll para o painel em telas menores para a usuária ver o progresso
    if (window.innerWidth < 1024 && painelDireitoRef.current) {
      setTimeout(() => {
        painelDireitoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    // Timer de progressão suave das etapas de refinamento
    const stepInterval = setInterval(() => {
      setEtapaIA((prev) => (prev < 3 ? prev + 1 : prev));
    }, 650);

    try {
      // Salva o rascunho original para permitir desfazer se a síndica quiser
      if (!rascunhoOriginalSalvo) {
        setRascunhoOriginalSalvo({ titulo, mensagem });
      }

      const res = await refinarComunicadoComIA({
        titulo,
        categoria,
        mensagem,
        tom,
      });
      clearInterval(stepInterval);
      setEtapaIA(3);
      setSugestao(res);
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Erro ao refinar comunicado:', err);
      setFormError('Não foi possível gerar a sugestão da IA neste momento. Tente novamente.');
    } finally {
      clearInterval(stepInterval);
      setGerandoSugestao(false);
    }
  };

  const handleAplicarSugestaoIA = () => {
    if (!sugestao) return;
    setTitulo(sugestao.tituloSugerido);
    setMensagem(sugestao.mensagemSugerida);
    setSugestaoFeedback('Texto da IA aplicado com sucesso aos campos de publicação!');
    setSugestao(null);
  };

  const handleRestaurarRascunho = () => {
    if (rascunhoOriginalSalvo) {
      setTitulo(rascunhoOriginalSalvo.titulo);
      setMensagem(rascunhoOriginalSalvo.mensagem);
      setSugestaoFeedback('Rascunho original restaurado.');
      setSugestao(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('Por favor, informe o título do comunicado.');
      return;
    }
    if (!mensagem.trim()) {
      setFormError('Por favor, preencha o conteúdo da mensagem.');
      return;
    }
    if (destinatarioTipo === 'bloco' && !blocoDestino.trim()) {
      setFormError('Por favor, selecione qual bloco receberá o comunicado.');
      return;
    }

    setSalvando(true);
    setFormError('');

    try {
      // Cria payload garantindo ausência de propriedades com valor undefined
      const payload: Omit<AvisoData, 'id'> = {
        condominioId,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        categoria,
        destinatarioTipo,
        criadoPorNome: criadoPorNome || 'Síndica',
        criadoPorUid,
      };

      if (destinatarioTipo === 'bloco' && blocoDestino.trim()) {
        payload.blocoDestino = blocoDestino.trim();
      }

      await onSave(payload, initialData?.id);
      onVoltar();
    } catch (err) {
      console.error('Erro ao publicar/atualizar comunicado:', err);
      setFormError(
        isEditing
          ? 'Falha ao salvar alterações no comunicado. Tente novamente.'
          : 'Falha ao publicar comunicado no Mural. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Barra Superior da Janela */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onVoltar}
            disabled={salvando}
            className="text-slate-300 hover:text-white hover:bg-slate-800 -ml-1 sm:-ml-2 cursor-pointer min-h-[44px] sm:min-h-[36px] px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5 shrink-0" />
            <span>Voltar ao Mural</span>
          </Button>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {isEditing ? 'Editar Comunicado Oficial' : 'Redigir Novo Comunicado'}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isEditing
                  ? 'Atualize os dados e o direcionamento do aviso aos moradores'
                  : 'Ambiente de redação com calibração inteligente de tom'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {rascunhoOriginalSalvo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestaurarRascunho}
              className="text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-none"
              title="Restaurar o rascunho anterior à sugestão da IA"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              <span>Desfazer</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={salvando || !titulo.trim() || !mensagem.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold min-h-[44px] sm:min-h-[36px] px-4 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
          >
            {salvando ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{isEditing ? 'Salvando...' : 'Publicando...'}</span>
              </>
            ) : (
              <>
                {isEditing ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                <span>{isEditing ? 'Salvar' : 'Publicar no Mural'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas de Erro ou Feedback */}
      {formError && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {sugestaoFeedback && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{sugestaoFeedback}</span>
        </div>
      )}

      {/* Corpo da Janela: 2 Colunas Lado a Lado (Desktop) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1 (7 colunas): Área de Escrita e Controles */}
        <div className="lg:col-span-7 space-y-6">
          {/* Passo 1: Destinatários e Categoria */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Destinatários do Comunicado</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestinatarioTipo('todos')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  destinatarioTipo === 'todos'
                    ? 'border-indigo-600 bg-white text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white/60 hover:bg-white text-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  destinatarioTipo === 'todos' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Todos os Moradores</p>
                  <p className="text-[11px] text-slate-500">Todo o condomínio</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDestinatarioTipo('bloco');
                  if (!blocoDestino && availableTorres.length > 0) {
                    setBlocoDestino(availableTorres[0]);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  destinatarioTipo === 'bloco'
                    ? 'border-indigo-600 bg-white text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white/60 hover:bg-white text-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  destinatarioTipo === 'bloco' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Bloco Específico</p>
                  <p className="text-[11px] text-slate-500">Segmentado por torre</p>
                </div>
              </button>
            </div>

            {destinatarioTipo === 'bloco' && (
              <div className="pt-2 border-t border-slate-200/60 animate-in fade-in-50 duration-150">
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Selecione o Bloco:</Label>
                {availableTorres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTorres.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBlocoDestino(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                          blocoDestino === t
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">Nenhum bloco cadastrado no condomínio.</p>
                )}
              </div>
            )}
          </div>

          {/* Passo 2: Categoria em Pills */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Categoria do Comunicado</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    categoria === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Passo 3: Título e Mensagem */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Título do Aviso</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Manutenção na Caixa d'Água amanhã"
                className="text-base sm:text-sm font-semibold text-slate-900 border-slate-200 focus:ring-2 focus:ring-indigo-500 h-11 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  4. Conteúdo da Mensagem (ou Rascunho)
                </Label>
                <span className="text-[11px] text-slate-400">
                  {mensagem.length} caracteres
                </span>
              </div>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva livremente o que você precisa comunicar. Não se preocupe se tiver erros de digitação ou informalidade, a IA pode refinar e corrigir tudo no tom desejado..."
                rows={6}
                className="w-full text-base sm:text-sm border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Passo 4: Assistente de Calibração de Tom com IA */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/30 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950">Assistente de Tom & IA</span>
              </div>
              <span className="text-[11px] text-indigo-900/70">
                Escolha o tom desejado e clique em refinar
              </span>
            </div>

            {/* Grid de 5 Tons com Botões Elegantes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(TOMS_CONFIG) as TomComunicado[]).map((t) => {
                const conf = TOMS_CONFIG[t];
                const icone = TONS_ICONES[t];
                const isSelected = tom === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTom(t)}
                    className={`p-2.5 sm:p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[52px] sm:min-h-auto ${
                      isSelected
                        ? 'border-indigo-600 bg-white text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                    }`}
                  >
                    <span className="text-base leading-none">{icone.icon}</span>
                    <span className="text-[11px] leading-tight">{conf.badge}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <strong>{TOMS_CONFIG[tom].label}:</strong> {TOMS_CONFIG[tom].descricao}
            </p>

            <div className="flex items-center justify-end pt-1">
              <Button
                type="button"
                onClick={handleGerarSugestaoIA}
                disabled={gerandoSugestao || (!titulo.trim() && !mensagem.trim())}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs min-h-[44px] sm:min-h-[36px] w-full sm:w-auto px-4 shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {gerandoSugestao ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Aprimorando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Aprimorar Redação com IA</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Coluna 2 (5 colunas): Painel de Prévia em Tempo Real & Comparativo da IA */}
        <div ref={painelDireitoRef} className="lg:col-span-5 space-y-4">
          {/* Tela de Loading Explicativo da IA */}
          {gerandoSugestao ? (
            <div className="bg-gradient-to-b from-indigo-50/80 via-white to-indigo-50/30 rounded-xl border-2 border-indigo-300/80 p-5 space-y-5 shadow-sm animate-in fade-in-50 duration-200">
              {/* Cabeçalho do Loading */}
              <div className="space-y-3 border-b border-indigo-100 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white text-[11px] font-semibold px-2.5 py-0.5 flex items-center gap-1.5 shadow-xs">
                      <Sparkles className="h-3 w-3 animate-spin" />
                      <span>Processando Redação com IA</span>
                    </Badge>
                    <span className="text-xs font-medium text-indigo-950 hidden sm:inline">
                      Tom: {TOMS_CONFIG[tom].label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">
                    {etapaIA === 0 ? '25%' : etapaIA === 1 ? '50%' : etapaIA === 2 ? '75%' : '95%'}
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${etapaIA === 0 ? 25 : etapaIA === 1 ? 50 : etapaIA === 2 ? 75 : 95}%`,
                    }}
                  />
                </div>
              </div>

              {/* Etapas Visuais com Status em Tempo Real */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Etapas de Refinamento:
                </span>
                <div className="space-y-2">
                  {ETAPAS_REFINAMENTO_IA.map((etapa, idx) => {
                    const isConcluida = idx < etapaIA;
                    const isAtiva = idx === etapaIA;

                    return (
                      <div
                        key={etapa.titulo}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-300 ${
                          isAtiva
                            ? 'bg-indigo-50/90 border-indigo-300 shadow-xs'
                            : isConcluida
                            ? 'bg-white/80 border-emerald-200'
                            : 'bg-white/40 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isConcluida ? (
                            <div className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-emerald-100">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          ) : isAtiva ? (
                            <div className="h-4.5 w-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-indigo-200 animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin" />
                            </div>
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full bg-slate-100 border border-slate-300 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-xs ${
                                isAtiva
                                  ? 'text-indigo-950 font-bold'
                                  : isConcluida
                                  ? 'text-slate-800 font-medium'
                                  : 'text-slate-500'
                              }`}
                            >
                              {etapa.titulo}
                            </p>
                            {isAtiva && (
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/80 px-1.5 py-0.5 rounded-full">
                                Em andamento...
                              </span>
                            )}
                            {isConcluida && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Concluído
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {etapa.descricao}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Esqueleto Animado Shimmer simulando a montagem */}
              <div className="p-3.5 bg-white rounded-lg border border-indigo-100/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    Redigindo estrutura da publicação...
                  </span>
                  <span className="text-[10px] text-slate-400">Tempo estimado: ~2s</span>
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-indigo-100/70 rounded-md animate-pulse w-3/4" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </div>

              {/* Rodapé explicativo */}
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                A IA preserva a essência das informações que você digitou e adapta os termos para a melhor comunicação com os moradores.
              </p>
            </div>
          ) : sugestao ? (
            <div className="bg-indigo-50/40 rounded-xl border-2 border-indigo-300 p-4 space-y-4 shadow-sm animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-indigo-600 text-white text-[10px]">Sugestão Pronta</Badge>
                  <span className="text-xs font-semibold text-indigo-950">Tom: {TOMS_CONFIG[tom].label}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Título Sugerido:</span>
                <p className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-xs">
                  {sugestao.tituloSugerido}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mensagem Reescrita:</span>
                <div className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-indigo-100 shadow-xs whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                  {sugestao.mensagemSugerida}
                </div>
              </div>

              {sugestao.justificativaTom && (
                <p className="text-[11px] text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <strong>Adequação:</strong> {sugestao.justificativaTom}
                </p>
              )}

              {sugestao.avisoOrigem && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{sugestao.avisoOrigem}</span>
                </div>
              )}

              {/* Botões de Ação na Sugestão */}
              <div className="pt-2 flex flex-col gap-2 border-t border-indigo-200">
                <Button
                  type="button"
                  onClick={handleAplicarSugestaoIA}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 w-full shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Aplicar Esta Sugestão ao Comunicado</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSugestao(null)}
                  className="text-xs text-slate-600 bg-white hover:bg-slate-100 cursor-pointer h-8"
                >
                  Manter meu rascunho como está
                </Button>
              </div>
            </div>
          ) : (
            /* Prévia em Tempo Real de como o morador verá no mural */
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-slate-600 border-b border-slate-200 pb-2">
                <Eye className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Prévia em Tempo Real (Visão do Morador)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                    {categoria}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {destinatarioTipo === 'bloco' ? `Exclusivo: ${blocoDestino || 'Bloco'}` : 'Todos os Moradores'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {titulo.trim() || 'Título do comunicado aparecerá aqui...'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {mensagem.trim() || 'O conteúdo completo da sua publicação será exibido aqui para os moradores com formatação e parágrafos estruturados.'}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Por: <strong>{criadoPorNome || 'Síndica'}</strong></span>
                  <span>Agora</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Dica de Praticidade:
                </p>
                <p className="text-slate-600">
                  Você pode rascunhar apenas tópicos ou frases curtas. Clique em <strong>"Aprimorar Redação com IA"</strong> para transformar em um comunicado formal e bem redigido em segundos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
