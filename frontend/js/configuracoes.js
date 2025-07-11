/**
 * configuracoes.js
 * Script para gerenciar as configurações do sistema ERP Axel
 */

(() => {
    // Array para armazenar referências dos event listeners para limpeza posterior
    const activeListeners = [];

    // Função de inicialização global
    const initConfiguracoes = () => {
        console.log('[Configurações] Inicializando módulo de configurações...');
        
        carregarConfiguracoes();
        configurarEventListeners();
        inicializarTooltips();
        
        console.log('[Configurações] Módulo inicializado com sucesso.');
    };

    // Função de limpeza global
    const cleanupConfiguracoes = () => {
        console.log('[Configurações] Limpando módulo de configurações...');
        
        // Remove todos os listeners ativos
        activeListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        activeListeners.length = 0; // Esvazia o array
        
        // Limpar tooltips
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            const tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
            if (tooltip) {
                tooltip.dispose();
            }
        });

        console.log('[Configurações] Limpeza concluída.');
    };

    // Função auxiliar para adicionar listeners e guardá-los para remoção
    const addManagedListener = (element, event, handler) => {
        if (element) {
            element.addEventListener(event, handler);
            activeListeners.push({ element, event, handler });
        }
    };

    function carregarConfiguracoes() {
        try {
            // Carregar configurações do localStorage
            const configs = JSON.parse(localStorage.getItem('axelConfigs') || '{}');
            
            // Aplicar configurações aos campos
            if (configs.empresaNome) {
                const campo = document.getElementById('empresaNome');
                if (campo) campo.value = configs.empresaNome;
            }
            
            if (configs.unidadeGestora) {
                const campo = document.getElementById('unidadeGestora');
                if (campo) campo.value = configs.unidadeGestora;
            }
            
            if (configs.timezone) {
                const campo = document.getElementById('timezone');
                if (campo) campo.value = configs.timezone;
            }
            
            if (configs.idioma) {
                const campo = document.getElementById('idioma');
                if (campo) campo.value = configs.idioma;
            }
            
            if (configs.emailNotificacoes) {
                const campo = document.getElementById('emailNotificacoes');
                if (campo) campo.value = configs.emailNotificacoes;
            }
            
            if (configs.cacheTimeout) {
                const campo = document.getElementById('cacheTimeout');
                if (campo) campo.value = configs.cacheTimeout;
            }
            
            if (configs.registrosPorPagina) {
                const campo = document.getElementById('registrosPorPagina');
                if (campo) campo.value = configs.registrosPorPagina;
            }
            
            // Configurar checkboxes
            const checkboxes = {
                'notifEmail': configs.notifEmail !== false,
                'notifSistema': configs.notifSistema !== false,
                'notifWhatsapp': configs.notifWhatsapp === true,
                'backupAutomatico': configs.backupAutomatico === true,
                'lazyLoading': configs.lazyLoading !== false
            };
            
            Object.keys(checkboxes).forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = checkboxes[id];
                }
            });
            
            console.log('[Configurações] Configurações carregadas com sucesso.');
            
        } catch (error) {
            console.error('[Configurações] Erro ao carregar configurações:', error);
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification('Erro', 'Erro ao carregar configurações salvas.', 'error');
            }
        }
    }

    function configurarEventListeners() {
        // Formulários
        addManagedListener(document.getElementById('configGeraisForm'), 'submit', handleConfigGeraisSubmit);
        addManagedListener(document.getElementById('configNotificacoesForm'), 'submit', handleConfigNotificacoesSubmit);
        
        // Botões
        addManagedListener(document.getElementById('btnBackup'), 'click', handleBackup);
        addManagedListener(document.getElementById('btnRestaurar'), 'click', handleRestaurar);
        addManagedListener(document.getElementById('btnLimparLogs'), 'click', handleLimparLogs);
        
        // Inputs de performance
        addManagedListener(document.getElementById('registrosPorPagina'), 'change', handlePerformanceChange);
        addManagedListener(document.getElementById('cacheTimeout'), 'change', handlePerformanceChange);
    }

    function inicializarTooltips() {
        // Inicializar tooltips do Bootstrap
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    function handleConfigGeraisSubmit(e) {
        e.preventDefault();
        
        try {
            const configs = {
                empresaNome: document.getElementById('empresaNome').value,
                unidadeGestora: document.getElementById('unidadeGestora').value,
                timezone: document.getElementById('timezone').value,
                idioma: document.getElementById('idioma').value
            };
            
            // Validar campos obrigatórios
            if (!configs.empresaNome.trim()) {
                throw new Error('Nome da empresa é obrigatório');
            }
            
            // Salvar no localStorage
            const configsExistentes = JSON.parse(localStorage.getItem('axelConfigs') || '{}');
            const configsAtualizadas = { ...configsExistentes, ...configs };
            localStorage.setItem('axelConfigs', JSON.stringify(configsAtualizadas));
            
            // Mostrar notificação de sucesso
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification(
                    'Configurações Salvas', 
                    'As configurações gerais foram salvas com sucesso.', 
                    'success'
                );
            }
            
            console.log('[Configurações] Configurações gerais salvas:', configs);
            
        } catch (error) {
            console.error('[Configurações] Erro ao salvar configurações gerais:', error);
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification('Erro', error.message, 'error');
            }
        }
    }

    function handleConfigNotificacoesSubmit(e) {
        e.preventDefault();
        
        try {
            const configs = JSON.parse(localStorage.getItem('axelConfigs') || '{}');
            
            configs.notifEmail = document.getElementById('notifEmail').checked;
            configs.notifSistema = document.getElementById('notifSistema').checked;
            configs.notifWhatsapp = document.getElementById('notifWhatsapp').checked;
            configs.emailNotificacoes = document.getElementById('emailNotificacoes').value;
            
            // Validar e-mail se notificações por e-mail estiverem ativadas
            if (configs.notifEmail && configs.emailNotificacoes) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(configs.emailNotificacoes)) {
                    throw new Error('E-mail inválido');
                }
            }
            
            localStorage.setItem('axelConfigs', JSON.stringify(configs));
            
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification(
                    'Notificações Configuradas', 
                    'As configurações de notificação foram salvas.', 
                    'success'
                );
            }
            
            console.log('[Configurações] Configurações de notificação salvas:', configs);
            
        } catch (error) {
            console.error('[Configurações] Erro ao salvar notificações:', error);
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification('Erro', error.message, 'error');
            }
        }
    }

    function handleBackup() {
        const btn = document.getElementById('btnBackup');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Realizando Backup...';
        btn.disabled = true;
        
        // Simular processo de backup
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification(
                    'Backup Concluído', 
                    'O backup dos dados foi realizado com sucesso.', 
                    'success'
                );
            }
        }, 2000);
    }

    function handleRestaurar() {
        if (window.appUtils && window.appUtils.showNotification) {
            window.appUtils.showNotification(
                'Ação Requer Confirmação', 
                'A restauração de dados ainda será implementada.', 
                'warning'
            );
        }
    }

    function handleLimparLogs() {
        const btn = document.getElementById('btnLimparLogs');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Limpando...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification(
                    'Logs Limpos', 
                    'Os logs de sistema foram limpos.', 
                    'info'
                );
            }
        }, 1000);
    }

    function handlePerformanceChange() {
        try {
            const configs = JSON.parse(localStorage.getItem('axelConfigs') || '{}');
            
            configs.registrosPorPagina = parseInt(document.getElementById('registrosPorPagina').value, 10);
            configs.cacheTimeout = parseInt(document.getElementById('cacheTimeout').value, 10);
            
            localStorage.setItem('axelConfigs', JSON.stringify(configs));
            
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification(
                    'Configurações de Performance Salvas', 
                    'As alterações de performance foram salvas e serão aplicadas na próxima recarga.', 
                    'success'
                );
            }
        } catch (error) {
            console.error('[Configurações] Erro ao salvar configurações de performance:', error);
            if (window.appUtils && window.appUtils.showNotification) {
                window.appUtils.showNotification('Erro', 'Erro ao salvar configurações de performance.', 'error');
            }
        }
    }

    // Expõe as funções de inicialização e limpeza para o escopo global
    window.initConfiguracoes = initConfiguracoes;
    window.cleanupConfiguracoes = cleanupConfiguracoes;

})(); 