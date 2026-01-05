// ===== CONTROLE DE PESAGEM - APP FUNCIONAL =====
// Versión optimizada para APK y Chrome Mobile

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App iniciando...');
    
    // ===== VARIABLES GLOBALES =====
    let products = {};
    let weighings = [];
    let deferredPrompt = null;
    let newServiceWorker = null;
    let updateNotificationShown = false;
    
    // ===== ELEMENTOS DEL DOM =====
    const elements = {
        // Formulario
        product: document.getElementById('product'),
        supplier: document.getElementById('supplier'),
        boxQuantity: document.getElementById('boxQuantity'),
        boxTara: document.getElementById('boxTara'),
        packagingQuantity: document.getElementById('packagingQuantity'),
        packagingTara: document.getElementById('packagingTara'),
        grossWeight: document.getElementById('grossWeight'),
        invoiceWeight: document.getElementById('invoiceWeight'),
        productList: document.getElementById('productList'),
        
        // Totales
        totalBoxTara: document.getElementById('totalBoxTara'),
        totalPackagingTara: document.getElementById('totalPackagingTara'),
        totalTara: document.getElementById('totalTara'),
        
        // Estado producto
        statusDot: document.querySelector('#productStatus .status-dot'),
        statusText: document.querySelector('#productStatus span:last-child'),
        
        // Stats compactos
        sessionCountCompact: document.getElementById('sessionCountCompact'),
        sessionNetCompact: document.getElementById('sessionNetCompact'),
        
        // Ticket compacto
        ticketItemsCompact: document.getElementById('ticketItemsCompact'),
        ticketTotalItems: document.getElementById('ticketTotalItems'),
        ticketTotalWeight: document.getElementById('ticketTotalWeight'),
        ticketNumberCompact: document.getElementById('ticketNumberCompact'),
        ticketNumberCompact2: document.getElementById('ticketNumberCompact2'),
        ticketDateCompact: document.getElementById('ticketDateCompact'),
        
        // Histórico
        historyList: document.getElementById('historyList'),
        
        // Fecha y hora
        currentDate: document.getElementById('currentDate'),
        currentTime: document.getElementById('currentTime'),
        
        // Botones
        clearFormBtn: document.getElementById('clearForm'),
        saveProductBtn: document.getElementById('saveProduct'),
        quickCalcBtn: document.getElementById('quickCalc'),
        submitBtn: document.querySelector('button[type="submit"]'),
        
        // Botones ticket
        printTicketBtn: document.getElementById('printTicketBtn'),
        shareTicketBtn: document.getElementById('shareTicketBtn'),
        exportTicketBtn: document.getElementById('exportTicketBtn'),
        clearTicketBtn: document.getElementById('clearTicketBtn'),
        
        // Botones histórico
        exportHistoryBtn: document.getElementById('exportHistoryBtn'),
        filterTodayBtn: document.getElementById('filterTodayBtn'),
        filterWeekBtn: document.getElementById('filterWeekBtn'),
        filterAllBtn: document.getElementById('filterAllBtn'),
        
        // Botones configuración
        clearAllDataBtn: document.getElementById('clearAllData'),
        exportAllDataBtn: document.getElementById('exportAllData'),
        installAppBtn: document.getElementById('installAppBtn'),
        createAPKBtn: document.getElementById('createAPKBtn'),
        checkUpdateBtn: document.getElementById('checkUpdateBtn'),
        importDataBtn: document.getElementById('importDataBtn'),
        backupDataBtn: document.getElementById('backupDataBtn'),
        
        // Info configuración
        dataCount: document.getElementById('dataCount'),
        productCount: document.getElementById('productCount'),
        storageUsed: document.getElementById('storageUsed')
    };
    
    // ===== INICIALIZACIÓN =====
    init();
    
    function init() {
        console.log('✅ Inicializando app...');
        
        // Cargar datos
        loadData();
        
        // Actualizar UI
        updateDateTime();
        updateProductList();
        updateCompactSummary();
        updateTicketTab();
        updateHistoricoTab();
        updateConfigData();
        
        // Event listeners
        setupEventListeners();
        
        // Iniciar reloj
        setInterval(updateDateTime, 60000);
        
        // Configurar PWA
        setupPWA();
        
        // Configurar detección de conexión
        setupConnectionMonitor();
        
        // Configurar detección de actualizaciones
        setupUpdateChecker();
        
        console.log('✅ App lista!');
    }
    
    // ===== MONITOR DE CONEXIÓN =====
    function setupConnectionMonitor() {
        console.log('🌐 Configurando monitor de conexión...');
        
        // Crear elemento para mostrar estado de conexión
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connectionStatus';
        connectionStatus.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            z-index: 10000;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s;
            opacity: 0.9;
            pointer-events: none;
        `;
        document.body.appendChild(connectionStatus);
        
        // Función para actualizar estado
        function updateConnectionStatus() {
            const isOnline = navigator.onLine;
            
            if (isOnline) {
                connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> Online';
                connectionStatus.style.backgroundColor = '#10b981';
                connectionStatus.style.color = 'white';
                connectionStatus.style.border = '2px solid #10b981';
                connectionStatus.style.opacity = '0.9';
                
                // Mostrar toast de conexión restaurada
                if (window.lastOnlineStatus === false) {
                    showToast('✅ Conexão restaurada', 'success');
                }
                
                // Ocultar después de 5 segundos
                setTimeout(() => {
                    if (navigator.onLine) {
                        connectionStatus.style.opacity = '0.3';
                    }
                }, 5000);
            } else {
                connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
                connectionStatus.style.backgroundColor = '#ef4444';
                connectionStatus.style.color = 'white';
                connectionStatus.style.border = '2px solid #ef4444';
                connectionStatus.style.opacity = '0.9';
                
                // Mostrar toast de modo offline
                if (window.lastOnlineStatus === true) {
                    showToast('⚠️ Modo offline ativado', 'warning');
                }
            }
            
            window.lastOnlineStatus = isOnline;
        }
        
        // Estado inicial
        updateConnectionStatus();
        window.lastOnlineStatus = navigator.onLine;
        
        // Escuchar cambios de conexión
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        
        console.log('✅ Monitor de conexión configurado');
    }
    
    // ===== DETECCIÓN DE ACTUALIZACIONES =====
    function setupUpdateChecker() {
        console.log('🔄 Configurando detector de actualizaciones...');
        
        if ('serviceWorker' in navigator) {
            // Registrar el Service Worker
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registrado:', registration.scope);
                    
                    // Verificar si hay una nueva versión
                    registration.addEventListener('updatefound', () => {
                        console.log('🔄 Nueva versión encontrada!');
                        newServiceWorker = registration.installing;
                        
                        newServiceWorker.addEventListener('statechange', () => {
                            if (newServiceWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Nueva versión lista para instalar
                                if (!updateNotificationShown) {
                                    setTimeout(() => {
                                        showUpdateNotification();
                                        updateNotificationShown = true;
                                    }, 3000);
                                }
                            }
                        });
                    });
                    
                    // Verificar actualizaciones periódicamente
                    setInterval(() => {
                        registration.update();
                    }, 30 * 60 * 1000); // Cada 30 minutos
                })
                .catch(error => {
                    console.error('❌ Error registrando Service Worker:', error);
                });
            
            // Escuchar cuando el Service Worker toma control
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service Worker ha tomado control');
                showToast('🔄 Aplicação atualizada! Recarregando...', 'info');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            });
        } else {
            console.log('ℹ️ Service Worker no soportado en este navegador');
        }
    }
    
    function showUpdateNotification() {
        console.log('📢 Mostrando notificación de actualización');
        
        // Crear notificación de actualización
        const updateNotification = document.createElement('div');
        updateNotification.id = 'updateNotification';
        updateNotification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 15px;
            animation: slideUp 0.4s ease;
            max-width: 90%;
            width: 400px;
            border: 2px solid white;
        `;
        
        updateNotification.innerHTML = `
            <div style="flex: 1;">
                <strong style="display: block; font-size: 16px; margin-bottom: 4px;">
                    <i class="fas fa-sync-alt"></i> Nova versão disponível!
                </strong>
                <small style="font-size: 13px; opacity: 0.9;">
                    Atualize para a versão mais recente
                </small>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="updateNowBtn" style="
                    background: white;
                    color: #d97706;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                ">
                    Atualizar
                </button>
                <button id="updateLaterBtn" style="
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                ">
                    Depois
                </button>
            </div>
        `;
        
        document.body.appendChild(updateNotification);
        
        // Agregar keyframes para animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { transform: translate(-50%, 100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Botón para actualizar ahora
        document.getElementById('updateNowBtn').addEventListener('click', () => {
            console.log('🔄 Usuário escolheu atualizar agora');
            if (newServiceWorker) {
                // Enviar mensaje al Service Worker para saltar la espera
                newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            updateNotification.remove();
            showToast('Atualizando aplicação...', 'info');
        });
        
        // Botón para después
        document.getElementById('updateLaterBtn').addEventListener('click', () => {
            console.log('⏰ Usuário escolheu atualizar depois');
            updateNotification.remove();
            showToast('Você será notificado novamente', 'info');
            
            // Mostrar nuevamente en 30 minutos
            updateNotificationShown = false;
            setTimeout(() => {
                if (newServiceWorker && newServiceWorker.state === 'installed' && !updateNotificationShown) {
                    showUpdateNotification();
                    updateNotificationShown = true;
                }
            }, 30 * 60 * 1000);
        });
        
        // Auto-ocultar después de 30 segundos
        setTimeout(() => {
            if (document.getElementById('updateNotification')) {
                updateNotification.style.animation = 'slideUp 0.4s ease reverse';
                setTimeout(() => {
                    if (updateNotification.parentNode) {
                        updateNotification.remove();
                        updateNotificationShown = false;
                    }
                }, 400);
            }
        }, 30000);
        
        // Mostrar toast informativo
        showToast('📢 Nova versão disponível!', 'info');
    }
    
    // ===== CARGA DE DATOS =====
    function loadData() {
        try {
            products = JSON.parse(localStorage.getItem('products')) || {};
            weighings = JSON.parse(localStorage.getItem('weighings')) || [];
            console.log(`📊 Datos cargados: ${weighings.length} pesagens, ${Object.keys(products).length} productos`);
        } catch (e) {
            console.error('Error cargando datos:', e);
            products = {};
            weighings = [];
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem('products', JSON.stringify(products));
            localStorage.setItem('weighings', JSON.stringify(weighings));
        } catch (e) {
            console.error('Error guardando datos:', e);
        }
    }
    
    // ===== PWA CONFIGURATION =====
    function setupPWA() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('📱 PWA puede ser instalada');
            
            // Mostrar notificación después de 5 segundos
            setTimeout(() => {
                if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    showToast('📱 Esta app pode ser instalada! Procure a opção "Instalar" no menu do navegador.', 'info');
                }
            }, 5000);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalada con éxito');
            deferredPrompt = null;
            showToast('✅ Aplicação instalada com sucesso!', 'success');
        });
    }
    
    function showInstallPrompt() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    showToast('✅ Aplicação instalada com sucesso!', 'success');
                } else {
                    showToast('Instalação cancelada', 'info');
                }
                deferredPrompt = null;
            });
        } else {
            showToast('Procure a opção "Instalar aplicativo" no menu do seu navegador', 'info');
        }
    }
    
    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        console.log('🔧 Configurando eventos...');
        
        // Input del producto
        if (elements.product) {
            elements.product.addEventListener('input', handleProductInput);
        }
        
        // Inputs numéricos para calcular taras
        const taraInputs = ['boxQuantity', 'boxTara', 'packagingQuantity', 'packagingTara'];
        taraInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', calculateTaras);
            }
        });
        
        // Botones del formulario
        if (elements.clearFormBtn) {
            elements.clearFormBtn.addEventListener('click', clearForm);
        }
        
        if (elements.saveProductBtn) {
            elements.saveProductBtn.addEventListener('click', saveCurrentProduct);
        }
        
        if (elements.quickCalcBtn) {
            elements.quickCalcBtn.addEventListener('click', () => {
                calculateTaras();
                showToast('🧮 Cálculos atualizados', 'info');
            });
        }
        
        // Formulario submit
        const form = document.getElementById('pesagemForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
        
        // Botones del ticket
        if (elements.printTicketBtn) {
            elements.printTicketBtn.addEventListener('click', printThermalTicket);
        }
        
        if (elements.shareTicketBtn) {
            elements.shareTicketBtn.addEventListener('click', shareWhatsApp);
        }
        
        if (elements.exportTicketBtn) {
            elements.exportTicketBtn.addEventListener('click', exportToCSV);
        }
        
        if (elements.clearTicketBtn) {
            elements.clearTicketBtn.addEventListener('click', clearAllWeighings);
        }
        
        // Botones de impresión
        document.getElementById('printThermalBtn')?.addEventListener('click', printThermalTicket);
        document.getElementById('printFullBtn')?.addEventListener('click', printFullPage);
        
        // Botones del histórico
        if (elements.exportHistoryBtn) {
            elements.exportHistoryBtn.addEventListener('click', exportToCSV);
        }
        
        if (elements.filterTodayBtn) {
            elements.filterTodayBtn.addEventListener('click', () => {
                showToast('📅 Mostrando pesagens de hoje', 'info');
                updateHistoricoTab('today');
            });
        }
        
        if (elements.filterWeekBtn) {
            elements.filterWeekBtn.addEventListener('click', () => {
                showToast('📆 Mostrando pesagens da semana', 'info');
                updateHistoricoTab('week');
            });
        }
        
        if (elements.filterAllBtn) {
            elements.filterAllBtn.addEventListener('click', () => {
                showToast('📊 Mostrando todas as pesagens', 'info');
                updateHistoricoTab('all');
            });
        }
        
        // Botones de configuración
        if (elements.clearAllDataBtn) {
            elements.clearAllDataBtn.addEventListener('click', clearAllData);
        }
        
        if (elements.exportAllDataBtn) {
            elements.exportAllDataBtn.addEventListener('click', exportToCSV);
        }
        
        if (elements.installAppBtn) {
            elements.installAppBtn.addEventListener('click', showInstallPrompt);
        }
        
        if (elements.createAPKBtn) {
            elements.createAPKBtn.addEventListener('click', () => {
                window.open('generate-apk.html', '_blank');
            });
        }
        
        if (elements.checkUpdateBtn) {
            elements.checkUpdateBtn.addEventListener('click', checkForUpdates);
        }
        
        if (elements.importDataBtn) {
            elements.importDataBtn.addEventListener('click', importData);
        }
        
        if (elements.backupDataBtn) {
            elements.backupDataBtn.addEventListener('click', backupData);
        }
        
        // Navegación por tabs - CORREGIDO
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                console.log(`🔄 Cambiando a tab: ${tabId}`);
                
                // Remover active de todos
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Activar tab clickeado
                this.classList.add('active');
                
                // Mostrar contenido
                const tabContent = document.getElementById(`tab-${tabId}`);
                if (tabContent) {
                    tabContent.classList.add('active');
                } else {
                    console.error(`❌ No se encontró tab-content con ID: tab-${tabId}`);
                }
                
                // Actualizar datos
                updateTabData(tabId);
            });
        });
        
        // Detectar cambios en visibilidad para PWA
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                updateDateTime();
                updateCompactSummary();
            }
        });
        
        console.log('✅ Eventos configurados');
    }
    
    // ===== FUNCIONES PRINCIPALES =====
    
    function handleProductInput() {
        const productName = elements.product.value.trim();
        
        if (!productName) {
            if (elements.statusDot) elements.statusDot.className = 'status-dot';
            if (elements.statusText) elements.statusText.textContent = 'Novo produto';
            return;
        }
        
        if (products[productName]) {
            // Producto conocido - llenar taras automáticamente
            const product = products[productName];
            if (elements.boxTara) elements.boxTara.value = product.boxTara || '';
            if (elements.packagingTara) elements.packagingTara.value = product.packagingTara || '';
            
            if (elements.statusDot) elements.statusDot.className = 'status-dot known';
            if (elements.statusText) elements.statusText.textContent = 'Produto conhecido';
            
            showToast('✅ Taras preenchidas automaticamente', 'success');
        } else {
            // Producto nuevo
            if (elements.boxTara) elements.boxTara.value = '';
            if (elements.packagingTara) elements.packagingTara.value = '';
            
            if (elements.statusDot) elements.statusDot.className = 'status-dot';
            if (elements.statusText) elements.statusText.textContent = 'Novo produto';
        }
        
        calculateTaras();
    }
    
    function calculateTaras() {
        console.log('🧮 Calculando taras...');
        
        // Obtener valores - CORREGIDO para evitar NaN
        const boxQty = parseFloat(elements.boxQuantity?.value) || 0;
        const boxTara = parseFloat(elements.boxTara?.value) || 0;
        const packagingQty = parseFloat(elements.packagingQuantity?.value) || 0;
        const packagingTara = parseFloat(elements.packagingTara?.value) || 0;
        
        // Calcular
        const totalBoxTara = boxQty * boxTara;
        const totalPackagingTara = packagingQty * packagingTara;
        const totalTara = totalBoxTara + totalPackagingTara;
        
        console.log(`📦 Caixas: ${boxQty} x ${boxTara} = ${totalBoxTara}`);
        console.log(`📦 Embalagens: ${packagingQty} x ${packagingTara} = ${totalPackagingTara}`);
        console.log(`📦 Tara Total: ${totalTara}`);
        
        // Actualizar UI - CORREGIDO
        if (elements.totalBoxTara) {
            elements.totalBoxTara.textContent = totalBoxTara.toFixed(3) + ' kg';
        }
        
        if (elements.totalPackagingTara) {
            elements.totalPackagingTara.textContent = totalPackagingTara.toFixed(3) + ' kg';
        }
        
        if (elements.totalTara) {
            elements.totalTara.textContent = totalTara.toFixed(3) + ' kg';
        }
        
        return { totalBoxTara, totalPackagingTara, totalTara };
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        console.log('📝 Enviando formulario...');
        
        // Validaciones básicas
        const productName = elements.product?.value.trim();
        if (!productName) {
            showToast('❌ Por favor, insira o nome do produto', 'error');
            return;
        }
        
        const grossWeightInput = elements.grossWeight?.value.trim();
        if (!grossWeightInput) {
            showToast('❌ Por favor, insira o peso bruto', 'error');
            return;
        }
        
        // Calcular taras
        const taras = calculateTaras();
        
        // Procesar múltiples pesos (separados por coma)
        const weightValues = grossWeightInput
            .split(/[,;\s]+/)
            .map(w => parseFloat(w.replace(',', '.')))
            .filter(w => !isNaN(w) && w > 0);
        
        if (weightValues.length === 0) {
            showToast('❌ Nenhum peso bruto válido encontrado', 'error');
            return;
        }
        
        // Crear pesajes para cada peso
        weightValues.forEach((grossWeight, index) => {
            const netWeight = grossWeight - taras.totalTara;
            const invoiceWeight = parseFloat(elements.invoiceWeight?.value) || 0;
            const difference = invoiceWeight > 0 ? netWeight - invoiceWeight : null;
            
            const weighing = {
                id: Date.now() + index,
                product: productName,
                supplier: elements.supplier?.value.trim() || '',
                boxQuantity: parseFloat(elements.boxQuantity?.value) || 0,
                boxTara: parseFloat(elements.boxTara?.value) || 0,
                packagingQuantity: parseFloat(elements.packagingQuantity?.value) || 0,
                packagingTara: parseFloat(elements.packagingTara?.value) || 0,
                totalTara: taras.totalTara,
                grossWeight: grossWeight,
                netWeight: netWeight,
                invoiceWeight: invoiceWeight,
                difference: difference,
                timestamp: Date.now(),
                dateTime: new Date().toLocaleString('pt-BR')
            };
            
            weighings.unshift(weighing); // Agregar al inicio
            console.log(`➕ Pesagem adicionada: ${productName} - ${netWeight.toFixed(2)}kg`);
        });
        
        // Guardar producto si es nuevo
        if (!products[productName]) {
            products[productName] = {
                boxTara: parseFloat(elements.boxTara?.value) || 0,
                packagingTara: parseFloat(elements.packagingTara?.value) || 0,
                lastUsed: Date.now()
            };
            updateProductList();
        }
        
        // Guardar y actualizar
        saveData();
        updateCompactSummary();
        updateTicketTab();
        updateHistoricoTab();
        updateConfigData();
        clearForm();
        
        showToast(`✅ ${weightValues.length} pesagem(ns) adicionada(s) com sucesso!`, 'success');
        
        // Vibrar si está soportado (para móviles)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    function saveCurrentProduct() {
        const productName = elements.product?.value.trim();
        const boxTara = elements.boxTara?.value;
        const packagingTara = elements.packagingTara?.value;
        
        if (!productName) {
            showToast('⚠️ Digite o nome do produto primeiro', 'warning');
            return;
        }
        
        products[productName] = {
            boxTara: parseFloat(boxTara) || 0,
            packagingTara: parseFloat(packagingTara) || 0,
            lastUsed: Date.now()
        };
        
        saveData();
        updateProductList();
        updateConfigData();
        
        // Actualizar estado
        if (elements.statusDot) elements.statusDot.className = 'status-dot known';
        if (elements.statusText) elements.statusText.textContent = 'Produto salvo';
        
        showToast(`✅ "${productName}" salvo com sucesso!`, 'success');
    }
    
    // ===== FUNCIONES DE UI =====
    
    function updateTabData(tabId) {
        console.log(`🔄 Actualizando tab: ${tabId}`);
        
        switch(tabId) {
            case 'pesar':
                updateCompactSummary();
                break;
            case 'ticket':
                updateTicketTab();
                break;
            case 'historico':
                updateHistoricoTab('all');
                break;
            case 'config':
                updateConfigData();
                break;
        }
    }
    
    function updateCompactSummary() {
        try {
            const today = new Date().toDateString();
            const todayWeighings = weighings.filter(w => {
                const weighDate = new Date(w.timestamp).toDateString();
                return weighDate === today;
            });
            
            const totalNet = todayWeighings.reduce((sum, w) => sum + (w.netWeight || 0), 0);
            
            if (elements.sessionCountCompact) {
                elements.sessionCountCompact.textContent = todayWeighings.length;
            }
            
            if (elements.sessionNetCompact) {
                elements.sessionNetCompact.textContent = totalNet.toFixed(3);
            }
            
            console.log(`📊 Resumo: ${todayWeighings.length} pesagens hoje, ${totalNet.toFixed(3)}kg total`);
        } catch (e) {
            console.error('Error en updateCompactSummary:', e);
        }
    }
    
    function updateTicketTab() {
        try {
            console.log('🎫 Actualizando tab ticket...');
            
            const recentWeighings = weighings.slice(0, 10); // Últimas 10
            
            // Actualizar número y fecha
            if (elements.ticketNumberCompact) {
                elements.ticketNumberCompact.textContent = String(weighings.length).padStart(3, '0');
            }
            
            if (elements.ticketNumberCompact2) {
                elements.ticketNumberCompact2.textContent = String(weighings.length).padStart(3, '0');
            }
            
            if (elements.ticketDateCompact) {
                elements.ticketDateCompact.textContent = new Date().toLocaleDateString('pt-BR');
            }
            
            // Actualizar items - CORREGIDO
            if (elements.ticketItemsCompact) {
                if (recentWeighings.length === 0) {
                    elements.ticketItemsCompact.innerHTML = `
                        <div style="text-align: center; padding: 30px 0; color: #94a3b8;">
                            <i class="fas fa-receipt" style="font-size: 40px; margin-bottom: 10px;"></i>
                            <div>Nenhuma pesagem registrada</div>
                        </div>
                    `;
                } else {
                    let html = '';
                    recentWeighings.forEach(w => {
                        const productName = w.product.length > 15 ? 
                            w.product.substring(0, 12) + '...' : w.product;
                        
                        const diffClass = w.difference >= 0 ? 'diff-positive' : 'diff-negative';
                        const diffText = w.difference !== null ? 
                            `(${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg)` : '';
                        
                        html += `
                            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #ccc;">
                                <div style="font-weight: bold;">${productName}</div>
                                <div style="font-size: 12px; color: #64748b;">${w.supplier || '—'}</div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 5px;">
                                    <div>
                                        <span>Bruto: ${w.grossWeight.toFixed(2)}kg</span><br>
                                        <span>Nota: ${w.invoiceWeight > 0 ? w.invoiceWeight.toFixed(2) : '—'}kg</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div>Líquido: ${w.netWeight.toFixed(2)}kg</div>
                                        ${diffText ? `<div class="${diffClass}" style="font-size: 11px;">${diffText}</div>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    elements.ticketItemsCompact.innerHTML = html;
                }
            }
            
            // Actualizar totales
            const totalNet = recentWeighings.reduce((sum, w) => sum + (w.netWeight || 0), 0);
            
            if (elements.ticketTotalItems) {
                elements.ticketTotalItems.textContent = recentWeighings.length;
            }
            
            if (elements.ticketTotalWeight) {
                elements.ticketTotalWeight.textContent = totalNet.toFixed(3) + ' kg';
            }
            
            console.log(`🎫 Ticket actualizado: ${recentWeighings.length} items`);
        } catch (e) {
            console.error('Error en updateTicketTab:', e);
        }
    }
    
    function updateHistoricoTab(filter = 'all') {
        try {
            console.log(`📜 Actualizando histórico con filtro: ${filter}`);
            
            if (!elements.historyList) {
                console.error('❌ Elemento historyList no encontrado');
                return;
            }
            
            let filteredWeighings = [];
            const now = new Date();
            
            switch(filter) {
                case 'today':
                    const today = now.toDateString();
                    filteredWeighings = weighings.filter(w => {
                        const weighDate = new Date(w.timestamp).toDateString();
                        return weighDate === today;
                    });
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filteredWeighings = weighings.filter(w => new Date(w.timestamp) >= weekAgo);
                    break;
                case 'all':
                default:
                    filteredWeighings = weighings.slice(0, 20); // Últimas 20
                    break;
            }
            
            if (filteredWeighings.length === 0) {
                elements.historyList.innerHTML = `
                    <div style="text-align: center; padding: 40px 0; color: #94a3b8;">
                        <i class="fas fa-weight-hanging" style="font-size: 40px; margin-bottom: 10px;"></i>
                        <div>Nenhuma pesagem no histórico</div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            filteredWeighings.forEach(w => {
                const date = new Date(w.timestamp);
                const timeStr = date.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const dateStr = date.toLocaleDateString('pt-BR');
                
                const diffClass = w.difference >= 0 ? 'diff-positive' : 'diff-negative';
                const diffText = w.difference !== null ? 
                    `${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg` : '—';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; 
                                padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 4px;">${w.product}</div>
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                                ${w.supplier || '—'} • ${dateStr} ${timeStr}
                            </div>
                            <div style="font-size: 12px;">
                                <span>Bruto: ${w.grossWeight.toFixed(2)}kg</span> | 
                                <span>Nota: ${w.invoiceWeight > 0 ? w.invoiceWeight.toFixed(2) : '—'}kg</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-family: 'Roboto Mono', monospace; font-weight: 600; font-size: 14px;">
                                ${w.netWeight.toFixed(2)}kg
                            </div>
                            <div style="font-size: 12px;" class="${diffClass}">
                                ${diffText}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            elements.historyList.innerHTML = html;
            console.log(`📜 Histórico actualizado: ${filteredWeighings.length} items`);
        } catch (e) {
            console.error('Error en updateHistoricoTab:', e);
            elements.historyList.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <div>Erro ao carregar histórico</div>
                </div>
            `;
        }
    }
    
    function updateConfigData() {
        try {
            // Calcular espacio usado
            const totalData = JSON.stringify(localStorage).length;
            const storageUsedKB = (totalData / 1024).toFixed(2);
            
            // Actualizar UI
            if (elements.dataCount) {
                elements.dataCount.textContent = weighings.length;
            }
            
            if (elements.productCount) {
                elements.productCount.textContent = Object.keys(products).length;
            }
            
            if (elements.storageUsed) {
                elements.storageUsed.textContent = storageUsedKB + ' KB';
            }
        } catch (e) {
            console.error('Error en updateConfigData:', e);
        }
    }
    
    function updateProductList() {
        if (!elements.productList) return;
        
        try {
            elements.productList.innerHTML = '';
            
            Object.keys(products)
                .sort()
                .forEach(product => {
                    const option = document.createElement('option');
                    option.value = product;
                    elements.productList.appendChild(option);
                });
                
            console.log(`📋 Lista de productos actualizada: ${Object.keys(products).length} productos`);
        } catch (e) {
            console.error('Error en updateProductList:', e);
        }
    }
    
    function updateDateTime() {
        const now = new Date();
        
        // Fecha
        if (elements.currentDate) {
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            elements.currentDate.textContent = now.toLocaleDateString('pt-BR', options);
        }
        
        // Hora
        if (elements.currentTime) {
            elements.currentTime.textContent = now.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
    
    // ===== ACCIONES =====
    
    function clearForm() {
        console.log('🧹 Limpiando formulario...');
        
        if (elements.product) elements.product.value = '';
        if (elements.supplier) elements.supplier.value = '';
        if (elements.boxQuantity) elements.boxQuantity.value = '0';
        if (elements.boxTara) elements.boxTara.value = '';
        if (elements.packagingQuantity) elements.packagingQuantity.value = '0';
        if (elements.packagingTara) elements.packagingTara.value = '';
        if (elements.grossWeight) elements.grossWeight.value = '';
        if (elements.invoiceWeight) elements.invoiceWeight.value = '';
        
        // Resetar status
        if (elements.statusDot) elements.statusDot.className = 'status-dot';
        if (elements.statusText) elements.statusText.textContent = 'Novo produto';
        
        calculateTaras();
        
        if (elements.product) {
            elements.product.focus();
        }
        
        showToast('🧹 Formulário limpo', 'info');
    }
    
    function clearAllWeighings() {
        if (weighings.length === 0) {
            showToast('⚠️ Nenhuma pesagem para limpar', 'warning');
            return;
        }
        
        if (confirm(`Limpar todas as ${weighings.length} pesagens?`)) {
            weighings = [];
            saveData();
            
            updateCompactSummary();
            updateTicketTab();
            updateHistoricoTab();
            updateConfigData();
            
            showToast('✅ Todas as pesagens foram limpas', 'success');
        }
    }
    
    function clearAllData() {
        if (confirm('⚠️ ATENÇÃO!\n\nIsso vai apagar TODOS os dados (pesagens e produtos).\n\nTem certeza?')) {
            localStorage.clear();
            
            // Recargar estado vacío
            products = {};
            weighings = [];
            
            // Actualizar todo
            updateCompactSummary();
            updateTicketTab();
            updateHistoricoTab();
            updateProductList();
            updateConfigData();
            
            showToast('✅ Todos os dados foram apagados', 'success');
        }
    }
    
    // ===== EXPORTACIÓN =====
    
    function exportToCSV() {
        if (weighings.length === 0) {
            showToast('⚠️ Nenhuma pesagem para exportar', 'warning');
            return;
        }
        
        const headers = [
            'Produto', 'Fornecedor', 'Caixas', 'Tara Caixa',
            'Embalagens', 'Tara Embalagem', 'Tara Total',
            'Peso Bruto', 'Peso Líquido', 'Peso Nota',
            'Diferença', 'Data/Hora'
        ];
        
        const csvRows = [
            headers.join(';'),
            ...weighings.map(w => [
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
        
        showToast('✅ CSV exportado com sucesso', 'success');
    }
    
    // ===== IMPRESIÓN =====
    
    function printThermalTicket() {
        if (weighings.length === 0) {
            showToast('⚠️ Nenhuma pesagem para imprimir', 'warning');
            return;
        }
        
        const recentWeighings = weighings.slice(0, 10);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        const totalTara = recentWeighings.reduce((sum, w) => sum + w.totalTara, 0);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket de Pesagem</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body { 
                            margin: 5mm; 
                            padding: 0; 
                            width: 70mm; 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px; 
                            line-height: 1.2; 
                            color: #000; 
                        }
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
                    <p>Ticket #${String(weighings.length).padStart(3, '0')}</p>
                </div>
                
                ${recentWeighings.map(w => {
                    const diffText = w.difference !== null ? 
                        `(${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg)` : '';
                    
                    return `
                        <div class="item">
                            <div><strong>${w.product.substring(0, 15)}${w.product.length > 15 ? '...' : ''}</strong></div>
                            <div style="font-size: 10px;">${w.supplier || '—'}</div>
                            <div style="display: flex; justify-content: space-between; font-size: 10px;">
                                <span>Bruto: ${w.grossWeight.toFixed(2)}kg</span>
                                ${w.invoiceWeight > 0 ? `<span>Nota: ${w.invoiceWeight.toFixed(2)}kg</span>` : ''}
                            </div>
                            <div style="font-size: 10px;">Tara: ${w.totalTara.toFixed(2)}kg</div>
                            <div style="text-align: right; font-weight: bold;">
                                Líq: ${w.netWeight.toFixed(2)}kg ${diffText}
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <div class="footer">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                        <span>Total Tara:</span>
                        <span>${totalTara.toFixed(2)} kg</span>
                    </div>
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
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
    
    function printFullPage() {
        if (weighings.length === 0) {
            showToast('⚠️ Nenhuma pesagem para imprimir', 'warning');
            return;
        }
        
        const recentWeighings = weighings.slice(0, 50);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        const totalTara = recentWeighings.reduce((sum, w) => sum + w.totalTara, 0);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Pesagem</title>
                <style>
                    @media print { @page { margin: 15mm; } }
                    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; max-width: 210mm; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #2563eb; color: white; padding: 12px 8px; text-align: left; }
                    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
                    .diff-positive { color: #10b981; }
                    .diff-negative { color: #ef4444; }
                    .summary { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CONTROLE DE PESAGEM</h1>
                    <p>Relatório Completo - ${new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Ticket #${String(weighings.length).padStart(3, '0')}</p>
                </div>
                
                <div class="summary">
                    <div>
                        <div style="font-size: 14px; color: #64748b;">Total Itens</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${recentWeighings.length}</div>
                    </div>
                    <div>
                        <div style="font-size: 14px; color: #64748b;">Tara Total</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${totalTara.toFixed(2)} kg</div>
                    </div>
                    <div>
                        <div style="font-size: 14px; color: #64748b;">Peso Líquido Total</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${totalNet.toFixed(2)} kg</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Fornecedor</th>
                            <th>Bruto</th>
                            <th>Nota</th>
                            <th>Tara</th>
                            <th>Líquido</th>
                            <th>Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentWeighings.map(w => {
                            const diffClass = w.difference >= 0 ? 'diff-positive' : 'diff-negative';
                            const diffText = w.difference !== null ? 
                                `${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg` : '—';
                            
                            return `
                                <tr>
                                    <td>${w.product}</td>
                                    <td>${w.supplier || '—'}</td>
                                    <td>${w.grossWeight.toFixed(2)}kg</td>
                                    <td>${w.invoiceWeight > 0 ? w.invoiceWeight.toFixed(2) + 'kg' : '—'}</td>
                                    <td>${w.totalTara.toFixed(2)}kg</td>
                                    <td><strong>${w.netWeight.toFixed(2)}kg</strong></td>
                                    <td class="${diffClass}">${diffText}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #e0f2fe; font-weight: bold;">
                            <td colspan="4">TOTAL</td>
                            <td>${totalTara.toFixed(2)}kg</td>
                            <td>${totalNet.toFixed(2)}kg</td>
                            <td>—</td>
                        </tr>
                    </tfoot>
                </table>
                
                <script>
                    setTimeout(() => window.print(), 500);
                    window.onafterprint = () => window.close();
                <\/script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
    
    function shareWhatsApp() {
        if (weighings.length === 0) {
            showToast('⚠️ Nenhuma pesagem para compartilhar', 'warning');
            return;
        }
        
        const recentWeighings = weighings.slice(0, 5);
        const totalNet = recentWeighings.reduce((sum, w) => sum + w.netWeight, 0);
        const totalTara = recentWeighings.reduce((sum, w) => sum + w.totalTara, 0);
        
        let message = `*CONTROLE DE PESAGEM*\n`;
        message += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
        message += `*Ticket:* #${String(weighings.length).padStart(3, '0')}\n`;
        message += `*Itens Hoje:* ${recentWeighings.length}\n`;
        message += `*Tara Total:* ${totalTara.toFixed(2)}kg\n\n`;
        
        recentWeighings.forEach(w => {
            message += `*${w.product}*\n`;
            message += `Fornecedor: ${w.supplier || '—'}\n`;
            message += `Bruto: ${w.grossWeight.toFixed(2)}kg\n`;
            message += `Nota: ${w.invoiceWeight > 0 ? w.invoiceWeight.toFixed(2) : '—'}kg\n`;
            message += `Tara: ${w.totalTara.toFixed(2)}kg\n`;
            message += `Líquido: ${w.netWeight.toFixed(2)}kg\n`;
            if (w.difference !== null) {
                message += `Diferença: ${w.difference >= 0 ? '+' : ''}${w.difference.toFixed(2)}kg\n`;
            }
            message += `\n`;
        });
        
        message += `*TOTAL LÍQUIDO:* ${totalNet.toFixed(2)} kg\n`;
        message += `_Enviado via Controle de Pesagem_`;
        
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        
        showToast('📤 Compartilhando via WhatsApp...', 'info');
    }
    
    // ===== FUNCIONES ADICIONALES =====
    
    function checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    showToast('🔄 Verificando atualizações...', 'info');
                    
                    reg.update().then(() => {
                        setTimeout(() => {
                            showToast('✅ Aplicação está atualizada!', 'success');
                        }, 1000);
                    }).catch(error => {
                        showToast('❌ Erro ao verificar atualizações', 'error');
                        console.error('Error checking updates:', error);
                    });
                }
            });
        } else {
            showToast('⚠️ Service Worker não suportado', 'warning');
        }
    }
    
    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    
                    if (file.name.endsWith('.json')) {
                        const data = JSON.parse(content);
                        if (data.weighings && data.products) {
                            weighings = data.weighings;
                            products = data.products;
                            saveData();
                            updateAllUI();
                            showToast('✅ Dados importados com sucesso!', 'success');
                        }
                    } else if (file.name.endsWith('.csv')) {
                        showToast('📄 Importação de CSV em desenvolvimento', 'info');
                    }
                } catch (error) {
                    showToast('❌ Erro ao importar dados: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    function backupData() {
        const data = {
            weighings: weighings,
            products: products,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_pesagem_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast('✅ Backup criado com sucesso!', 'success');
    }
    
    function updateAllUI() {
        updateCompactSummary();
        updateTicketTab();
        updateHistoricoTab();
        updateProductList();
        updateConfigData();
    }
    
    // ===== TOAST NOTIFICATIONS =====
    
    function showToast(message, type = 'info') {
        console.log(`💬 Toast [${type}]: ${message}`);
        
        // Crear container si no existe
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        
        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${type === 'success' ? '#10b981' : 
                                      type === 'error' ? '#ef4444' : 
                                      type === 'warning' ? '#f59e0b' : '#2563eb'};
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            min-width: 280px;
            max-width: 360px;
        `;
        
        // Icono según tipo
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}" style="color: ${type === 'success' ? '#10b981' : 
                                                   type === 'error' ? '#ef4444' : 
                                                   type === 'warning' ? '#f59e0b' : '#2563eb'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // ===== EXPORTAR FUNCIONES =====
    
    window.app = {
        calculateTaras,
        updateCompactSummary,
        updateTicketTab,
        clearForm,
        clearAllWeighings,
        exportToCSV,
        printThermalTicket,
        shareWhatsApp,
        showToast,
        checkForUpdates,
        getStats: () => ({
            weighings: weighings.length,
            products: Object.keys(products).length
        })
    };
    
    console.log('🎉 App completamente cargada y lista!');
});