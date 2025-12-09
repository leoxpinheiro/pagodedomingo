import React from 'react';
import { AppState } from '../types';
import { UploadCloud, FileText } from 'lucide-react';

interface Props {
  data: AppState;
}

const Archives: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Arquivo Digital</h2>
           <p className="text-slate-500 text-sm">Comprovantes e recibos armazenados.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
          <UploadCloud className="w-4 h-4" /> Upload Recibo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Upload Placeholder Card */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer min-h-[160px]">
           <UploadCloud className="w-8 h-8 mb-2" />
           <span className="text-xs font-medium">Solte arquivos aqui</span>
        </div>

        {/* Mock Files */}
        {data.receipts.map(receipt => (
          <div key={receipt.id} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
               {receipt.imageUrl ? (
                 <img src={receipt.imageUrl} alt="Recibo" className="w-full h-full object-cover" />
               ) : (
                 <FileText className="w-8 h-8 text-slate-300" />
               )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-800 truncate">{receipt.description}</p>
              <div className="flex justify-between items-center mt-1">
                 <span className="text-xs text-slate-500">{new Date(receipt.date).toLocaleDateString('pt-BR')}</span>
                 <span className="text-xs font-bold text-slate-700">R$ {receipt.amount}</span>
              </div>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm uppercase">
               {receipt.type === 'manual' ? 'Manual' : 'Foto'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Archives;