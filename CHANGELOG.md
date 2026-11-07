# Changelog

## [0.2.0](https://github.com/MViniciusCoffe/SpendSmart/compare/v0.1.0...v0.2.0) (2026-11-07)


### Funcionalidades

* adiciona Open Graph por página nas rotas públicas ([06bf3f4](https://github.com/MViniciusCoffe/SpendSmart/commit/06bf3f4155304986b9329b935fb88c16c8ac4561))
* **api:** devolve a versão no /api/health ([#56](https://github.com/MViniciusCoffe/SpendSmart/issues/56)) ([a93c7e0](https://github.com/MViniciusCoffe/SpendSmart/commit/a93c7e0daaff9287e3cdbd43ad8564bda6e449e8))
* **db:** adiciona health_check() para checar o banco com a chave pública ([4c94626](https://github.com/MViniciusCoffe/SpendSmart/commit/4c946260ae6d7c86057737a1f39624815cf1abd3))
* **db:** restringe os privilégios das tabelas e tira o acesso do anon ([d5090c6](https://github.com/MViniciusCoffe/SpendSmart/commit/d5090c653124e08e3bda8fe974c69f831a2284a2))
* gera a imagem de Open Graph a partir do código ([7e282c6](https://github.com/MViniciusCoffe/SpendSmart/commit/7e282c609c1e16999f2d89d922b18781bf87f3c8))
* **security:** adiciona CSP com nonce, headers de segurança e metadados por rota ([#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24)) ([b672579](https://github.com/MViniciusCoffe/SpendSmart/commit/b672579255be30b7a257012f1e126553ad548871))
* **security:** exige nonce em &lt;style&gt; e libera só o atributo style na CSP ([#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24)) ([7a9360d](https://github.com/MViniciusCoffe/SpendSmart/commit/7a9360de1728a79a9594342180dc03d9820ab127))


### Correções

* **api:** cria o cliente admin na requisição e corrige as checagens do /api/status ([bde1673](https://github.com/MViniciusCoffe/SpendSmart/commit/bde1673fadb9c90a81a51a056e47f3b728add244))
* **api:** inclui o código do /api/status sem o cliente admin ([95aff41](https://github.com/MViniciusCoffe/SpendSmart/commit/95aff41be1a9fe752dc35bc9d3e6a2227b861d08))
* **api:** não devolve erro interno nas rotas privilegiadas e trata corpo inválido ([d21cf48](https://github.com/MViniciusCoffe/SpendSmart/commit/d21cf48edf58a4ef4dae8cc3124b4464cd63e9f3))
* **api:** tira o cliente admin do /api/status e remove checagens de serviços não usados ([26bd9a1](https://github.com/MViniciusCoffe/SpendSmart/commit/26bd9a1155e4f4d67df20324ca5212eb43b07526))
* **migrations:** remove migrations .js duplicadas ([#8](https://github.com/MViniciusCoffe/SpendSmart/issues/8)) ([57c0efd](https://github.com/MViniciusCoffe/SpendSmart/commit/57c0efda11e5fe4b4eaec8e5cf1322f0113f9793))
* **test:** aplica collectCoverageFrom no nível global do Jest ([c207bba](https://github.com/MViniciusCoffe/SpendSmart/commit/c207bba3bb7836acd000d74b231564eb460e3c0e))
* traduz o erro de senha igual à atual e valida o tamanho antes do envio ([#11](https://github.com/MViniciusCoffe/SpendSmart/issues/11)) ([336c1ae](https://github.com/MViniciusCoffe/SpendSmart/commit/336c1aebde902ae74aa79a9bb2ef8e51e97313c6))


### Refatoração

* remove configuração webpack sem efeito do next.config.js ([5fbf62c](https://github.com/MViniciusCoffe/SpendSmart/commit/5fbf62cdc87f88a8035139c452d8a195aba7b09f))
* **services:** pede colunas explícitas no retorno de insert e update ([cfb1acb](https://github.com/MViniciusCoffe/SpendSmart/commit/cfb1acbe70898c33c95f26f778c7dcb659d6e87f))
* **services:** remove `utils.js` sem uso ([72c2c08](https://github.com/MViniciusCoffe/SpendSmart/commit/72c2c08d2c15e6fbaa14514c29609111d57d006e))
* **status:** remove revalidate sem efeito e import de tipo em runtime ([48949c2](https://github.com/MViniciusCoffe/SpendSmart/commit/48949c2982c64367577a834927e418758ca78b38))


### Documentação

* adiciona comportamento da preview em `environment.md` ([afe12b8](https://github.com/MViniciusCoffe/SpendSmart/commit/afe12b83e5dbb78845d35ce7ae928b880bd71869))
* adiciona templates de issue/PR e SECURITY.md ([#52](https://github.com/MViniciusCoffe/SpendSmart/issues/52), [#54](https://github.com/MViniciusCoffe/SpendSmart/issues/54)) ([0c5c873](https://github.com/MViniciusCoffe/SpendSmart/commit/0c5c873d3cf9b3cde54b5f7e53adc25f27ba1276))
* atualiza arquitetura para refletir o estado atual do projeto ([05e2765](https://github.com/MViniciusCoffe/SpendSmart/commit/05e27652b9b8bf4f30b72bb707879d9bae180b1f))
* atualiza contagem de testes ([804621c](https://github.com/MViniciusCoffe/SpendSmart/commit/804621cb44a0e781c48de821f12d5734820f2693))
* atualiza contagens de testes e score de mutação ([9b0e637](https://github.com/MViniciusCoffe/SpendSmart/commit/9b0e637bc3a9e69235f3b8a31046bc0accc5a1a9))
* atualiza documentação para refletir estado atual dos testes e implementação ([27dc61a](https://github.com/MViniciusCoffe/SpendSmart/commit/27dc61a5017ba26482845faff99040a4dd977811))
* atualiza plano de testes com o escopo da P3 e o estado real da suíte ([dc64869](https://github.com/MViniciusCoffe/SpendSmart/commit/dc64869daeb764a701d6ef847ad8dcb77430bd34))
* cria convenções de código e registra defeitos e privilégios fora do AGENTS ([cc857d2](https://github.com/MViniciusCoffe/SpendSmart/commit/cc857d23518c6f11f4b42cf4e3a335f96d9070e2))
* documenta ambientes separados e o fluxo de migrations ([#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20)) ([c929b6d](https://github.com/MViniciusCoffe/SpendSmart/commit/c929b6d7950969c05955ea6068da9aaca5557c60))
* explica que o dry-run não testa o SQL e que infra:reset apaga os dados locais ([93c78b4](https://github.com/MViniciusCoffe/SpendSmart/commit/93c78b4ff1ab165efde5dcf51ae8c904e1c543f9))
* registra as decisões de automação e atualiza contagens ([5c42f9a](https://github.com/MViniciusCoffe/SpendSmart/commit/5c42f9a2fc867c9c6c7a0c049a9f32fdd3b01c09))
* registra remoção do drift do projeto de Preview ([#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20)) ([27f6b32](https://github.com/MViniciusCoffe/SpendSmart/commit/27f6b328caeade59539eae507532054a26719599))
