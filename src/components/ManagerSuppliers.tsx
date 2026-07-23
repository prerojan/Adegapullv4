import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, MessageSquare, ExternalLink, User, MoreVertical, X, Trash2 } from 'lucide-react';
import { Supplier } from '../types';

interface ManagerSuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (sup: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  theme: 'dark' | 'light';
}

export default function ManagerSuppliers({
  suppliers,
  onAddSupplier,
  onDeleteSupplier,
  theme
}: ManagerSuppliersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName) {
      alert('Favor preencher o Nome Fantasia e o Contato Comercial.');
      return;
    }

    const newSupplier: Supplier = {
      id: `s-${Date.now()}`,
      companyName,
      contactName,
      phone,
      whatsapp: whatsapp.replace(/\D/g, ''),
      email,
      notes
    };

    onAddSupplier(newSupplier);
    setShowModal(false);

    // Reset Form
    setCompanyName('');
    setContactName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setNotes('');
    alert('Fornecedor cadastrado com sucesso!');
  };

  const handleOpenWhatsApp = (num: string) => {
    const formatted = num.replace(/\D/g, '');
    const url = `https://wa.me/${formatted.startsWith('55') ? formatted : '55' + formatted}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Fornecedores</h2>
          <p className="text-xs text-gray-400">Contatos diretos de canais comerciais de distribuição e agendamentos de entrega.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
            theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
          }`}
        >
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex items-center gap-4 ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
      }`}>
        <div className={`relative flex items-center rounded-lg border px-3 py-2 w-full md:w-96 ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar distribuidora ou contato comercial..."
            className="w-full text-xs bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Suppliers Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => (
          <div
            key={sup.id}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-4 relative overflow-hidden transition-all hover:scale-[1.01] ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            {/* Upper supplier info */}
            <div>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-sm leading-snug">{sup.companyName}</h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                    <User className="w-3 h-3 text-gray-500" />
                    Contato: {sup.contactName}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    (window as any).confirmModal(`Tem certeza que deseja remover o fornecedor "${sup.companyName}"?`, () => {
                      onDeleteSupplier(sup.id);
                    });
                  }}
                  title="Remover Fornecedor"
                  className={`text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-lg ${
                    theme === 'dark' ? 'hover:bg-red-950/20' : 'hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {sup.notes && (
                <p className={`p-2 rounded mt-3 text-[10px] leading-relaxed border ${
                  theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {sup.notes}
                </p>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              {sup.whatsapp && (
                <button
                  onClick={() => handleOpenWhatsApp(sup.whatsapp)}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  WhatsApp
                </button>
              )}
              {sup.phone && (
                <a
                  href={`tel:${sup.phone.replace(/\D/g, '')}`}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-[#111] border border-[#222] hover:bg-[#222] text-gray-300 flex items-center gap-1 transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : '#F5F5F5', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}
                >
                  <Phone className="w-3 h-3" />
                  Ligar
                </a>
              )}
              {sup.email && (
                <a
                  href={`mailto:${sup.email}`}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-[#111] border border-[#222] hover:bg-[#222] text-gray-300 flex items-center gap-1 transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : '#F5F5F5', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}
                >
                  <Mail className="w-3 h-3" />
                  E-mail
                </a>
              )}
            </div>
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-500 text-xs">
            Nenhum parceiro de distribuição correspondente encontrado.
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl border flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1A1A1A]' : 'border-gray-200'
            }`}>
              <span className="font-semibold text-sm">Adicionar Novo Distribuidor</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Nome Fantasia (Distribuidora) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ambev Distribuidora S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Nome do Contato Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Representante Ricardo"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Celular / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setWhatsapp(e.target.value);
                    }}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">E-mail Comercial</label>
                  <input
                    type="email"
                    placeholder="Ex: contato@distribuidora.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Agenda de Entregas & Observações</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Pedido mínimo R$ 1.500,00 para entrega grátis. Entregas às terças."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              {/* CTAs */}
              <div className="flex gap-2 justify-end border-t pt-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-3 py-2 rounded font-semibold border transition-all ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-semibold transition-all ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
