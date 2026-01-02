document.addEventListener('DOMContentLoaded', function() {
    // Estado da aplicação
    const state = {
        products: JSON.parse(localStorage.getItem('products')) || {},
        weighings: JSON.parse(localStorage.getItem('weighings')) || [],
        session: {
            boxes: 0,
            packaging: 0,
            grossWeight: 0,
            netWeight: 0,
            count: 0
        },
        theme: 'light'
    };

    // Elementos del DOM
    const elements = {
        // Formulário
        product: document.getElementById('product'),
        supplier: document.getElementById('supplier'),
        boxQuantity: document.getElementById('boxQuantity'),
        boxTara: document.getElementById('boxTara'),
        packagingQuantity: document.getElementById('packagingQuantity'),
        packagingTara: document.getElementById('packagingTara'),
        grossWeight: document.getElementById('grossWeight'),
        invoiceWeight: document.getElementById('invoiceWeight'),
        notes: document.getElementById('notes'),
        pesagemForm: document.getElementById('pesagemForm'),
        
        // Cálculos
        totalBoxTara: document.getElementById('totalBoxTara'),
        totalPackagingTara: document.getElementById('totalPackagingTara'),
        totalTara: document.getElementById('totalTara'),
        
        // Status do produto
        productStatus: document.getElementById('productStatus'),
        statusDot: document.querySelector('#productStatus .status-dot'),
        statusText: document.querySelector('#productStatus span:last-child'),
        
        // Estatísticas
        sessionBoxes: document.getElementById('sessionBoxes'),
        sessionPackaging: document.getElementById('sessionPackaging'),
        sessionNet: document.getElementById('sessionNet'),
        sessionCount: document.getElementById('sessionCount'),
        
        // Ticket
        ticketBody: document.getElementById('ticketBody'),
        ticketItems: document.getElementById('ticketItems'),
        ticketTotal: document.getElementById('ticketTotal'),
        ticketNumber: document.getElementById('ticketNumber'),
        ticketDate: document.getElementById('ticketDate'),
        
        // Lista recente
        recentList: document.getElementById('recentList'),
        
        // Data e hora
        currentDate: document.getElementById('currentDate'),
        currentTime: document.getElementById('currentTime'),
        
        // Botões
        clearForm: document.getElementById('clearForm'),
        clearSession: document.getElementById('clearSession'),
        exportBtn: document.getElementById('exportBtn'),
        printBtn: document.getElementById('printBtn'),
        whatsappBtn: document.getElementById('whatsappBtn'),
        
        // Modal
        printModal: document.getElementById('printModal'),
        printView: document.getElementById('printView'),
        closeModal: document.querySelectorAll('.close-modal'),
        thermalPreview: document.getElementById('thermalPreview')
    };

    // Inicialização
    init();

    function init() {
        // Atualizar data e hora
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Atualizar lista de produtos
        updateProductList();
        
        // Calcular valores iniciais
        calculateTotals();
        
        // Atualizar interface
        updateTicket();
        updateRecentList();
        updateSessionStats();
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log('Aplicação inicializada com sucesso!');
    }

    function setupEventListeners() {
        // Mudanças no formulário
        elements.product.addEventListener('input', handleProductInput);
        elements.boxQuantity.addEventListener('input', calculateTotals);
        elements.boxTara.addEventListener('input', calculateTotals);
        elements.packagingQuantity.addEventListener('input', calculateTotals);
        elements.packagingTara.addEventListener('input', calculateTotals);
        
        // Botões
        elements.clearForm.addEventListener('click', clearForm);
        elements.clearSession.addEventListener('click', clearSession);
        elements.pesagemForm.addEventListener('submit', handleSubmit);
        elements.exportBtn.addEventListener('click', exportToCSV);
        elements.printBtn.addEventListener('click', showPrintOptions);
        elements.whatsappBtn.addEventListener('click', sendWhatsApp);
        
        // Modal
        elements.closeModal.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.printModal.style.display = 'none';
            });
        });
        
        elements.printModal.addEventListener('click', (e) => {
            if (e.target === elements.printModal) {
                elements.printModal.style.display = 'none';
            }
        });
    }

    function handleProductInput() {
        const productName = elements.product.value.trim();
        
        if (!productName) {
            elements.statusDot.className = 'status-dot';
            elements.statusText.textContent = 'Novo produto';
            return;
        }
        
        if (state.products[productName]) {
            // Produto conhecido
            const product = state.products[productName];
            elements.boxTara.value = product.boxTara || '';
            elements.packagingTara.value = product.packagingTara || '';
            
            elements.statusDot.className = 'status-dot known';
            elements.statusText.textContent = 'Produto conhecido';
            showToast('Taras preenchidas automaticamente', 'success');
        } else {
            // Produto novo
            elements.boxTara.value = '';
            elements.packagingTara.value = '';
            
            elements.statusDot.className = 'status-dot';
            elements.statusText.textContent = 'Novo produto';
        }
        
        calculateTotals();
    }

    function calculateTotals() {
        // Obter valores
        const boxQty = parseFloat(elements.boxQuantity.value) || 0;
        const boxTara = parseFloat(elements.boxTara.value) || 0;
        const packagingQty = parseFloat(elements.packagingQuantity.value) || 0;
        const packagingTara = parseFloat(elements.packagingTara.value) || 0;
        
        // Calcular totais
        const totalBoxTara = boxQty * boxTara;
        const totalPackagingTara = packagingQty * packagingTara;
        const totalTara = totalBoxTara + totalPackagingTara;
        
        // Atualizar UI
        elements.totalBoxTara.textContent = `${totalBoxTara.toFixed(3)} kg`;
        elements.totalPackagingTara.textContent = `${totalPackagingTara.toFixed(3)} kg`;
        elements.totalTara.textContent = `${totalTara.toFixed(3)} kg`;
        
        return {
            boxQty,
            boxTara,
            packagingQty,
            packagingTara,
            totalBoxTara,
            totalPackagingTara,
            totalTara
        };
    }

    function handleSubmit(e) {
        e.preventDefault();
        
        // Validações
        const productName = elements.product.value.trim();
        if (!productName) {
            showToast('Por favor, insira o nome do produto', 'error');
            return;
        }
        
        const grossWeightsInput = elements.grossWeight.value.trim();
        if (!grossWeightsInput) {
            showToast('Por favor, insira o peso bruto', 'error');
            return;
        }
        
        // Calcular taras
        const calculations = calculateTotals();
        
        // Processar múltiplos pesos brutos
        const grossWeights = grossWeightsInput
            .split(/[,;\s]+/)
            .map(w => parseFloat(w.replace(',', '.')))
            .filter(w => !isNaN(w) && w > 0);
        
        if (grossWeights.length === 0) {
            showToast('Nenhum peso bruto válido encontrado', 'error');
            return;
        }
        
        // Criar pesagens para cada peso bruto
        grossWeights.forEach(grossWeight => {
            const netWeight = grossWeight - calculations.totalTara;
            const invoiceWeight = parseFloat(elements.invoiceWeight.value) || 0;
            const difference = invoiceWeight > 0 ? netWeight - invoiceWeight : null;
            
            const weighing = {
                id: Date.now() + Math.random(),
                product: productName,
                supplier: elements.supplier.value.trim(),
                boxQuantity: calculations.boxQty,
                boxTara: calculations.boxTara,
                packagingQuantity: calculations.packagingQty,
                packagingTara: calculations.packagingTara,
                totalTara: calculations.totalTara,
                grossWeight: grossWeight,
                netWeight: netWeight,
                invoiceWeight: invoiceWeight,
                difference: difference,
                notes: elements.notes.value.trim(),
                timestamp: Date.now(),
                dateTime: new Date().toLocaleString('pt-BR')
            };
            
            state.weighings.unshift(weighing);
            
            // Atualizar estatísticas da sessão
            state.session.boxes += calculations.boxQty;
            state.session.packaging += calculations.packagingQty;
            state.session.grossWeight += grossWeight;
            state.session.netWeight += netWeight;
            state.session.count++;
        });
        
        // Salvar produto se for novo
        if (!state.products[productName]) {
            state.products[productName] = {
                boxTara: calculations.boxTara,
                packagingTara: calculations.packagingTara,
                lastUsed: Date.now()
            };
            updateProductList();
        }
        
        // Salvar e atualizar
        saveData();
        updateSessionStats();
        updateTicket();
        updateRecentList();
        clearForm();
        
        showToast(`${grossWeights.length} pesagem(ns) adicionada(s)`, 'success');
    }

    function updateTicket() {
        if (state.weighings.length === 0) {
            elements.ticketBody.innerHTML = `
                <div class="empty-ticket">
                    <i class="fas fa-receipt"></i>
                    <p>Nenhuma pesagem registrada</p>
                </div>
            `;
            elements.ticketItems.textContent = '0';
            elements.ticketTotal.textContent = '0.000 kg';
            elements.ticketNumber.textContent = '001';
            elements.ticketDate.textContent = new Date().toLocaleDateString('pt-BR');
            return;
        }
        
        // Gerar número do ticket
        const ticketNum = String(state.weighings.length).padStart(3, '0');
        elements.ticketNumber.textContent = ticketNum;
        elements.ticketDate.textContent = new Date().toLocaleDateString('pt-BR');
        
        // Mostrar cada producto con su peso líquido individual
        let ticketHtml = '';
        const recentWeighings = state.weighings.slice(0, 8);
        
        // Agrupar por producto
        const groupedByProduct = {};
        recentWeighings.forEach(w => {
            if (!groupedByProduct[w.product]) {
                groupedByProduct[w.product] = {
                    items: [],
                    totalNet: 0,
                    count: 0
                };
            }
            groupedByProduct[w.product].items.push(w);
            groupedByProduct[w.product].totalNet += w.netWeight;
            groupedByProduct[w.product].count++;
        });
        
        Object.entries(groupedByProduct).forEach(([product, data]) => {
            ticketHtml += `
                <div class="ticket-product-group">
                    <div class="product-header">
                        <strong>${product}</strong>
                        <small>${data.count} ${data.count > 1 ? 'itens' : 'item'}</small>
                    </div>
            `;
            
            data.items.forEach((item, idx) => {
                ticketHtml += `
                    <div class="ticket-item-detail">
                        <div class="weight-info">
                            <span>Bruto: ${item.grossWeight.toFixed(2)}kg</span>
                            ${item.invoiceWeight > 0 ? 
                              `<span>Nota: ${item.invoiceWeight.toFixed(2)}kg</span>` : ''}
                        </div>
                        <div class="net-weight">
                            <strong>Líquido: ${item.netWeight.toFixed(2)}kg</strong>
                        </div>
                    </div>
                `;
            });
            
            // Mostrar subtotal si hay más de un item
            if (data.count > 1) {
                ticketHtml += `
                    <div class="product-subtotal">
                        <span>Subtotal ${product}:</span>
                        <strong>${data.totalNet.toFixed(2)}kg</strong>
                    </div>
                `;
            }
            
            ticketHtml += `</div>`;
        });
        
        elements.ticketBody.innerHTML = ticketHtml;
        elements.ticketItems.textContent = recentWeighings.length;
        
        // Total general
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        elements.ticketTotal.textContent = `${totalNet.toFixed(3)} kg`;
    }

    function updateRecentList() {
        if (state.weighings.length === 0) {
            elements.recentList.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-weight"></i>
                    <p>Nenhuma pesagem recente</p>
                </div>
            `;
            return;
        }
        
        // Mostrar últimas 5 pesagens
        const recentWeighings = state.weighings.slice(0, 5);
        let listHtml = '';
        
        recentWeighings.forEach(weighing => {
            const diffClass = weighing.difference >= 0 ? 'positive' : 'negative';
            const diffText = weighing.difference !== null ? 
                `${weighing.difference >= 0 ? '+' : ''}${weighing.difference.toFixed(1)}` : '—';
            
            listHtml += `
                <div class="list-item">
                    <div>
                        <div class="product">${weighing.product}</div>
                        <div class="supplier">${weighing.supplier || '—'}</div>
                    </div>
                    <div class="weight">${weighing.netWeight.toFixed(2)} kg</div>
                    <div class="difference ${diffClass}">${diffText}</div>
                </div>
            `;
        });
        
        elements.recentList.innerHTML = listHtml;
    }

    function updateSessionStats() {
        elements.sessionBoxes.textContent = state.session.boxes;
        elements.sessionPackaging.textContent = state.session.packaging;
        elements.sessionNet.textContent = state.session.netWeight.toFixed(3);
        elements.sessionCount.textContent = state.session.count;
    }

    function updateProductList() {
        const datalist = document.getElementById('productList');
        if (!datalist) return;
        
        datalist.innerHTML = '';
        
        Object.keys(state.products)
            .sort()
            .forEach(product => {
                const option = document.createElement('option');
                option.value = product;
                datalist.appendChild(option);
            });
    }

    function updateDateTime() {
        const now = new Date();
        
        // Formatar data
        const optionsDate = { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        };
        if (elements.currentDate) {
            elements.currentDate.textContent = now.toLocaleDateString('pt-BR', optionsDate);
        }
        
        // Formatar hora
        if (elements.currentTime) {
            elements.currentTime.textContent = now.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    function clearForm() {
        elements.product.value = '';
        elements.supplier.value = '';
        elements.boxQuantity.value = '0';
        elements.boxTara.value = '';
        elements.packagingQuantity.value = '0';
        elements.packagingTara.value = '';
        elements.grossWeight.value = '';
        elements.invoiceWeight.value = '';
        elements.notes.value = '';
        
        // Resetar status do produto
        elements.statusDot.className = 'status-dot';
        elements.statusText.textContent = 'Novo produto';
        
        calculateTotals();
        if (elements.product) {
            elements.product.focus();
        }
    }

    function clearSession() {
        if (state.weighings.length === 0) {
            showToast('Nenhuma pesagem para limpar', 'warning');
            return;
        }
        
        if (confirm(`Tem certeza que deseja limpar todas as ${state.weighings.length} pesagens?`)) {
            state.weighings = [];
            state.session = {
                boxes: 0,
                packaging: 0,
                grossWeight: 0,
                netWeight: 0,
                count: 0
            };
            
            saveData();
            updateSessionStats();
            updateTicket();
            updateRecentList();
            
            showToast('Sessão limpa com sucesso', 'success');
        }
    }

    function exportToCSV() {
        if (state.weighings.length === 0) {
            showToast('Nenhuma pesagem para exportar', 'warning');
            return;
        }
        
        const headers = [
            'Produto', 'Fornecedor', 'Qtd Caixas', 'Tara Caixa',
            'Qtd Embalagens', 'Tara Embalagem', 'Tara Total',
            'Peso Bruto', 'Peso Líquido', 'Peso Nota',
            'Diferença', 'Observações', 'Data/Hora'
        ];
        
        const csvRows = [
            headers.join(';'),
            ...state.weighings.map(w => [
                `"${w.product}"`,
                `"${w.supplier || ''}"`,
                w.boxQuantity,
                w.boxTara.toFixed(3).replace('.', ','),
                w.packagingQuantity,
                w.packagingTara.toFixed(3).replace('.', ','),
                w.totalTara.toFixed(3).replace('.', ','),
                w.grossWeight.toFixed(3).replace('.', ','),
                w.netWeight.toFixed(3).replace('.', ','),
                (w.invoiceWeight || 0).toFixed(3).replace('.', ','),
                (w.difference || 0).toFixed(3).replace('.', ','),
                `"${w.notes || ''}"`,
                `"${w.dateTime}"`
            ].join(';'))
        ];
        
        const csvString = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pesagem_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast('CSV exportado com sucesso', 'success');
    }

    function sendWhatsApp() {
        if (state.weighings.length === 0) {
            showToast('Nenhuma pesagem para enviar', 'warning');
            return;
        }
        
        // Formato similar al ticket térmico
        let message = `*CONTROLE DE PESAGEM*\n`;
        message += `*Ticket:* #${elements.ticketNumber.textContent}\n`;
        message += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
        message += `*Hora:* ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}\n`;
        message += `\n${'='.repeat(30)}\n\n`;
        
        // Mostrar últimas 8 pesagens
        const recentWeighings = state.weighings.slice(0, 8);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        
        // Agrupar por producto
        const groupedByProduct = {};
        recentWeighings.forEach(w => {
            if (!groupedByProduct[w.product]) {
                groupedByProduct[w.product] = {
                    items: [],
                    totalNet: 0,
                    count: 0
                };
            }
            groupedByProduct[w.product].items.push(w);
            groupedByProduct[w.product].totalNet += w.netWeight;
            groupedByProduct[w.product].count++;
        });
        
        Object.entries(groupedByProduct).forEach(([product, data]) => {
            message += `*${product}*\n`;
            data.items.forEach((item, idx) => {
                message += `  └ Bruto: ${item.grossWeight.toFixed(2)}kg`;
                if (item.invoiceWeight > 0) {
                    message += ` | Nota: ${item.invoiceWeight.toFixed(2)}kg`;
                }
                message += `\n  └ Líquido: ${item.netWeight.toFixed(2)}kg`;
                if (item.difference !== null) {
                    message += ` (${item.difference >= 0 ? '+' : ''}${item.difference.toFixed(2)}kg)`;
                }
                message += `\n`;
            });
            message += `\n`;
        });
        
        message += `${'='.repeat(30)}\n`;
        message += `*TOTAL ITENS:* ${recentWeighings.length}\n`;
        message += `*TOTAL LÍQUIDO:* ${totalNet.toFixed(2)} kg\n`;
        message += `\n_Controle de Pesagem - Armazém_`;
        
        // Codificar para WhatsApp
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }

    // ==============================
    // FUNÇÕES DE IMPRESSÃO
    // ==============================

    function showPrintOptions() {
        if (state.weighings.length === 0) {
            showToast('Nenhuma pesagem para imprimir', 'warning');
            return;
        }
        
        // Generar vista previa térmica
        const thermalPreview = generateThermalPreview();
        if (elements.thermalPreview) {
            elements.thermalPreview.innerHTML = thermalPreview;
        }
        
        // Configurar modal
        elements.printModal.style.display = 'flex';
    }

    function generateThermalPreview() {
        if (state.weighings.length === 0) return '';
        
        const recentWeighings = state.weighings.slice(0, 10);
        let preview = `
            <div style="font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.2;">
                <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                    <div style="font-weight: bold;">CONTROLE DE PESAGEM</div>
                    <div>Ticket #${elements.ticketNumber.textContent}</div>
                    <div>${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
        `;
        
        recentWeighings.forEach((weighing, index) => {
            const productName = weighing.product.length > 15 ? 
                weighing.product.substring(0, 12) + '...' : weighing.product;
            
            preview += `
                <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
                    <div style="font-weight: bold;">${productName}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px;">
                        <span>Bruto: ${weighing.grossWeight.toFixed(2)}kg</span>
                        ${weighing.invoiceWeight > 0 ? `<span>Nota: ${weighing.invoiceWeight.toFixed(2)}kg</span>` : ''}
                    </div>
                    <div style="text-align: right; font-weight: bold;">
                        Líquido: ${weighing.netWeight.toFixed(2)}kg
                    </div>
                </div>
            `;
        });
        
        // Totales
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        preview += `
                <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>Total Itens:</span>
                        <span>${recentWeighings.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>Total Líquido:</span>
                        <span>${totalNet.toFixed(2)} kg</span>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 15px; font-size: 10px;">
                    ${'='.repeat(32)}
                    <div>Responsável</div>
                </div>
            </div>
        `;
        
        return preview;
    }

    function printThermalTicket() {
        if (state.weighings.length === 0) return;
        
        const recentWeighings = state.weighings.slice(0, 15);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        
        // Crear contenido para impresión térmica
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket de Pesagem</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        body {
                            margin: 5mm;
                            padding: 0;
                            width: 70mm;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            line-height: 1.2;
                            color: #000;
                        }
                        .no-print { display: none; }
                    }
                    body {
                        margin: 5mm;
                        padding: 0;
                        width: 70mm;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        color: #000;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }
                    .item {
                        margin: 3px 0;
                        padding: 2px 0;
                        border-bottom: 1px dashed #ccc;
                    }
                    .product-name {
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .weight-details {
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                        margin-bottom: 2px;
                    }
                    .net-weight {
                        text-align: right;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 10px;
                        border-top: 2px solid #000;
                        padding-top: 10px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>CONTROLE DE PESAGEM</h3>
                    <p>${new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Ticket #${elements.ticketNumber.textContent}</p>
                </div>
                
                <div class="content">
        `;
        
        let itemsHtml = '';
        recentWeighings.forEach(w => {
            const productName = w.product.length > 15 ? 
                w.product.substring(0, 15) : w.product;
            
            itemsHtml += `
                <div class="item">
                    <div class="product-name">${productName}</div>
                    <div class="weight-details">
                        <span>Bruto: ${w.grossWeight.toFixed(2)}kg</span>
                        ${w.invoiceWeight > 0 ? `<span>Nota: ${w.invoiceWeight.toFixed(2)}kg</span>` : ''}
                    </div>
                    <div class="net-weight">
                        Líq: ${w.netWeight.toFixed(2)}kg
                        ${w.difference !== null ? 
                          ` (${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg)` : ''}
                    </div>
                </div>
            `;
        });
        
        const finalContent = printContent + itemsHtml + `
                </div>
                
                <div class="footer">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
                        <span>Total Itens:</span>
                        <span>${recentWeighings.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px;">
                        <span>Total Líquido:</span>
                        <span>${totalNet.toFixed(2)} kg</span>
                    </div>
                    <div style="border-top: 1px solid #000; padding-top: 10px; text-align: center;">
                        __________________________
                        <div style="font-size: 10px; margin-top: 5px;">Responsável</div>
                    </div>
                </div>
                
                <script>
                    setTimeout(() => window.print(), 300);
                    window.onafterprint = () => setTimeout(() => window.close(), 500);
                <\/script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(finalContent);
        printWindow.document.close();
        
        elements.printModal.style.display = 'none';
    }

    function printFullPage() {
        if (state.weighings.length === 0) return;
        
        const recentWeighings = state.weighings.slice(0, 50);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        
        // Crear contenido para impresión en página completa
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Pesagem</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page {
                            margin: 15mm;
                        }
                        body {
                            font-family: 'Inter', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                    }
                    body {
                        font-family: 'Inter', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .print-header {
                        text-align: center;
                        border-bottom: 3px solid #2563eb;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .print-header h1 {
                        color: #2563eb;
                        font-size: 28px;
                        margin-bottom: 10px;
                    }
                    .print-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        font-size: 14px;
                        color: #666;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    .summary-item {
                        text-align: center;
                    }
                    .summary-item .label {
                        font-size: 12px;
                        color: #64748b;
                        margin-bottom: 5px;
                    }
                    .summary-item .value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2563eb;
                        font-family: 'Roboto Mono', monospace;
                    }
                    .table-container {
                        margin-bottom: 30px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th {
                        background: #2563eb;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-size: 14px;
                    }
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 13px;
                    }
                    tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    .total-row {
                        font-weight: bold;
                        background: #e0f2fe !important;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #2563eb;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>CONTROLE DE PESAGEM</h1>
                    <p>Relatório Completo - ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div class="print-meta">
                    <div>
                        <strong>Ticket:</strong> #${elements.ticketNumber.textContent}
                    </div>
                    <div>
                        <strong>Data de Emissão:</strong> ${new Date().toLocaleString('pt-BR')}
                    </div>
                    <div>
                        <strong>Total de Itens:</strong> ${recentWeighings.length}
                    </div>
                </div>
                
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="label">Caixas</div>
                        <div class="value">${state.session.boxes}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Embalagens</div>
                        <div class="value">${state.session.packaging}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Peso Bruto</div>
                        <div class="value">${state.session.grossWeight.toFixed(2)}kg</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Peso Líquido</div>
                        <div class="value">${totalNet.toFixed(2)}kg</div>
                    </div>
                </div>
                
                <div class="table-container">
                    <h3 style="color: #2563eb; margin-bottom: 15px;">Detalhes das Pesagens</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Fornecedor</th>
                                <th>Caixas</th>
                                <th>Embalagens</th>
                                <th>Tara Total</th>
                                <th>Peso Bruto</th>
                                <th>Peso Nota</th>
                                <th>Peso Líquido</th>
                                <th>Diferença</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        let tableRows = '';
        recentWeighings.forEach(w => {
            const diffClass = w.difference >= 0 ? 'color: #065f46;' : 'color: #991b1b;';
            const diffText = w.difference !== null ? 
                `${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}` : '—';
            
            tableRows += `
                <tr>
                    <td>${w.product}</td>
                    <td>${w.supplier || '—'}</td>
                    <td>${w.boxQuantity}</td>
                    <td>${w.packagingQuantity}</td>
                    <td>${w.totalTara.toFixed(2)}kg</td>
                    <td>${w.grossWeight.toFixed(2)}kg</td>
                    <td>${w.invoiceWeight > 0 ? w.invoiceWeight.toFixed(2) + 'kg' : '—'}</td>
                    <td><strong>${w.netWeight.toFixed(2)}kg</strong></td>
                    <td style="${diffClass}">${diffText}</td>
                </tr>
            `;
        });
        
        const finalContent = printContent + tableRows + `
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="5"><strong>TOTAIS</strong></td>
                                <td><strong>${state.session.grossWeight.toFixed(2)}kg</strong></td>
                                <td>—</td>
                                <td><strong>${totalNet.toFixed(2)}kg</strong></td>
                                <td>—</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="footer">
                    <p>Emitido por: Controle de Pesagem - Sistema Armazém</p>
                    <p>${new Date().toLocaleString('pt-BR')}</p>
                    <div style="margin-top: 40px; text-align: right;">
                        <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; padding-top: 10px;">
                            <div>_________________________________</div>
                            <div style="font-size: 14px; margin-top: 5px;">Assinatura do Responsável</div>
                        </div>
                    </div>
                </div>
                
                <script>
                    setTimeout(() => {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    }, 500);
                <\/script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        printWindow.document.write(finalContent);
        printWindow.document.close();
        
        elements.printModal.style.display = 'none';
    }

    function saveData() {
        try {
            localStorage.setItem('products', JSON.stringify(state.products));
            localStorage.setItem('weighings', JSON.stringify(state.weighings));
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
        }
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'exclamation-triangle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Exponer funciones al scope global
    window.app = {
        printThermalTicket,
        printFullPagePDF: printFullPage,
        printTicketSimple: printThermalTicket,
        printFullPage
    };
});