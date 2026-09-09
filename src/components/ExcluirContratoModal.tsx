import React from 'react';
import { ContratoVigente } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ExcluirContratoModalProps {
  isOpen: boolean;
  contrato: ContratoVigente | null;
  excluindo: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export const ExcluirContratoModal: React.FC<ExcluirContratoModalProps> = ({
  isOpen,
  contrato,
  excluindo,
  onClose,
  onConfirmar
}) => {
  if (!isOpen || !contrato) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
        
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={excluindo}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Excluir Contrato Vigente?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Tem certeza de que deseja excluir permanentemente o contrato abaixo da Base Vigente GAD? Esta ação registrará o evento na auditoria do sistema.
          </p>
        </div>

        {/* Card Resumo do Contrato */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {contrato.numeroContrato}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
              #{contrato.numero}
            </span>
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
            {contrato.empresa}
          </p>
          {contrato.objeto && (
            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
              {contrato.objeto}
            </p>
          )}
          {contrato.gestor && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              Gestor: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato.gestor}</span>
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={excluindo}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={excluindo}
            onClick={onConfirmar}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{excluindo ? 'Excluindo...' : 'Sim, Excluir Contrato'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
