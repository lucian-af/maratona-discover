const modal = {
	open() {
		document
			.querySelector('.modal-overlay')
			.classList
			.add('active');
	},
	close() {
		document
			.querySelector('.modal-overlay.active')
			.classList
			.remove('active');
	},
	toggle() {
		document
			.querySelector('.modal-overlay')
			.classList
			.toggle('active');
	}
}

const Storage = {
	transacoesKey: 'transacoes',
	get() {
		return JSON.parse(localStorage.getItem(this.transacoesKey)) || [];
	},
	set(transacoes) {
		localStorage
			.setItem(this.transacoesKey, JSON.stringify(transacoes));
	}
}

const Transacao = {
	todas: Storage.get(),
	inserir(transacao) {
		let proximoId = this.todas
			.map(trans => trans.id)
			.reduce((p, n) => {
				p = Math.max(p, n);
				return p;
			}, 0);
		transacao.id = proximoId + 1;
		this.todas.push(transacao)
		App.reload()
	},
	remover(id) {
		const buscarPorId = this.todas.find(trans => trans.id === id)
		const index = this.todas.indexOf(buscarPorId)
		this.todas.splice(index, 1);
		App.reload()
	},
	entradas() {
		const entrada = this.todas
			.filter(trans => trans.valor > 0)
			.map(trans => trans.valor)
			.reduce((ant, next) => ant + next, 0)
		return entrada
	},
	saidas() {
		const saidas = this.todas
			.filter(trans => trans.valor < 0)
			.map(trans => trans.valor)
			.reduce((ant, next) => ant + next, 0)
		return saidas
	},
	total() {
		return this.entradas() + this.saidas()
	}
}

const Form = {
	descricao: document.getElementById('txtDescricao'),
	valor: document.getElementById('txtValor'),
	data: document.getElementById('txtData'),
	obterValores() {
		return {
			descricao: Form.descricao.value,
			valor: Form.valor.value,
			data: Form.data.value
		}
	},
	formatarDados() {
		let { descricao, valor, data } = this.obterValores();
		valor = Utils.somenteNumero(valor);
		data = Utils.formatarData(data);
		return {
			descricao,
			valor,
			data
		}
	},
	validar() {
		const { descricao, valor, data } = this.obterValores();
		if (descricao.trim() === '' ||
			valor.trim() === '' ||
			data.trim() === '') {
			throw new Error('Por favor, preencha todos os campos!')
		}
	},
	salvar(transacao) {
		Transacao.inserir(transacao);
	},
	submit(event) {
		event.preventDefault();

		try {
			this.validar();
			const transacao = this.formatarDados();
			this.salvar(transacao);
			this.limpar();
		} catch (error) {
			alert(error.message);
			return;
		}
		modal.toggle();
	},
	limpar() {
		this.descricao.value = '';
		this.valor.value = '';
		this.data.value = '';
	}
}

const DOM = {
	transacaoContainer: document.querySelector('#dados tbody'),
	adicionarTransacao(transacao) {
		const tr = document.createElement('tr');
		tr.innerHTML = DOM.innerHTMLTransacao(transacao);
		DOM.transacaoContainer.appendChild(tr);
	},
	innerHTMLTransacao(transacao) {
		const CSSClass = transacao.valor > 0 ? 'entrada' : 'saida';
		const valor = Utils.formatarMoeda(transacao.valor);

		const html = `			
			<td class="descricao">${transacao.descricao}</td>
			<td class="${CSSClass}">
				${valor}
			</td>
			<td>${transacao.data}</td>
			<td><img onclick="Transacao.remover(${transacao.id})" src="/assets/minus.svg" alt="remover transação"></td>
		`
		return html;
	},
	atualizar(id, valor) {
		document
			.getElementById(id)
			.innerHTML = Utils.formatarMoeda(valor)
	},
	atualizarBalanco() {
		DOM.atualizar('card-entrada', Transacao.entradas())
		DOM.atualizar('card-saida', Transacao.saidas())
		DOM.atualizar('card-total', Transacao.total())
	},
	limparTransacoes() {
		this.transacaoContainer.innerHTML = ''
	}
}

const Utils = {
	formatarData(data) {
		const splitData = data.split('-');
		return splitData
			.sort((a, b) => splitData.indexOf(b) - splitData.indexOf(a))
			.join('/');
	},
	somenteNumero(valor) {
		return Number(valor) * 100;
	},
	formatarMoeda(valor) {
		const sinal = Number(valor) < 0 ? '-' : '';
		valor = String(valor).replace(/\D/g, '')
		valor = Number(valor) / 100
		valor = valor.toLocaleString("pt-BR",
			{
				style: 'currency',
				currency: 'BRL'
			})
		return `${sinal}${valor}`;
	}
}

const App = {
	init() {
		Transacao.todas.forEach(trans => DOM.adicionarTransacao(trans))
		DOM.atualizarBalanco()
		Storage.set(Transacao.todas);
	},
	reload() {
		DOM.limparTransacoes()
		this.init()
	}
}

App.init()