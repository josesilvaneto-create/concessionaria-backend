// Configuração da API
const API_BASE_URL = 'https://seu-backend.onrender.com/api';

// Estado global dos filtros
let filtrosAtuais = {};
let todosVeiculos = [];

// Carregar veículos
async function carregarVeiculos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/veiculos`);
        const data = await response.json();
        
        if (response.ok) {
            todosVeiculos = data.veiculos;
            exibirVeiculos(todosVeiculos);
            preencherFiltros(todosVeiculos);
        } else {
            throw new Error(data.error || 'Erro ao carregar veículos');
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('veiculos-container').innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar veículos: ${error.message}</p>
            </div>
        `;
    } finally {
        mostrarLoading(false);
    }
}

// Exibir veículos na grid
function exibirVeiculos(veiculos) {
    const container = document.getElementById('veiculos-container');
    const noVehicles = document.getElementById('no-vehicles');
    
    if (veiculos.length === 0) {
        container.classList.add('hidden');
        noVehicles.classList.remove('hidden');
        return;
    }
    
    noVehicles.classList.add('hidden');
    container.classList.remove('hidden');
    
    container.innerHTML = veiculos.map(veiculo => `
        <div class="vehicle-card">
            <div class="vehicle-image">
                <span>${veiculo.marca} ${veiculo.modelo}</span>
            </div>
            <div class="vehicle-info">
                <h3>${veiculo.marca} ${veiculo.modelo}</h3>
                <div class="vehicle-price">R$ ${formatarPreco(veiculo.preco)}</div>
                <div class="vehicle-details">
                    <p><strong>Ano:</strong> ${veiculo.ano}</p>
                    <p><strong>KM:</strong> ${veiculo.quilometragem.toLocaleString()} km</p>
                    <p><strong>Combustível:</strong> ${veiculo.combustivel}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    ${veiculo.descricao ? `<p><strong>Descrição:</strong> ${veiculo.descricao}</p>` : ''}
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-primary" onclick="visualizarVeiculo(${veiculo.id})">
                        Ver Detalhes
                    </button>
                    ${isMeuVeiculo(veiculo) ? `
                        <button class="btn btn-outline" onclick="editarVeiculo(${veiculo.id})">
                            Editar
                        </button>
                        <button class="btn btn-outline" onclick="excluirVeiculo(${veiculo.id})" style="color: var(--danger-color); border-color: var(--danger-color);">
                            Excluir
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Preencher opções de filtros
function preencherFiltros(veiculos) {
    const marcas = [...new Set(veiculos.map(v => v.marca))].sort();
    const selectMarca = document.getElementById('filter-marca');
    
    selectMarca.innerHTML = '<option value="">Todas as marcas</option>' +
        marcas.map(marca => `<option value="${marca}">${marca}</option>`).join('');
}

// Aplicar filtros
function aplicarFiltros() {
    const marca = document.getElementById('filter-marca').value;
    const combustivel = document.getElementById('filter-combustivel').value;
    const precoMax = document.getElementById('filter-preco-max').value;
    
    filtrosAtuais = { marca, combustivel, precoMax };
    
    let veiculosFiltrados = todosVeiculos;
    
    if (marca) {
        veiculosFiltrados = veiculosFiltrados.filter(v => v.marca === marca);
    }
    
    if (combustivel) {
        veiculosFiltrados = veiculosFiltrados.filter(v => v.combustivel === combustivel);
    }
    
    if (precoMax) {
        veiculosFiltrados = veiculosFiltrados.filter(v => v.preco <= parseFloat(precoMax));
    }
    
    exibirVeiculos(veiculosFiltrados);
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filter-marca').value = '';
    document.getElementById('filter-combustivel').value = '';
    document.getElementById('filter-preco-max').value = '';
    
    filtrosAtuais = {};
    exibirVeiculos(todosVeiculos);
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    document.getElementById('loading').classList.toggle('hidden', !mostrar);
}

// Formatar preço
function formatarPreco(preco) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(preco);
}

// Verificar se o veículo pertence ao usuário logado
function isMeuVeiculo(veiculo) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return veiculo.criado_por === user.id;
}

// Cadastrar veículo
async function cadastrarVeiculo(veiculoData) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(veiculoData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, veiculo: data.veiculo };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Erro ao cadastrar veículo:', error);
        return { success: false, error: 'Erro de conexão' };
    }
}

// Visualizar veículo
function visualizarVeiculo(id) {
    alert(`Visualizando veículo ${id}\nEsta funcionalidade pode ser expandida para uma página de detalhes.`);
}

// Editar veículo
function editarVeiculo(id) {
    alert(`Editando veículo ${id}\nEsta funcionalidade pode ser expandida para um formulário de edição.`);
}

// Excluir veículo
async function excluirVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/veiculos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Veículo excluído com sucesso!');
            carregarVeiculos(); // Recarregar a lista
        } else {
            alert('Erro ao excluir veículo: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        alert('Erro de conexão ao excluir veículo');
    }
}